# AgriVision AI — GitHub + Supabase + Vercel starter

This project is structured so the React website and the Crop Doctor API can deploy together on Vercel. It includes:
- Supabase email/password authentication
- Responsive farming dashboard
- Crop Doctor image upload and Gemini API report
- Irrigation guidance demo
- Weather panel (demo; live weather is not connected)
- AI Assistant chat (demo replies; not connected to an LLM)
- Browser-local farm history and calendar tasks

## 1. Before you start

Install Node.js LTS. Create/choose a Supabase project and a Google Gemini API key. Never commit `.env.local` or paste API keys into chat.

## 2. Configure Supabase

In Supabase Dashboard, open **Project Settings → API** (or API Keys).
Copy the project URL and the publishable/anon client key.

For local development, create `.env.local` in the project root (same folder as `package.json`) using `.env.example` as a template:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

The `VITE_` values are public browser configuration; use only the Supabase publishable/anon key, never a service-role/secret key. `GEMINI_API_KEY` is server-side only. Do not upload `.env.local` to GitHub.

In Supabase **Authentication → URL Configuration**, set the Site URL to your deployed Vercel URL after deployment. Add these Redirect URLs:
- `http://localhost:5173/**`
- `https://YOUR-VERCEL-DOMAIN.vercel.app/**`

Email confirmation may be enabled. If so, confirm the signup email before logging in.

## 3. Run locally

Open a terminal in the project folder and run:

```bash
npm install
npm run dev
```

Vite will show a local URL, normally `http://localhost:5173`. Open that URL.

**Note:** Vercel's `api/crop-doctor.js` serverless function does not run under Vite by itself. For a local full-stack test, use Vercel CLI:

```bash
npx vercel dev
```

If asked, log in to Vercel and link/create a project. Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `GEMINI_API_KEY` in the Vercel project environment variables, then run `npx vercel dev`. Alternatively, deploy first and test the Crop Doctor on the deployed URL.

## 4. Upload to GitHub

1. Extract the ZIP.
2. Create a new empty repository on GitHub.
3. Open a terminal in the extracted `AgriVision-AI` folder.
4. Run:

```bash
git init
git add .
git commit -m "Initial AgriVision AI app"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Replace the example GitHub URL with your repository URL. Ensure `.env.local` is not in the files being uploaded.

## 5. Deploy on Vercel

1. Sign in to Vercel and choose **Add New → Project**.
2. Import your GitHub repository.
3. Framework preset: **Vite** (usually detected automatically).
4. Build command: `npm run build`
5. Output directory: `dist`
6. Add environment variables:
   - `VITE_SUPABASE_URL` = Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = Supabase publishable/anon key
   - `GEMINI_API_KEY` = Gemini API key (server-side; no `VITE_` prefix)
7. Deploy. After changing environment variables, redeploy.

The `api/crop-doctor.js` file is deployed as a Vercel Function. The frontend calls `/api/crop-doctor` on the same domain, avoiding the separate localhost:3001/CORS problem.

## 6. Troubleshooting

- **Supabase is not configured:** check that the two `VITE_SUPABASE_...` variables are correct and redeploy/restart.
- **Email confirmation:** check inbox/spam, confirm email, then sign in.
- **Gemini API key missing:** add `GEMINI_API_KEY` to Vercel Environment Variables and redeploy.
- **Crop analysis fails:** check Vercel → Project → Logs / Functions. Verify Gemini API key, billing/quota, and supported image type (JPG, PNG, WebP, max 5 MB).
- **Local Crop Doctor returns 404:** Vite alone does not serve `api/` functions. Use `npx vercel dev` for local API testing or test the deployed Vercel URL.
- Do not share `.env.local`, Gemini keys, or Supabase secret/service-role keys.

## Important scope notes

The Weather page is currently a demo, not live weather data. The AI Assistant currently returns a fixed safety-oriented demo response, not a live AI answer. Farm History and Calendar are saved in this browser's local storage and are not synced to Supabase yet. The Crop Doctor uses Gemini and provides preliminary observations only, not a confirmed diagnosis.
