# Jersey Dynamics website

Public site for Jersey Dynamics, a student-led open-source humanoid robotics initiative.

## Routes

- `/` — project overview, JD Hand status, subsystem teams, and participation paths
- `/join` — contributor, subsystem ownership, and partner intake
- `/privacy` — intake-data privacy notice
- `/api/signup` — validated intake delivery to a configured database, webhook, or email provider

## Local checks

```bash
npm install
npm run check
npx vercel dev
```

The production Vercel project is connected to this repository. Keep credentials in Vercel environment variables; never commit them.
