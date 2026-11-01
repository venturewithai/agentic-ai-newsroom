import { chatJSON } from '../lib/openai.js';
import { searchNews } from '../lib/serp.js';

const QUERIES = [
  'latest AI news this week',
  'agentic AI agents news',
  'new LLM model release',
  'AI developer tools open source launch',
  'AI startup funding announcement',
];

export async function runResearchAgent({ keys, model, onStatus }) {
  onStatus?.('Searching the web via SerpAPI…');
  const batches = await Promise.allSettled(
    QUERIES.map((query) => searchNews({ apiKey: keys.serp, query })),
  );
  const failures = batches.filter((b) => b.status === 'rejected');
  if (failures.length === batches.length) throw failures[0].reason;

  const seen = new Set();
  const articles = batches
    .filter((b) => b.status === 'fulfilled')
    .flatMap((b) => b.value)
    .filter((a) => a.link && !seen.has(a.link) && seen.add(a.link))
    .slice(0, 40);

  onStatus?.(`Analysing ${articles.length} articles to find content ideas…`);
  const system = `You are the Research Agent on a social-media content team that covers AI.
From a list of recent news articles, propose exactly 10 distinct content ideas.
Prefer ideas that matter to practitioners, with a clear angle and a fresh take. Favour agentic AI where relevant.
Only use facts present in the articles. Respond with JSON:
{"ideas":[{"id":1,"title":"...","angle":"the specific take for a post","why_it_matters":"1-2 sentences","key_facts":["..."],"sources":[{"title":"...","url":"..."}]}]}`;
  const user = `Today is ${new Date().toDateString()}.\n\nArticles:\n${articles
    .map((a, i) => `${i + 1}. ${a.title} (${a.source ?? 'unknown'}, ${a.date ?? ''})\n   ${a.snippet ?? ''}\n   ${a.link}`)
    .join('\n')}`;

  const out = await chatJSON({ apiKey: keys.openai, model, system, user });
  const ideas = (out.ideas || []).slice(0, 10).map((idea, i) => ({ ...idea, id: i + 1 }));
  if (!ideas.length) throw new Error('Research agent returned no ideas.');
  return ideas;
}
