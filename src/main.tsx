
// ABOUTME: Application entry point with React 18 StrictMode and proper root element mounting with enhanced error handling.

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Enhanced error logging
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Ensure root element exists
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found. Make sure there is a div with id="root" in your HTML.');
}

// Create React 18 root with proper error handling
const root = ReactDOM.createRoot(rootElement);

// Render with enhanced error boundary
try {
  root.render(<App />);
} catch (error) {
  console.error('Failed to render React app:', error);
  
  // Fallback rendering
  rootElement.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px;">
      <div style="text-align: center; max-width: 500px;">
        <h1 style="color: #dc2626; margin-bottom: 16px;">Erro na Aplicação</h1>
        <p style="color: #6b7280; margin-bottom: 20px;">
          Ocorreu um erro ao carregar a aplicação. Por favor, recarregue a página.
        </p>
        <button 
          onclick="window.location.reload()" 
          style="background: #3b82f6; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer;"
        >
          Recarregar Página
        </button>
      </div>
    </div>
  `;
}
