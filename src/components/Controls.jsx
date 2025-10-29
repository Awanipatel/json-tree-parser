import React from 'react';

export default function Controls({ themeDark, setThemeDark }) {
  return (
    <div style={{display:'flex', alignItems:'center', gap:10}}>
      <label className="small muted">Theme</label>
      <label className="toggle">
        <input type="checkbox" checked={themeDark} onChange={() => setThemeDark((t) => !t)} />
        <span className="slider" />
      </label>
    </div>
  );
}
