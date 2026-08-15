// ClarityTracker.jsx
// ------------------------------------------------------------------
// Renders nothing. Mounted once inside <BrowserRouter> in RouterPage.jsx
// so it can watch route changes and tell Microsoft Clarity which visitor
// is on which screen. Without it the whole site would look like a single
// page to Clarity (SPA — the URL changes but the document never reloads).
//
// It watches TWO things, and both matter:
//
//   1. location.pathname — normal navigation.
//   2. state.user.phoneNumber — logging in does NOT always change the URL, so
//      a path-only effect would never re-fire and the session would keep
//      reporting whoever used this browser last. Watching redux means the
//      identity corrects itself the instant the login dispatch lands.
//
// See src/utils/clarity.js for setup and privacy notes.

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { identifyUser, setClarityTag, isClarityEnabled, labelForPath } from '../utils/clarity';

const ClarityTracker = () => {
  const location = useLocation();
  // Authoritative "who is logged in right now". Falls back to localStorage
  // inside identifyUser() when redux has not been hydrated yet (hard refresh).
  const phoneNumber = useSelector((state) => state.user?.phoneNumber);

  useEffect(() => {
    if (!isClarityEnabled()) return;

    const path = location.pathname || '/';
    const page = labelForPath(path);

    identifyUser(page, phoneNumber ?? undefined);
    setClarityTag('page', page);
    setClarityTag('path', path);
  }, [location.pathname, phoneNumber]);

  return null;
};

export default ClarityTracker;
