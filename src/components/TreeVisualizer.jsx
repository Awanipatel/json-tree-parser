import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls as FlowControls,
  ReactFlowProvider,
  Handle,
} from 'reactflow';
import 'reactflow/dist/style.css';

/*
 Node type colors
 - object: blue/purple
 - array: green
 - primitive: orange
*/
const COLORS = {
  object: '#60a5fa', // light blue
  array: '#34d399',  // green
  primitive: '#f59e0b', // orange
  highlight: '#ef4444'
};

// utility: determine type of value
function nodeType(value) {
  if (value === null) return 'primitive';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return 'primitive';
}

// Build a labeled node id
function makeNodeId(path) {
  // path is like $ or $.user.address
  return path.replace(/\./g, '_').replace(/\[/g, '_').replace(/\]/g, '');
}

// simple recursive tree walker to build an array of nodes and edges.
// Also returns a map of path -> node id.
function buildTreeNodes(data) {
  const nodes = [];
  const edges = [];
  const pathToNode = {};

  // layout helpers: compute positions using a simple top-down layout.
  // We'll compute subtree width (number of leaf nodes) and then spread children horizontally.
  function measure(node) {
    // returns number of leaf columns
    const t = nodeType(node.value);
    if (t === 'primitive') return 1;
    let total = 0;
    if (t === 'array') {
      for (let i = 0; i < node.value.length; i++) {
        const child = { key: String(i), value: node.value[i], parent: node };
        total += measure(child);
      }
    } else {
      // object
      const keys = Object.keys(node.value);
      for (const k of keys) {
        total += measure({ key: k, value: node.value[k], parent: node });
      }
    }
    return total || 1;
  }

  function build(node, x, y) {
    // x is center x of this node; y is level * vertical spacing.
    const t = nodeType(node.value);
    const label = node.key === undefined ? '$' : node.key;
    const path = node.path;
    const id = makeNodeId(path);

    // node label for primitives include value
    // keep $ for the root node
    const displayLabel = t === 'primitive' && node.key !== undefined
      ? `${node.key}: ${String(node.value)}`
      : String(label);

    pathToNode[path] = id;

    nodes.push({
      id,
      position: { x: x - 70, y },
      data: {
        label: displayLabel,
        path,
        value: node.value,
        type: t,
      },
      style: {
        width: 140,
        padding: 12,
        borderRadius: 12,
        background: t === 'object' ? COLORS.object : t === 'array' ? COLORS.array : COLORS.primitive,
        color: 'white',
        textAlign: 'center',
        boxShadow: '0 8px 20px rgba(11,18,32,0.08)',
      }
    });

    // Now build child nodes and edges using subtree width measurement
    const childY = y + 110;
    if (t === 'object' || t === 'array') {
      const children = t === 'object'
        ? Object.keys(node.value).map(k => ({ key: k, value: node.value[k], path: path + (path === '$' ? '' : '.') + k }))
        : node.value.map((v, i) => ({ key: String(i), value: v, path: `${path}[${i}]` }));

      // compute subtree widths (number of leaf columns) for each child
      const childWidths = children.map((c) => measure({ key: c.key, value: c.value, path: c.path }));
      const totalCols = childWidths.reduce((s, w) => s + w, 0) || 1;
      // column gap: horizontal distance per leaf column
      const COLUMN_GAP = 180;
      // leftmost center x for first child
      let curX = x - ((totalCols - 1) * COLUMN_GAP) / 2;

      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const cw = childWidths[i] || 1;
        // child center should be in the middle of its subtree span
        const childCenter = curX + ((cw - 1) * COLUMN_GAP) / 2;
  const childId = makeNodeId(child.path);
  build({ ...child, path: child.path }, childCenter, childY);
  edges.push({ id: `${id}-${childId}`, source: id, target: childId, sourceHandle: 'b', targetHandle: 't', animated: false, style: { stroke: 'rgba(34,50,84,0.08)', strokeWidth: 2 } });
        // advance curX by cw columns for next child
        curX += cw * COLUMN_GAP;
      }
    } else {
      // primitives have no children
    }
  }

  // compute node positions using measured subtree widths (no external libs)
  const rootCols = measure({ key: undefined, value: data, path: '$' });
  const COLUMN_GAP = 180;
  // start X such that tree is reasonably centered within a wide canvas
  const rootX = ((rootCols - 1) * COLUMN_GAP) / 2 + 120;
  build({ key: undefined, value: data, path: '$' }, rootX, 20);

  // ensure edges are visible and use smoothstep curves
  const styledEdges = edges.map((e) => ({
    ...e,
    type: 'smoothstep',
    style: { stroke: 'rgba(51,65,85,0.18)', strokeWidth: 2 }
  }));

  return { nodes, edges: styledEdges, pathToNode };
}

