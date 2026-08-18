import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { applySeo } from '../utils/seo';
import { seoForPath, isDataDrivenRoute } from '../utils/seoRoutes';

/**
 * Applies the right <head> on every navigation.
 *
 * Mounted once inside <BrowserRouter> (see RouterPage.jsx), it reads the route
 * map in utils/seoRoutes.js and rewrites the title, description, canonical,
 * robots and social tags whenever the pathname changes. Without it a
 * single-page app keeps whatever <head> the first-loaded page left behind, so
 * every URL a crawler follows looks like the same page.
 *
 * Routes whose head depends on fetched data get a neutral, correct-canonical
 * head here immediately (so nothing stale from the previous route survives),
 * and their own <Seo> replaces it once the data lands.
 */
export default function RouteSeo() {
  const location = useLocation();
  const pathname = location.pathname;

  useEffect(() => {
    if (isDataDrivenRoute(pathname)) {
      applySeo({
        title: 'Property Details',
        description:
          'Full details of this property on Pondy Properties — photos, price, ' +
          'total area, location and owner contact.',
        path: pathname,
        type: 'article',
      });
      return;
    }

    const cfg = seoForPath(pathname);
    applySeo({
      title: cfg.title,
      description: cfg.description,
      keywords: cfg.keywords,
      path: cfg.path,
      noindex: cfg.noindex,
    });
  }, [pathname]);

  return null;
}
