import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
 import reportWebVitals from './reportWebVitals';
import RouterPage from './Components/RouterPage';
import { Provider } from 'react-redux';
import { store } from './red/store';
import { registerBaseInterceptor, registerFetchBaseInterceptor, syncBaseFromPath } from './utils/cityBase';
import { initClarity } from './utils/clarity';

// City-base setup: pick up the base from the current URL (handles refresh /
// direct load on /chennai or /pondicherry), then register the axios + fetch
// interceptors so every backend call carries the active base.
syncBaseFromPath(window.location.pathname);
registerBaseInterceptor();
registerFetchBaseInterceptor();

// Microsoft Clarity — session replays / heatmaps for the public site. Runs
// after syncBaseFromPath so the first `city` tag is already correct. No-op
// without REACT_APP_CLARITY_ID, so nothing loads in local development.
initClarity();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <Provider store={store}>
    <RouterPage />
   </Provider>
);

reportWebVitals();






