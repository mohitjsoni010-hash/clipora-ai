# Clipora AI V3

Clipora AI turns one short-form video idea into a hook, script, scene prompts, dialogue, caption, and hashtags.

## What changed in V3

- Gemini 3.8 Flash is the default model.
- Removed the deprecated `temperature` parameter from the Gemini request.
- Added `/health` endpoint.
- Added a simple 10-generations-per-hour-per-IP MVP protection layer.
- Added `render.yaml` for a straightforward Render deployment.
- API key remains server-side.

## Run locally

1. Install Node.js 20+.
2. Open a terminal in this folder.
3. Run:
   ```bash
   npm install
   ```
4. Create a `.env` file using `.env.example`.
5. Put your Gemini API key in `.env`.
6. Start:
   ```bash
   npm start
   ```
7. Open `http://localhost:3000`

## Deploy on Render

1. Put this folder in a GitHub repository.
2. In Render, choose **New → Web Service** and connect the repository.
3. Render can use the included `render.yaml`, or set:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Add environment variables:
   - `GEMINI_API_KEY` = your Gemini API key
   - `GEMINI_MODEL` = `gemini-3.8-flash`
5. Deploy.
6. Open the generated `onrender.com` URL.

## Important security rule

Never put `GEMINI_API_KEY` inside `index.html`, client-side JavaScript, GitHub, or any public file.

## MVP limitation

The rate limit is only basic abuse protection. Before charging users, add real authentication, server-side usage tracking/database limits, payments, and stronger abuse protection.
