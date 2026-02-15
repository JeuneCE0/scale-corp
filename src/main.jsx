import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

class RootErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('ROOT CRASH:', error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#06060b', color: '#e4e4e7', fontFamily: 'system-ui', padding: 20
        }}>
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>Erreur de chargement</h2>
            <p style={{ color: '#71717a', fontSize: 13, marginBottom: 16 }}>{this.state.error.message}</p>
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{
              padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #FFBF00, #FF9D00)', color: '#0a0a0f',
              fontWeight: 700, fontSize: 13, marginRight: 8
            }}>Réinitialiser & Recharger</button>
            <button onClick={() => window.location.reload()} style={{
              padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,.1)',
              background: 'transparent', color: '#e4e4e7', cursor: 'pointer', fontSize: 13
            }}>Recharger</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
)
