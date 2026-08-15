

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { store } from './store';  // import your store
import App from './App';
import { registerAdminBaseInterceptor } from './utils/adminBase';
import { registerAdminAuthInterceptors } from './utils/authToken';

// Attach the admin's city-base scope (ALL/PY/CH) to every backend request.
registerAdminBaseInterceptor();
// Attach the admin auth token (Bearer) and handle expired/invalid sessions.
registerAdminAuthInterceptors();

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);
