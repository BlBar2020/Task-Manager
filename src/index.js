import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app';
import './style.css'; // Ensure your style.css is imported here if not in App.js

const container = document.getElementById('root');
const root = createRoot(container); // createRoot(container!) if you use TypeScript
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);