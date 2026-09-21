// This runs on the SERVER, not in the browser — process.env.ANTHROPIC_API_KEY
// is never sent to the client. Set it in your hosting provider's dashboard
// (Vercel: Project Settings -> Environment Variables), never in frontend code.

function cleanJson(text) {
  let t = text.trim();
  t = t.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");
  const start = t.indexOf("{");
  const startArr = t.indexOf("[");
  let s = start;
  if (startArr !== -1 && (start === -1 || startArr < start)) s = startArr;
  if (s > 0) t = t.slice(s);
  return JSON.parse(t);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { system, prompt } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt" });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "Server is missing ANTHROPIC_API_KEY. Set it in your hosting provider's environment variables." });
  }

  try {
    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
        max_tokens: 1200,
        system,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!apiRes.ok) {
      const detail = await apiRes.text();
      return res.status(502).json({ error: "The Claude API rejected the request.", detail });
    }

    const data = await apiRes.json();
    const text = (data.content || []).map((b) => b.text || "").join("\n");
    const result = cleanJson(text);
    return res.status(200).json({ result });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Server error" });
  }
}
