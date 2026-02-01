import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("Project Eclipse v2.5 - Boot Sequence Initiated");

// Global Safety Net for "Black Screen of Death"
window.onerror = function(message, source, lineno, colno, error) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="background:#220000; color:#ff8888; padding:20px; font-family:monospace; height:100vh; overflow:auto;">
        <h1>CRITICAL STARTUP FAILURE</h1>
        <p>The Void consumed the application before it could manifest.</p>
        <hr style="border-color:#550000"/>
        <h3>Error Log:</h3>
        <pre>${message}</pre>
        <pre>${source}:${lineno}:${colno}</pre>
        <pre>${error?.stack || ''}</pre>
        <button onclick="localStorage.clear(); window.location.reload()" style="background:#550000; color:white; border:1px solid #ff0000; padding:10px; margin-top:20px; cursor:pointer;">EMERGENCY RESET (WIPE DATA)</button>
      </div>
    `;
  }
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (e) {
  console.error("Render Crash:", e);
  throw e; // Trigger window.onerror
}
