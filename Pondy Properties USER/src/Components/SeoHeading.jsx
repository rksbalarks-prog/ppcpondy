import React from 'react';

/**
 * The page's single <h1>, rendered for crawlers and screen readers without
 * disturbing the visual design.
 *
 * The public pages are built entirely from cards, carousels and icon rows —
 * none of them declares an <h1>, so search engines have no statement of what
 * the page is about beyond the <title>. This uses the standard "visually
 * hidden" clip technique (the same one Bootstrap's .visually-hidden uses): the
 * text is in the DOM, read by assistive tech and indexed normally, but takes
 * up no space. It is not cloaking — the heading states exactly what the page
 * shows.
 *
 * Pass `visible` to render it as an ordinary styled heading instead.
 */
const hiddenStyle = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

export default function SeoHeading({ children, level = 1, visible = false, style }) {
  const Tag = 'h' + level;
  return (
    <Tag style={visible ? style : { ...hiddenStyle, ...(style || {}) }}>
      {children}
    </Tag>
  );
}
