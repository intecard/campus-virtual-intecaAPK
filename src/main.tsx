/// <reference types="vite/client" />

import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Validación de seguridad para la inicialización de React
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Fallo crítico: No se encontró el elemento 'root' en el index.html");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);