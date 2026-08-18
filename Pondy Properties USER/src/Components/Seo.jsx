import { useEffect } from 'react';
import { applySeo, setJsonLd } from '../utils/seo';

/**
 * Declarative <head> for one page.
 *
 * Render it anywhere inside a page component — it draws nothing and simply
 * upserts the title, description, canonical, Open Graph / Twitter tags and
 * (optionally) a JSON-LD block for as long as the page is mounted.
 *
 *   <Seo
 *     title="3 BHK House for Sale in Lawspet"
 *     description="..."
 *     path={`/details/${ppcId}`}
 *     image={firstPhotoUrl}
 *     jsonLd={listingGraph}
 *   />
 *
 * Pass the props through as they become available — re-rendering with fresh
 * data just rewrites the same tags in place, so a page can render <Seo /> with
 * placeholder copy first and the real listing copy once the fetch resolves.
 */
export default function Seo({
  title,
  description,
  path,
  image,
  type = 'website',
  noindex = false,
  keywords,
  jsonLd,
  jsonLdId = 'page',
}) {
  // jsonLd is usually a fresh object literal each render, so it is serialised
  // for the dependency list — otherwise the effect would fire every render.
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : '';
  const keywordsKey = keywords ? keywords.join('|') : '';

  useEffect(() => {
    applySeo({
      title,
      description,
      path,
      image,
      type,
      noindex,
      keywords: keywordsKey ? keywordsKey.split('|') : undefined,
      jsonLd: jsonLdKey ? JSON.parse(jsonLdKey) : undefined,
      jsonLdId,
    });
  }, [
    title,
    description,
    path,
    image,
    type,
    noindex,
    keywordsKey,
    jsonLdKey,
    jsonLdId,
  ]);

  // Drop this page's structured data when it unmounts. Title, description and
  // canonical are all overwritten by the next route's RouteSeo pass, but a
  // JSON-LD block lives under its own id — without this, a listing's
  // RealEstateListing graph would still be sitting in <head> while the user
  // (and any crawler following the same navigation) is on /about.
  useEffect(
    () => () => {
      setJsonLd(jsonLdId, null);
    },
    [jsonLdId]
  );

  return null;
}
