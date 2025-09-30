
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { ChallengeProvider } from './context/ChallengeContext.tsx';
import { VocabularyProvider } from './context/VocabularyContext.tsx';
import { ExamHistoryProvider } from './context/ExamHistoryContext.tsx';

// Register the service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Construct the full URL to the service worker to ensure it's from the correct origin,
    // which is a security requirement. This fixes issues in sandboxed environments.
    const serviceWorkerUrl = `${window.location.origin}/service-worker.js`;
    navigator.serviceWorker.register(serviceWorkerUrl)
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <ChallengeProvider>
        <VocabularyProvider>
          <ExamHistoryProvider>
              <App />
          </ExamHistoryProvider>
        </VocabularyProvider>
      </ChallengeProvider>
    </AuthProvider>
  </React.StrictMode>
);
