# SKY SMS — Deployment Guide

## Files you need

| File | Deploy to |
|------|-----------|
| `skysms-frontend-cloudflare-pages.tar.gz` | Cloudflare Pages |
| `skysms-api-server-nodejs.tar.gz` | Railway / Render / Fly.io |

---

## Part 1 — Deploy the API server

### Step 1 — Create a PostgreSQL database

Choose **one** option:

- **Supabase** (free): https://supabase.com → New project → Settings → Database → copy the **Connection String (URI)** (use the **connection pooler** URI for best performance, port 5432 or 6543)
- **Neon** (free): https://neon.tech → New project → copy the connection string
- **Railway Postgres**: Add a Postgres plugin inside your Railway project

---

### Step 2 — Deploy the API on Railway (recommended, free tier available)

1. Go to https://railway.app and create a new project
2. Click **+ New** → **Deploy from local directory** (or use GitHub if you push there)
3. Upload / extract `skysms-api-server-nodejs.tar.gz`
4. The start command is: `node ./dist/index.mjs`
5. Go to **Variables** and add **all** of the environment variables below
6. Under **Networking** → **Public domain** → generate a domain (e.g. `skysms-api.up.railway.app`)
7. Deploy and confirm you see `Server listening port: 8080` in the logs

#### Alternative: Render (also free tier)
1. Go to https://render.com → New Web Service
2. Upload the tar.gz or connect GitHub
3. Build command: *(leave empty — already built)*
4. Start command: `node ./dist/index.mjs`
5. Add all environment variables (see below)

---

### Step 3 — Set environment variables on your API host

Add **every one** of these in your hosting platform's environment/variables panel:

```
# Required — PostgreSQL connection string
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Required — Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Required — HeroSMS API key
HERO_SMS_API_KEY=your-hero-sms-api-key

# Required — OxaPay merchant API key
OXAPAY_MERCHANT_API_KEY=your-oxapay-merchant-key

# Required — Session secret (any long random string, e.g. 64 chars)
SESSION_SECRET=change-this-to-a-long-random-string-at-least-64-chars

# Required — Your production frontend URL (used for CORS + OAuth redirect)
ALLOWED_ORIGIN=https://sky-sms.xyz

# Optional — Port (Railway/Render set this automatically)
PORT=8080
```

> **Supabase tip:** Use the pooler connection string from Supabase → Settings → Database → Connection pooling → URI. It looks like:
> `postgresql://postgres.xxxx:password@aws-0-eu-west-2.pooler.supabase.com:6543/postgres`

---

### Step 4 — Set up Google OAuth

1. Go to https://console.cloud.google.com
2. Create a project (or use an existing one)
3. Enable the **Google OAuth API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Under **Authorized redirect URIs**, add:
   ```
   https://your-api-domain.up.railway.app/api/auth/google/callback
   ```
7. Copy the **Client ID** and **Client Secret** → paste into `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

---

## Part 2 — Deploy the frontend on Cloudflare Pages

### Step 5 — Upload to Cloudflare Pages

1. Go to https://dash.cloudflare.com → **Pages**
2. Click **Create a project** → **Upload assets** (direct upload)
3. Give it a name like `sky-sms`
4. Extract `skysms-frontend-cloudflare-pages.tar.gz` and upload **all files inside** (the `index.html` and `assets/` folder)
5. Click **Deploy**

### Step 6 — Connect your custom domain sky-sms.xyz

1. In Cloudflare Pages → your project → **Custom domains**
2. Click **Set up a custom domain**
3. Enter `sky-sms.xyz`
4. Since your domain is already on Cloudflare, it will automatically add the CNAME record
5. Wait 1–2 minutes for it to activate

### Step 7 — SPA routing (_redirects file)

Cloudflare Pages needs a `_redirects` file to handle React router navigation. Create a file called `_redirects` in the root of your upload with this content:

```
/* /index.html 200
```

This ensures pages like `/dashboard`, `/support`, `/rent` etc. all work when accessed directly.

---

## Part 3 — Email with sky-sms.xyz (Cloudflare Email Routing)

### Receive emails at support@sky-sms.xyz — FREE, no code needed

1. In Cloudflare dashboard → click on `sky-sms.xyz` → **Email** → **Email Routing**
2. Click **Enable Email Routing** (Cloudflare will add the required MX records automatically)
3. Click **Create address**:
   - **Custom address**: `support`  (becomes support@sky-sms.xyz)
   - **Action**: Send to → your Gmail or any personal email
4. Cloudflare sends a verification to your personal email — click the link
5. Done. Emails sent to `support@sky-sms.xyz` now land in your inbox

You can create as many addresses as you want:
- `support@sky-sms.xyz` → your inbox
- `noreply@sky-sms.xyz` → your inbox  
- `admin@sky-sms.xyz` → your inbox

### Send emails FROM sky-sms.xyz (payment confirmations) — optional

Use **Resend** (free: 3,000 emails/month, 100/day):

1. Go to https://resend.com → sign up free
2. Go to **Domains** → **Add domain** → enter `sky-sms.xyz`
3. Resend will show DNS records to add in Cloudflare (TXT + DKIM). Add them all.
4. Wait for Resend to verify the domain (usually 5–10 min)
5. Go to **API Keys** → Create key → copy it
6. Add `RESEND_API_KEY=re_xxxx` to your API server environment variables
7. Let the developer know — they'll wire up payment confirmation and rental emails

---

## Part 4 — Final checklist

- [ ] API server running and accessible at its public URL
- [ ] `DATABASE_URL` set — tables auto-create on first request
- [ ] Google OAuth callback URL matches your API domain exactly
- [ ] Frontend deployed to Cloudflare Pages with `_redirects` file
- [ ] Custom domain `sky-sms.xyz` connected in Cloudflare Pages
- [ ] `ALLOWED_ORIGIN=https://sky-sms.xyz` set on the API server
- [ ] Test sign in → Google login and back
- [ ] Test adding balance → OxaPay checkout opens
- [ ] Test renting a number → phone number appears
- [ ] Test support ticket → submit from `/support` page
- [ ] (Optional) Email routing live — send a test to support@sky-sms.xyz

---

## Environment variable quick reference

| Variable | Where | What |
|----------|-------|------|
| `DATABASE_URL` | API server | PostgreSQL connection string (Supabase/Neon/Railway) |
| `GOOGLE_CLIENT_ID` | API server | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | API server | Google OAuth client secret |
| `HERO_SMS_API_KEY` | API server | HeroSMS API key |
| `OXAPAY_MERCHANT_API_KEY` | API server | OxaPay merchant key |
| `SESSION_SECRET` | API server | Random 64-char string |
| `ALLOWED_ORIGIN` | API server | `https://sky-sms.xyz` |
| `PORT` | API server | Set automatically by Railway/Render |
| `RESEND_API_KEY` | API server | Optional — for sending transactional emails |
