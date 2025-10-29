import React, { useState, useEffect } from 'react';
import JsonEditor from './components/JsonEditor';
import TreeVisualizer from './components/TreeVisualizer';
import Controls from './components/Controls';

// Load sample JSON for placeholder UI; user can paste/replace it.
import sampleJson from './sample.json';

export default function App() {
  // parsedData holds the actual JS object after parsing JSON text
  const [jsonText, setJsonText] = useState(JSON.stringify(sampleJson, null, 2));
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [themeDark, setThemeDark] = useState(true);
  
  useEffect(() => {
    document.body.className = themeDark ? 'dark' : 'light';
  }, [themeDark]);

  useEffect(() => {
    // try parsing initial sample
    try {
      setParsedData(JSON.parse(jsonText));
      setError(null);
    } catch (err) {
      setParsedData(null);
      setError(err.message);
    }
  }, []); // only on mount; editor will control later

  // Called when user clicks "Visualize"
  function handleVisualize(text) {
    try {
      const obj = JSON.parse(text);
      setParsedData(obj);
      setJsonText(text);
      setError(null);
    } catch (err) {
      setParsedData(null);
      setError(err.message);
    }
  }

  function handleClear() {
    setJsonText('');
    setParsedData(null);
    setError(null);
  }

  return (
    <>
      <div className="theme-toggle">
        <Controls
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearch={() => {/* noop; TreeVisualizer picks up searchQuery prop */}}
          themeDark={themeDark}
          setThemeDark={setThemeDark}
        />
      </div>
      
      <div className="app">
        <div className="card left-card">
          <div className="header">
            <div>
              <h1>JSON Tree Visualizer</h1>
              <div className="info small">Paste or type JSON on the left and click "Generate Tree".</div>
            </div>
          </div>

          <JsonEditor
            jsonText={jsonText}
            setJsonText={setJsonText}
            onVisualize={handleVisualize}
            onClear={handleClear}
            error={error}
            setError={setError}
          />
        </div>

        <div className="card right-card" style={{display:'flex', flexDirection:'column', minHeight:520}}>
          <div className="search-box" style={{marginBottom:16}}>
            <input
              type="text"
              className="search-input"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <TreeVisualizer
            data={parsedData}
            searchQuery={searchQuery}
            themeDark={themeDark}
          />
        </div>
      </div>
    </>
  );
}
