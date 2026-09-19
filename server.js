// Clipora AI backend — Gemini API
// IMPORTANT: Keep GEMINI_API_KEY on the server. Never put it in index.html.

const express = require("express");
const path = require("path");

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "20kb" }));

// Simple MVP protection. This is NOT a replacement for real accounts/billing.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_IP = 10;
const requestLog = new Map();

function rateLimit(req, res, next) {
  const now = Date.now();
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const entry = requestLog.get(ip);

  if (!entry || now - entry.start >= WINDOW_MS) {
    requestLog.set(ip, { start: now, count: 1 });
    return next();
  }

  if (entry.count >= MAX_REQUESTS_PER_IP) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - entry.start)) / 1000);
    res.set("Retry-After", String(retryAfter));
    return res.status(429).json({
      error: "You've reached the demo limit. Please try again later."
    });
  }

  entry.count += 1;
  return next();
}

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "clipora-ai" });
});

app.use(express.static(__dirname));

app.post("/api/generate", rateLimit, async (req, res) => {
  try {
    const {
      idea,
      language = "Hinglish",
      style = "Funny",
      platform = "Instagram Reels",
      duration = "10 seconds"
    } = req.body || {};

    if (typeof idea !== "string" || !idea.trim() || idea.length > 2000) {
      return res.status(400).json({
        error: "Please enter a valid idea (max 2000 characters)."
      });
    }

    const prompt = `You are Clipora AI, an expert short-form video strategist.
Create a high-quality ${duration} ${platform} package from this idea:
"${idea.trim()}"

Language: ${language}
Style: ${style}

Return ONLY valid JSON with exactly these string fields:
hook, script, scene_prompts, dialogue, caption, hashtags

Requirements:
- Make it practical for an AI-video creator.
- Scene prompts must be shot-by-shot, vertical 9:16, visually specific, and maintain character consistency.
- Match the requested language and style.
- Keep the script appropriate for the requested duration.
- Hashtags should be a space-separated string.
- No markdown fences around the JSON.`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "Server is not configured with GEMINI_API_KEY yet."
      });
    }

    const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        error: data?.error?.message || "Gemini API error"
      });
    }

    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) {
      return res.status(502).json({
        error: "No AI response returned."
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(502).json({
        error: "AI returned invalid JSON. Please try again."
      });
    }

    return res.json(parsed);
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      error: "Unexpected server error."
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Clipora AI running on port ${port}`);
});
