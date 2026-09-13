import { neon } from '@neondatabase/serverless';

const clean = (value, max = 500) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

async function saveToDatabase(submission) {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;
  if (!url) return false;
  const sql = neon(url);
  await sql`CREATE TABLE IF NOT EXISTS jersey_dynamics_signups (
    id BIGSERIAL PRIMARY KEY, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), name TEXT NOT NULL,
    email TEXT NOT NULL, participation_path TEXT NOT NULL, broad_location TEXT, interests JSONB NOT NULL DEFAULT '[]'::jsonb,
    experience TEXT, availability TEXT, note TEXT, consent BOOLEAN NOT NULL, age_confirmed BOOLEAN NOT NULL,
    source TEXT, utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, referrer TEXT
  )`;
  await sql`INSERT INTO jersey_dynamics_signups
    (name,email,participation_path,broad_location,interests,experience,availability,note,consent,age_confirmed,source,utm_source,utm_medium,utm_campaign,referrer)
    VALUES (${submission.name},${submission.email},${submission.path},${submission.location},${JSON.stringify(submission.interests)}::jsonb,${submission.experience},${submission.availability},${submission.note},${submission.consent},${submission.age_confirmed},${submission.source},${submission.utm_source},${submission.utm_medium},${submission.utm_campaign},${submission.referrer})`;
  return true;
}

async function sendToWebhook(submission) {
  const url = process.env.INTAKE_WEBHOOK_URL || process.env.SIGNUP_WEBHOOK_URL || process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!url) return false;
  const response = await fetch(url, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(submission), redirect:'follow' });
  if (!response.ok) throw new Error(`Intake webhook returned ${response.status}`);
  return true;
}

async function sendByEmail(submission) {
  if (!process.env.RESEND_API_KEY || !process.env.INTAKE_EMAIL_TO) return false;
  const body = [
    `Name: ${submission.name}`, `Email: ${submission.email}`, `Path: ${submission.path}`,
    `Location: ${submission.location || 'Not provided'}`, `Interests: ${submission.interests.join(', ') || 'Not provided'}`,
    `Experience: ${submission.experience || 'Not provided'}`, `Availability: ${submission.availability || 'Not provided'}`,
    `Note: ${submission.note || 'Not provided'}`, `Source: ${submission.source || 'direct'}`
  ].join('\n');
  const response = await fetch('https://api.resend.com/emails', { method:'POST', headers:{'content-type':'application/json',authorization:`Bearer ${process.env.RESEND_API_KEY}`}, body:JSON.stringify({from:process.env.INTAKE_EMAIL_FROM || 'Jersey Dynamics <onboarding@resend.dev>',to:[process.env.INTAKE_EMAIL_TO],reply_to:submission.email,subject:`Jersey Dynamics interest: ${submission.name}`,text:body}) });
  if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
  return true;
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') return response.status(405).json({ok:false});
  const body = typeof request.body === 'string' ? JSON.parse(request.body || '{}') : (request.body || {});
  if (clean(body.website)) return response.status(200).json({ok:true});

  const submission = {
    name:clean(body.name,100), email:clean(body.email,254).toLowerCase(), path:clean(body.path,40),
    location:clean(body.location,100), experience:clean(body.experience,300), availability:clean(body.availability,100),
    note:clean(body.note,2000), interests:Array.isArray(body.interests) ? body.interests.map((x)=>clean(x,80)).filter(Boolean).slice(0,12) : [],
    age_confirmed:body.age_confirmed === true, consent:body.consent === true,
    source:clean(body.source,100), utm_source:clean(body.utm_source,100), utm_medium:clean(body.utm_medium,100),
    utm_campaign:clean(body.utm_campaign,100), referrer:clean(body.referrer,500)
  };
  if (!submission.name || !validEmail(submission.email) || !['contributor','leadership','partner'].includes(submission.path) || !submission.age_confirmed || !submission.consent) {
    return response.status(400).json({ok:false,error:'Please complete the required fields.'});
  }
  try {
    const outcomes = await Promise.all([saveToDatabase(submission), sendToWebhook(submission), sendByEmail(submission)]);
    if (!outcomes.some(Boolean)) return response.status(503).json({ok:false,error:'The intake connection is being finalized.'});
    return response.status(201).json({ok:true});
  } catch (error) {
    console.error('signup_delivery_failed', error instanceof Error ? error.message : 'unknown');
    return response.status(500).json({ok:false,error:'We could not save your response. Please email us directly.'});
  }
}
