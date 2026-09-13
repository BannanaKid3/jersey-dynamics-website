const teamNames = [
  'Manipulation + Hand', 'Arms + Structure', 'Mobility', 'Perception + Head',
  'Autonomy + Controls', 'Electronics + Embedded', 'Simulation', 'Research',
  'Systems + Integration', 'Product + Operations', 'Documentation + Release',
  'Community + Partnerships'
];

const form = document.querySelector('#interest-form');
const teamBox = document.querySelector('#team-options');
const message = document.querySelector('#form-message');
const submitButton = form.querySelector('button[type="submit"]');
const params = new URLSearchParams(location.search);

teamNames.forEach((name) => {
  const label = document.createElement('label');
  const input = document.createElement('input');
  const text = document.createElement('span');
  input.type = 'checkbox'; input.name = 'interests'; input.value = name; text.textContent = name;
  label.append(input, text); teamBox.append(label);
});

const requestedPath = params.get('path');
if (['contributor', 'leadership', 'partner'].includes(requestedPath)) form.elements.path.value = requestedPath;
const requestedTeam = params.get('team');
if (requestedTeam) {
  const input = [...form.elements.interests].find((item) => item.value === requestedTeam);
  if (input) input.checked = true;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const payload = {
    name: data.get('name'), email: data.get('email'), path: data.get('path'),
    location: data.get('location'), experience: data.get('experience'), availability: data.get('availability'),
    note: data.get('note'), interests: data.getAll('interests'), website: data.get('website'),
    age_confirmed: data.get('age') === 'on', consent: data.get('consent') === 'on',
    source: params.get('source') || params.get('utm_source') || 'direct',
    utm_source: params.get('utm_source') || '', utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '', referrer: document.referrer
  };

  message.className = 'message'; message.textContent = 'Sending…'; submitButton.disabled = true;
  try {
    const response = await fetch('/api/signup', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'We could not save your response. Please try again.');
    form.reset(); message.className = 'message success';
    message.textContent = 'Received. We’ll follow up by email with the best next step.';
  } catch (error) {
    message.className = 'message error';
    message.textContent = `${error.message} You can also email jerseydynamicsrobotics@gmail.com.`;
  } finally { submitButton.disabled = false; }
});
