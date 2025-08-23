
// Critical: Import React first to prevent Children undefined error
import React from 'react';
import ReactDOM from 'react-dom/client';

// Browser polyfills
if (typeof globalThis === 'undefined') {
  (window as any).globalThis = window;
}

// Ensure React is available globally to prevent bundling issues
if (typeof window !== 'undefined') {
  (window as any).React = React;
}

// Import CSS after React is established
import './index.css';
import './styles/mobile-responsive.css';

// Import main components after React is properly initialized
import App from './App';

// Initialize with enhanced error handling
const initializeApp = () => {
  // Debug React availability
  console.log('React version:', React.version);
  console.log('React available:', !!React);
  console.log('React.Children available:', !!React.Children);
  
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error("Could not find root element to mount to");
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = '<h1>Application Error</h1><p>Could not initialize the application. Please refresh the page.</p>';
    document.body.appendChild(errorDiv);
    return;
  }

  try {
    // Validate React is properly loaded before creating root
    if (!React || !React.Children || !ReactDOM) {
      throw new Error('React is not properly loaded - this is the Children undefined issue');
    }
    
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    console.log('✅ React app initialized successfully');
  } catch (error) {
    console.error('❌ Failed to render React app:', error);
    console.error('Error details:', {
      reactAvailable: !!React,
      reactChildrenAvailable: !!(React && React.Children),
      reactDomAvailable: !!ReactDOM,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : 'No stack trace available'
    });
    
    rootElement.innerHTML = `
      <h1>Application Error</h1>
      <p>Failed to load the application. Error: ${error instanceof Error ? error.message : String(error)}</p>
      <p>Please refresh the page or contact support if the issue persists.</p>
      <details>
        <summary>Technical Details</summary>
        <pre>${error instanceof Error ? error.stack : 'No stack trace available'}</pre>
      </details>
    `;
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}