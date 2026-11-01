# Agentic AI Newsroom

Three cooperating agents (Vite + React) that turn the latest AI news into LinkedIn posts and X threads.

1. **Research Agent** – searches Google News via SerpAPI, proposes 10 ideas. You pick the top 3 (human-in-the-loop).
2. **LinkedIn Agent** – posts for experienced engineers new to agentic AI; optional CTA link set in the UI.
3. **X/Twitter Agent** – threads for SF startup devs; tweets-per-thread is configurable.

After you approve, agents 2 and 3 run in parallel.

## Run
```bash
npm install
npm run dev
```
Open the app, enter your OpenAI and SerpAPI keys in **Settings** (model defaults to `gpt-6.1-sol`, editable).

## Notes
- Keys live in browser memory; tick "Remember keys" to store them in localStorage.
- SerpAPI is called via a Vite proxy (`/serpapi`), so use `npm run dev` or `npm run preview` (a static host needs its own proxy).
- Calling OpenAI from the browser exposes your key to that browser only; fine for personal use, not for a public deployment.
