import React from 'react';

export default function JsonEditor({ jsonText, setJsonText, onVisualize, onClear, error, setError }) {
  return (
    <div className="input-panel" style={{marginTop:12}}>
      <textarea
        className="textarea"
        placeholder="Paste JSON here"
        value={jsonText}
        onChange={(e) => { setJsonText(e.target.value); setError(null); }}
      />

      <div className="controls-row" style={{marginTop:12}}>
        <button
          className="btn primary"
          onClick={() => onVisualize(jsonText)}
        >
          Generate Tree
        </button>

        <button
          className="btn secondary"
          onClick={() => onClear()}
          title="Clear input and tree"
        >
          Clear
        </button>

        <button
          className="btn secondary"
          onClick={() => {
            // insert a simple sample JSON if user cleared it
            const sample = `{
  "user": {
    "id": 1,
    "name": "John Doe",
    "address": { "city": "New York", "country": "USA" }
  },
  "items": [{ "name": "item1" }, { "name": "item2" }]
}`;
            setJsonText(sample);
            setError(null);
          }}
        >
          Load sample
        </button>
      </div>

      {error && <div className="error">Invalid JSON: {error}</div>}
    </div>
  );
}
