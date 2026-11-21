import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

// Sends a user back to the page that asked them to log in (e.g. /delete-account),
// whichever of the site's several login flows they use (/login, /web-login, the
// home-page box, the navbar modal) — each of those navigates to its own landing
// page afterwards. Mounted once inside <BrowserRouter>; renders nothing.
const KEY = 'afterLoginRedirect';
const MAX_AGE_MS = 15 * 60 * 1000; // a visit abandoned longer ago than this is ignored

export function rememberAfterLogin(path) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ path, at: Date.now() }));
  } catch (e) { /* storage blocked — user just lands on the default page */ }
}

export default function AfterLoginRedirect() {
  const location = useLocation();
  const navigate = useNavigate();
  const reduxPhone = useSelector((state) => state.user?.phoneNumber);

  useEffect(() => {
    let saved = null;
    let storedPhone = null;
    try {
      saved = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      storedPhone = localStorage.getItem('phoneNumber');
    } catch (e) {
      return;
    }
    if (!saved || !saved.path) return;

    if (Date.now() - (saved.at || 0) > MAX_AGE_MS) {
      try { sessionStorage.removeItem(KEY); } catch (e) { /* ignore */ }
      return;
    }
    if (!(storedPhone || reduxPhone)) return; // not logged in yet — keep waiting

    try { sessionStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    if (location.pathname !== saved.path) navigate(saved.path, { replace: true });
  }, [location.pathname, reduxPhone, navigate]);

  return null;
}
