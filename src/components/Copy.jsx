import { useState } from 'react';

export default function Copy({ text, label = 'Copy' }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="ghost"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1200);
      }}
    >
      {done ? 'Copied ✓' : label}
    </button>
  );
}
