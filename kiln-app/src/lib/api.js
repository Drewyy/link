// Calls OUR OWN backend (/api/generate), which holds the real Anthropic API key.
// The browser never sees the API key — that's the whole point of this file existing.
export async function callClaude(system, prompt) {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, prompt }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new Error(data.error || "The forge didn't respond. Try again.");
  }
  return data.result;
}
