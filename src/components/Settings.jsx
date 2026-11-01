import { useState } from 'react';

export default function Settings({ settings, onChange }) {
  const [show, setShow] = useState(false);
  const set = (k) => (e) => onChange({ ...settings, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  return (
    <section className="card">
      <h2>⚙️ Settings</h2>
      <div className="grid">
        <label>
          OpenAI API key
          <input type={show ? 'text' : 'password'} value={settings.openai} onChange={set('openai')} placeholder="sk-…" autoComplete="off" />
        </label>
        <label>
          SerpAPI key
          <input type={show ? 'text' : 'password'} value={settings.serp} onChange={set('serp')} placeholder="SerpAPI key" autoComplete="off" />
        </label>
        <label>
          Model
          <input value={settings.model} onChange={set('model')} />
        </label>
      </div>
      <div className="row">
        <label className="inline">
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show keys
        </label>
        <label className="inline">
          <input type="checkbox" checked={settings.remember} onChange={set('remember')} /> Remember keys in this browser (localStorage)
        </label>
      </div>
      <p className="hint">Keys stay in your browser. OpenAI is called directly; SerpAPI is called through the local Vite proxy.</p>
    </section>
  );
}
