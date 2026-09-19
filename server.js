const express = require("express");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json({ limit: "1mb" }));

const API_KEY = process.env.GEMINI_API_KEY;

function getModelName() {
  let model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  model = model.trim();

  // Prevent "models/models/..." errors
  if (model.startsWith("models/")) {
    model = model.substring("models/".length);
  }

  return model;
}

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "Clipora AI"
  });
});

app.post("/api/generate", async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({
        error: "Gemini API key is not configured."
      });
    }

    const {
      idea,
      language = "English",
      style = "Viral",
      platform = "Instagram Reels",
      duration = "30 seconds"
    } = req.body || {};

    if (!idea || !idea.trim()) {
      return res.status(400).json({
        error: "Please enter a Reel idea."
      });
    }

    const model = getModelName();

    const prompt = `
You are Clipora AI, an expert short-form video content creator.

Create a complete short-form Reel package from this idea:

IDEA:
${idea}

LANGUAGE:
${language}

STYLE:
${style}

PLATFORM:
${platform}

DURATION:
${duration}

Return ONLY valid JSON with exactly these fields:

{
  "hook": "A strong attention-grabbing opening line",
  "script": "A complete short-form script",
  "scene_prompts": [
    "Scene 1 AI video generation prompt",
    "Scene 2 AI video generation prompt",
    "Scene 3 AI video generation prompt",
    "Scene 4 AI video generation prompt"
  ],
  "dialogue": "Dialogue or voiceover for the video",
  "caption": "An engaging social media caption",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}

Keep the content suitable for the selected platform and duration.
Make the hook highly engaging.
Make scene prompts visually detailed and useful for AI video generators.
Do not include markdown or code fences.
`;

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Gemini API request failed."
      });
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(500).json({
        error: "Gemini returned an empty response."
      });
    }

    let result;

    try {
      result = JSON.parse(text);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Gemini response:", text);

      return res.status(500).json({
        error: "Gemini returned invalid JSON."
      });
    }

    res.json(result);

  } catch (error) {
    console.error("Server error:", error);

    res.status(500).json({
      error: "Something went wrong while generating your Reel."
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Clipora AI running on port ${PORT}`);
});
