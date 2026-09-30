# UNICORE — Class Status

Public dashboard at `/`, protected admin at `/admin`. Plain HTML/CSS/JS + Vercel serverless functions. No build step, no dependencies.

## Structure
```
index.html            public student page        api/data.js       PUBLIC read-only
admin/index.html      admin app (login + panel)  api/auth.js       login / logout / session
css/style.css         all styles                 api/teachers.js   ADMIN: create/edit/delete/reorder/status
js/api.js ui.js       fetch wrapper, UI helpers  api/statuses.js   ADMIN: status management
js/public.js          student dashboard          api/_lib.js       storage, cookies, validation, seed data
js/auth.js admin.js teachers.js statuses.js  admin logic
```

## 1. Database (Upstash Redis, free)
1. Push the project to GitHub and import it in Vercel (**Add New → Project**).
2. In the Vercel project: **Storage → Create / Marketplace → Upstash Redis** → connect to the project.
   This adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically.

## 2. Environment variables (Project → Settings → Environment Variables)
| Name | Value |
|---|---|
| `ADMIN_USERNAME` | your admin username |
| `ADMIN_PASSWORD` | a long, unique password |
| `SESSION_SECRET` | random 32+ characters (`openssl rand -hex 32`) |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | added by the Upstash integration |

Then **Redeploy** so the variables take effect.

## 3. Deploy
`git push` (auto-deploys) or `npm i -g vercel && vercel --prod`.

## Local development
```
cp .env.example .env.local     # fill in values
npm i -g vercel && vercel dev  # http://localhost:3000
```
Without database variables, data is kept in memory and resets on restart.

## Replace the example teachers
Easiest: sign in at `/admin` and edit/delete them. To change the first-run defaults, edit `seed()` in `api/_lib.js`
(only used while the database is empty; clear the `unicore:data` key in Upstash to re-seed).

## Security notes
- Credentials exist only as server env vars; passwords are compared in constant time.
- Session = HMAC-signed, `HttpOnly`, `SameSite=Strict`, `Secure` cookie, 12 h expiry.
- `api/teachers.js` and `api/statuses.js` reject any request without a valid session (401), regardless of the UI.
- Students only ever reach `GET /api/data`.