// helper to find path match list for simple path syntax:
// supports $.user.address.city or items[0].name or $ or nested combination.
// returns array of matching path strings (exact match only).
function normalizePathQuery(q) {
  if (!q) return null;
  q = String(q).trim();
  if (q === '' || q === '.' ) return '$';

  // if user passes just '$' or '$.' return root
  if (q === '$' || q === '$.') return '$';

  // accept queries that start with '.' (like .user.name)
  if (q.startsWith('.')) q = '$' + q;

  // accept queries that don't start with '$' — prefix with '$.'
  if (!q.startsWith('$')) q = '$.' + q;

  // remove any accidental double-dots
  q = q.replace(/\.\./g, '.');

  // trim spaces around dots and brackets
  q = q.replace(/\s*\.\s*/g, '.').replace(/\s*\[\s*/g, '[').replace(/\s*\]\s*/g, ']');

  // remove trailing dot
  if (q.endsWith('.')) q = q.slice(0, -1);

  return q;
}

export default function TreeVisualizer({ data, searchQuery, themeDark }) {
  const [rfNodes, setRfNodes] = useState([]);
  const [rfEdges, setRfEdges] = useState([]);
  const [pathToNode, setPathToNode] = useState({});
  const reactFlowWrapper = useRef(null);
  const [highlighted, setHighlighted] = useState(null);
  // store the reactflow instance returned in onInit so we can call methods safely
  const [rfInstance, setRfInstance] = useState(null);

  // Rebuild nodes/edges whenever data changes
  useEffect(() => {
    if (!data) {
      setRfNodes([]);
      setRfEdges([]);
      setPathToNode({});
      return;
    }
    const { nodes, edges, pathToNode } = buildTreeNodes(data);
    setRfNodes(nodes);
    // adapt edge color for theme (white in dark mode)
    const themedEdges = edges.map((e) => ({
      ...e,
      style: {
        ...(e.style || {}),
        stroke: themeDark ? 'rgba(255,255,255,0.95)' : (e.style && e.style.stroke) || '#0b1220',
        strokeWidth: (e.style && e.style.strokeWidth) || 2.5,
      }
    }));
    setRfEdges(themedEdges);
    setPathToNode(pathToNode);
    setHighlighted(null);
    // after render, try to fit view to show everything (if instance available)
    setTimeout(() => {
      try { rfInstance?.fitView({ padding: 0.2 }); } catch (e) {}
    }, 100);
  }, [data, themeDark, rfInstance]);

  // handle searchQuery: when changed, try to find node and center/highlight
  useEffect(() => {
    if (!searchQuery || !rfNodes || rfNodes.length === 0) {
      setHighlighted(null);
      return;
    }
    const q = normalizePathQuery(searchQuery);
    if (!q) {
      setHighlighted(null);
      return;
    }

    // exact match only
      // try exact match first (path match)
      let matchedId = pathToNode[q];

      // If no exact path match, try matching by node value (helps when user searches for a literal like "USA")
      const rawQuery = String(searchQuery || '').trim();
      const rawLower = rawQuery.toLowerCase();

      if (!matchedId && rawQuery) {
        // look for nodes whose data.value equals or contains the query (case-insensitive)
        const valueMatch = rfNodes.find((n) => {
          if (!n || !n.data) return false;
          const v = n.data.value;
          if (v === null) return rawLower === 'null';
          if (typeof v === 'boolean' || typeof v === 'number') return String(v).toLowerCase() === rawLower;
          if (typeof v === 'string') return v.toLowerCase() === rawLower || v.toLowerCase().includes(rawLower);
          return false;
        });
        if (valueMatch) matchedId = valueMatch.id;
      }

      // If still no match, try a few fallbacks on paths: strip root prefix, suffix match, contains match
      if (!matchedId) {
        const allPaths = Object.keys(pathToNode || {});
        // compute a q without the leading '$.' or leading '$'
        let qNoRoot = q;
        if (q === '$') qNoRoot = '';
        else if (q.startsWith('$.')) qNoRoot = q.slice(2);
        else if (q.startsWith('$')) qNoRoot = q.slice(1);
        else if (q.startsWith('.')) qNoRoot = q.slice(1);

        // prefer exact match with $ prefix variations
        const altExact = allPaths.find(p => p === `$${qNoRoot ? '.' + qNoRoot : ''}` || p === qNoRoot || p === '$.' + qNoRoot);
        if (altExact) matchedId = pathToNode[altExact];

        // suffix match (e.g., searching for user.address.city when path is $.user.address.city)
        if (!matchedId && qNoRoot) {
          const suffix = allPaths.find(p => p.endsWith('.' + qNoRoot) || p.endsWith('[' + qNoRoot + ']') || p.endsWith(qNoRoot));
          if (suffix) matchedId = pathToNode[suffix];
        }

        // contains match (fallback)
        if (!matchedId && qNoRoot) {
          const contains = allPaths.find(p => p.indexOf(qNoRoot) !== -1);
          if (contains) matchedId = pathToNode[contains];
        }
      }

      if (matchedId) {
        setHighlighted(matchedId);
        // center on the node
        const node = rfNodes.find((n) => n.id === matchedId);
        if (node) {
          // setCenter expects coordinates in view; center on node position + half height/width if needed
          try {
            rfInstance?.setCenter(node.position.x + 80, node.position.y + 30, { zoom: 1.4, duration: 400 });
          } catch (e) {
            // some reactflow versions require using ReactFlow instance from context
          }
        }
      } else {
        setHighlighted('__NO_MATCH__' + q);
      }
  }, [searchQuery, rfNodes, pathToNode, rfInstance]);

  // when user clicks a node: copy path to clipboard and flash highlight
  const onNodeClick = useCallback((event, node) => {
    const path = node.data.path;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(path).then(() => {
        // small UX: show a temporary highlight
        setHighlighted(node.id);
        // revert highlight after a short delay
        setTimeout(() => setHighlighted(null), 1200);
      }).catch(() => {
        // fallback: no clipboard support
      });
    } else {
      // fallback: just set highlight
      setHighlighted(node.id);
      setTimeout(() => setHighlighted(null), 1200);
    }
  }, []);

  // custom node styling to apply highlight
  const nodesWithCustomStyle = useMemo(() => {
    return rfNodes.map((n) => {
      if (!n) return n;
      // clone style and modify border if highlighted
      const newStyle = { ...(n.style || {}) };
      if (highlighted && highlighted === n.id) {
        newStyle.boxShadow = '0 8px 24px rgba(239,68,68,0.25)';
        newStyle.border = `2px solid ${COLORS.highlight}`;
      } else if (highlighted && highlighted.startsWith('__NO_MATCH__')) {
        // no match - do nothing special on nodes
      } else {
        // restore default border
        newStyle.border = '0';
      }
      return {
        ...n,
        style: newStyle,
        // display label in node content
        data: {
          ...n.data,
          label: n.data.label
        },
      };
    });
  }, [rfNodes, highlighted]);

  // node renderer - compact default node with label & small path on hover via title attribute
  const nodeTypes = {
    default: ({ data }) => {
      // inline style inside node rendering is easier to control than trying to style via CSS classes
      return (
        <div title={data.path} style={{display:'flex', alignItems:'center', justifyContent:'center', gap:6, flexDirection:'column', paddingTop:6, paddingBottom:6}}>
          {/* attach a top handle for incoming edges */}
          <Handle type="target" id="t" position="top" style={{ opacity: 0, pointerEvents: 'none', width: 0, height: 0 }} />
          <div style={{fontWeight:600, fontSize:13}}>{data.label}</div>
          <div style={{fontSize:11, opacity:0.95}}>{typeof data.value === 'object' && data.value !== null ? '' : String(data.value)}</div>
          {/* bottom handle for outgoing edges */}
          <Handle type="source" id="b" position="bottom" style={{ opacity: 0, pointerEvents: 'none', width: 0, height: 0 }} />
        </div>
      );
    }
  };

  return (
    <div style={{height:'100%', display:'flex', flexDirection:'column'}}>
      <div className="top-controls" style={{marginBottom:8}}>
        <div>
          <strong className="small">Visualizer</strong>
          <div className="small info">Click node to copy its JSON path. Hover to see full path.</div>
        </div>
        <div style={{display:'flex', gap:8}}>
          <button className="btn secondary small" onClick={() => { try { rfInstance?.fitView({ padding:0.2 }); } catch(e){} }}>Fit View</button>
          <button className="btn secondary small" onClick={() => { /* zoom in */ try { const z = rfInstance?.getZoom ? rfInstance.getZoom() : 1; rfInstance?.setCenter(600, 200, { zoom: Math.min(2, z + 0.3) }); } catch(e){} }}>Zoom In</button>
          <button className="btn secondary small" onClick={() => { /* zoom out */ try { const z = rfInstance?.getZoom ? rfInstance.getZoom() : 1; rfInstance?.setCenter(600, 200, { zoom: Math.max(0.4, z - 0.3) }); } catch(e){} }}>Zoom Out</button>
        </div>
      </div>

      <div style={{flex:1, borderRadius:12, overflow:'hidden', border: themeDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'}}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodesWithCustomStyle}
            edges={rfEdges}
            fitView
            nodesDraggable
            zoomOnScroll
            panOnDrag
            onNodeClick={onNodeClick}
            onInit={(instance) => setRfInstance(instance)}
            nodeTypes={nodeTypes}
            fitViewOptions={{ padding: 0.2 }}
            defaultZoom={1}
            style={{background: themeDark ? '#1a1a1a' : '#ffffff', height:'100%'}}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant="lines" gap={16} color={themeDark ? '#333333' : '#f0f0f0'} />
            <FlowControls showInteractive={false} style={{
              button: {
                backgroundColor: themeDark ? '#333333' : '#ffffff',
                color: themeDark ? '#ffffff' : '#000000',
                border: themeDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                '&:hover': {
                  backgroundColor: themeDark ? '#444444' : '#f5f5f5'
                }
              }
            }} />
          </ReactFlow>
        </ReactFlowProvider>
      </div>

      <div style={{marginTop:8}} className="small info">
        {highlighted && highlighted.startsWith('__NO_MATCH__') ? <span>No match found for the query.</span> : null}
      </div>
    </div>
  );
}
