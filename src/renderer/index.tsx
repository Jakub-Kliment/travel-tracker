import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Variable weights only: one file per family covers the whole range.
import '@fontsource-variable/source-serif-4/wght.css';
import '@fontsource-variable/inter/wght.css';
import 'flag-icons/css/flag-icons.min.css';
import './styles/global.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
