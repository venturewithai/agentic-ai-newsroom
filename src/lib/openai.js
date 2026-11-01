// Minimal OpenAI Chat Completions client (called straight from the browser
// with the key the user typed into the Settings panel).
export async function chatJSON({ apiKey, model, system, user }) {
  if (!apiKey) throw new Error('Missing OpenAI API key — add it in Settings.');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!res.ok) {
    let detail = '';
    try {
      detail = (await res.json())?.error?.message || '';
    } catch {
      /* ignore */
    }
    throw new Error(`OpenAI error ${res.status}${detail ? `: ${detail}` : ''}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '';
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('The model returned invalid JSON. Try again.');
  }
}
