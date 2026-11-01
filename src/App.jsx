import { useEffect, useState } from 'react';
import Settings from './components/Settings.jsx';
import Copy from './components/Copy.jsx';
import { runResearchAgent } from './agents/research.js';
import { runLinkedInAgent } from './agents/linkedin.js';
import { runTwitterAgent } from './agents/twitter.js';

const STORE = 'newsroom-settings';
const DEFAULTS = { openai: '', serp: '', model: 'gpt-6.1-sol', remember: false };

function loadSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORE) || '{}') };
  } catch {
    return DEFAULTS;
  }
}

export default function App() {
  const [settings, setSettings] = useState(loadSettings);
  const [ideas, setIdeas] = useState([]);
  const [selected, setSelected] = useState([]); // idea ids
  const [ctaLink, setCtaLink] = useState('');
  const [tweetCount, setTweetCount] = useState(6);
  const [phase, setPhase] = useState('idle'); // idle | researching | review | writing | done
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [linkedin, setLinkedin] = useState({ state: 'idle', data: [], error: '' });
  const [twitter, setTwitter] = useState({ state: 'idle', data: [], error: '' });

  useEffect(() => {
    try {
      if (settings.remember) localStorage.setItem(STORE, JSON.stringify(settings));
      else localStorage.removeItem(STORE);
    } catch {
      /* storage unavailable */
    }
  }, [settings]);

  const keys = { openai: settings.openai.trim(), serp: settings.serp.trim() };
  const model = settings.model.trim();

  async function research() {
    setError('');
    setIdeas([]);
    setSelected([]);
    setLinkedin({ state: 'idle', data: [], error: '' });
    setTwitter({ state: 'idle', data: [], error: '' });
    setPhase('researching');
    try {
      const result = await runResearchAgent({ keys, model, onStatus: setStatus });
      setIdeas(result);
      setPhase('review');
    } catch (e) {
      setError(e.message);
      setPhase('idle');
    }
  }

  function toggle(id) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < 3 ? [...s, id] : s));
  }

  async function approve() {
    const chosen = ideas.filter((i) => selected.includes(i.id));
    const link = ctaLink.trim();
    setPhase('writing');
    setLinkedin({ state: 'running', data: [], error: '' });
    setTwitter({ state: 'running', data: [], error: '' });
    // LinkedIn and X agents run simultaneously.
    await Promise.all([
      runLinkedInAgent({ keys, model, ideas: chosen, ctaLink: link })
        .then((data) => setLinkedin({ state: 'done', data, error: '' }))
        .catch((e) => setLinkedin({ state: 'error', data: [], error: e.message })),
      runTwitterAgent({ keys, model, ideas: chosen, tweetsPerThread: tweetCount })
        .then((data) => setTwitter({ state: 'done', data, error: '' }))
        .catch((e) => setTwitter({ state: 'error', data: [], error: e.message })),
    ]);
    setPhase('done');
  }

  const titleOf = (id) => ideas.find((i) => i.id === id)?.title ?? `Idea ${id}`;
  const canResearch = keys.openai && keys.serp && phase !== 'researching' && phase !== 'writing';

  return (
    <main>
      <header>
        <h1>🗞️ Agentic AI Newsroom</h1>
        <p>Research → you pick the top 3 → LinkedIn &amp; X agents write in parallel.</p>
      </header>

      <Settings settings={settings} onChange={setSettings} />

      <section className="card">
        <h2>1 · Research Agent</h2>
        <p className="hint">Searches the latest AI news (SerpAPI) and proposes 10 content ideas.</p>
        <button onClick={research} disabled={!canResearch}>
          {phase === 'researching' ? 'Researching…' : ideas.length ? 'Re-run research' : 'Find 10 ideas'}
        </button>
        {!keys.openai || !keys.serp ? <span className="hint"> Add both API keys in Settings first.</span> : null}
        {phase === 'researching' && <p className="status">{status}</p>}
        {error && <p className="error">{error}</p>}
      </section>

      {ideas.length > 0 && (
        <section className="card">
          <h2>2 · Human review — pick your top 3 ({selected.length}/3)</h2>
          <ul className="ideas">
            {ideas.map((idea) => {
              const on = selected.includes(idea.id);
              return (
                <li key={idea.id} className={on ? 'idea on' : 'idea'}>
                  <label>
                    <input
                      type="checkbox"
                      checked={on}
                      disabled={!on && selected.length >= 3}
                      onChange={() => toggle(idea.id)}
                    />
                    <div>
                      <strong>{idea.title}</strong>
                      <p>{idea.angle}</p>
                      <p className="hint">{idea.why_it_matters}</p>
                      {(idea.sources || []).slice(0, 3).map((s) => (
                        <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
                          {s.title || s.url}
                        </a>
                      ))}
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>

          <div className="grid">
            <label>
              LinkedIn CTA link (optional)
              <input value={ctaLink} onChange={(e) => setCtaLink(e.target.value)} placeholder="https://… (omitted if empty)" />
            </label>
            <label>
              Tweets per thread
              <input
                type="number"
                min="2"
                max="25"
                value={tweetCount}
                onChange={(e) => setTweetCount(Math.max(2, Math.min(25, Number(e.target.value) || 2)))}
              />
            </label>
          </div>
          <button onClick={approve} disabled={selected.length !== 3 || phase === 'writing'}>
            {phase === 'writing' ? 'Agents writing…' : 'Approve & generate content'}
          </button>
        </section>
      )}

      {(linkedin.state !== 'idle' || twitter.state !== 'idle') && (
        <div className="cols">
          <section className="card">
            <h2>3a · LinkedIn Agent</h2>
            {linkedin.state === 'running' && <p className="status">Writing posts…</p>}
            {linkedin.state === 'error' && <p className="error">{linkedin.error}</p>}
            {linkedin.data.map((p, i) => (
              <article key={i} className="out">
                <h3>{titleOf(p.idea_id)}</h3>
                <pre>{p.post}</pre>
                <Copy text={p.post} />
              </article>
            ))}
          </section>
          <section className="card">
            <h2>3b · X / Twitter Agent</h2>
            {twitter.state === 'running' && <p className="status">Writing threads…</p>}
            {twitter.state === 'error' && <p className="error">{twitter.error}</p>}
            {twitter.data.map((t, i) => (
              <article key={i} className="out">
                <h3>{titleOf(t.idea_id)}</h3>
                {t.tweets.map((tw, j) => (
                  <div key={j} className="tweet">
                    <pre>{tw}</pre>
                    <span className={tw.length > 280 ? 'count over' : 'count'}>{tw.length}/280</span>
                  </div>
                ))}
                <Copy text={t.tweets.join('\n\n')} label="Copy thread" />
              </article>
            ))}
          </section>
        </div>
      )}
    </main>
  );
}
