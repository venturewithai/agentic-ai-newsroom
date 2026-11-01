// Google News search through SerpAPI (proxied via Vite, see vite.config.js).
export async function searchNews({ apiKey, query, num = 10 }) {
  if (!apiKey) throw new Error('Missing SerpAPI key — add it in Settings.');
  const params = new URLSearchParams({
    engine: 'google',
    tbm: 'nws',
    tbs: 'qdr:w', // past week
    q: query,
    num: String(num),
    api_key: apiKey,
  });
  const res = await fetch(`/serpapi/search.json?${params}`);
  if (!res.ok) {
    let detail = '';
    try {
      detail = (await res.json())?.error || '';
    } catch {
      /* ignore */
    }
    throw new Error(`SerpAPI error ${res.status}${detail ? `: ${detail}` : ''}`);
  }
  const data = await res.json();
  if (data.error) throw new Error(`SerpAPI: ${data.error}`);
  return (data.news_results || []).map((r) => ({
    title: r.title,
    link: r.link,
    source: typeof r.source === 'object' ? r.source?.name : r.source,
    date: r.date,
    snippet: r.snippet,
  }));
}
