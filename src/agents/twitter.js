import { chatJSON } from '../lib/openai.js';

export async function runTwitterAgent({ keys, model, ideas, tweetsPerThread }) {
  const system = `You are the X/Twitter Agent. You write threads for developers at tech startups in San Francisco and the Bay Area.
Voice: sharp, practical, a little witty, builder-to-builder. Lead with a hook tweet that earns the click.
Each thread MUST contain exactly ${tweetsPerThread} tweets. Every tweet must be 280 characters or fewer.
Number tweets like "1/" at the start. No hashtag spam (max 1 in the final tweet). Final tweet = takeaway + soft CTA to follow/repost.
Respond with JSON: {"threads":[{"idea_id":1,"tweets":["...","..."]}]} with one thread per idea, in the same order.`;
  const user = `Write one thread per idea:\n${JSON.stringify(ideas, null, 2)}`;
  const out = await chatJSON({ apiKey: keys.openai, model, system, user });
  return (out.threads || []).map((t) => ({
    ...t,
    tweets: (t.tweets || []).map((s) => s.trim()),
  }));
}
