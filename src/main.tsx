import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// Suppress harmless benign browser ResizeObserver notification warnings
if (typeof window !== 'undefined') {
  const originalErrorHandler = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    if (
      typeof message === 'string' &&
      (message.includes('ResizeObserver loop completed with undelivered notifications') ||
        message.includes('ResizeObserver loop limit exceeded'))
    ) {
      return true;
    }
    if (originalErrorHandler) {
      return originalErrorHandler(message, source, lineno, colno, error);
    }
    return false;
  };

  window.addEventListener('error', (event) => {
    if (
      event.message &&
      (event.message.includes('ResizeObserver loop completed with undelivered notifications') ||
        event.message.includes('ResizeObserver loop limit exceeded'))
    ) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);
