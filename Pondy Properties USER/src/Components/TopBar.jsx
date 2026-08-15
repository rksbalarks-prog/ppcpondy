


import React, { useRef, useEffect } from "react";

const TopBar = ({ items, setActive, activeItem }) => {
  const topBarRef = useRef(null);
  const isResetRef = useRef(false);
  const initialScrollRef = useRef(null);

  useEffect(() => {
    const topBarElement = topBarRef.current;
    if (!topBarElement) return;

    // Clone items 10 times for truly infinite scrolling
    const clonedItems = Array(10)
      .fill(null)
      .flatMap(() => items);

    // Center the (cloned) strip BEFORE smooth-scroll is enabled — otherwise
    // the browser animates from 0 → middlePosition, which looks like the
    // bar is auto-scrolling fast for a second or two at app start.
    topBarElement.style.scrollBehavior = "auto";
    const centerStrip = () => {
      if (!topBarElement) return;
      const middlePosition = (topBarElement.scrollWidth - topBarElement.clientWidth) / 2;
      topBarElement.scrollLeft = middlePosition;
      initialScrollRef.current = middlePosition;
      // Only enable smooth AFTER the instant jump has committed.
      requestAnimationFrame(() => {
        if (topBarElement) topBarElement.style.scrollBehavior = "smooth";
      });
    };
    // requestAnimationFrame instead of setTimeout(0) so we measure after
    // layout/paint — guards against scrollWidth being 0 on first render.
    requestAnimationFrame(centerStrip);

    // Handle infinite loop scrolling with early boundary detection
    const handleScroll = () => {
      if (isResetRef.current || !topBarElement || !initialScrollRef.current) return;

      const scrollLeft = topBarElement.scrollLeft;
      const scrollWidth = topBarElement.scrollWidth;
      const clientWidth = topBarElement.clientWidth;
      const maxScroll = scrollWidth - clientWidth;
      const sectionWidth = (scrollWidth - clientWidth) / 10;

      // Detect when getting close to right edge (before actually reaching it)
      if (scrollLeft > maxScroll - sectionWidth) {
        isResetRef.current = true;
        // Jump back to equivalent position in previous section
        topBarElement.scrollLeft = scrollLeft - sectionWidth * 5;
        setTimeout(() => {
          isResetRef.current = false;
        }, 50);
      }

      // Detect when getting close to left edge (before actually reaching it)
      if (scrollLeft < sectionWidth) {
        isResetRef.current = true;
        // Jump forward to equivalent position in next section
        topBarElement.scrollLeft = scrollLeft + sectionWidth * 5;
        setTimeout(() => {
          isResetRef.current = false;
        }, 50);
      }
    };

    // Handle mouse wheel scrolling
    const handleWheel = (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        topBarElement.scrollLeft += e.deltaY * 0.8;
      }
    };

    topBarElement.addEventListener("scroll", handleScroll, { passive: true });
    topBarElement.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      topBarElement.removeEventListener("scroll", handleScroll);
      topBarElement.removeEventListener("wheel", handleWheel);
    };
  }, [items.length]);

  // Clone items 10 times for truly infinite scrolling
  const clonedItems = Array(10)
    .fill(null)
    .flatMap(() => items);

  // Handle touch swipe for mobile
  const touchStartRef = useRef({ x: 0, time: 0 });

  const handleTouchStart = (e) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      time: Date.now(),
    };
  };

  const handleTouchEnd = (e) => {
    const topBarElement = topBarRef.current;
    if (!topBarElement) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchDuration = Date.now() - touchStartRef.current.time;
    const touchDistance = touchStartRef.current.x - touchEndX;

    // Swipe detection: distance > 30px and duration < 600ms
    if (Math.abs(touchDistance) > 30 && touchDuration < 600) {
      const scrollAmount = touchDistance > 0 ? 120 : -120;
      topBarElement.scrollLeft += scrollAmount;
    }
  };

  return (
    <div
      ref={topBarRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        width: "100%",
        overflowX: "scroll",
        whiteSpace: "nowrap",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        WebkitOverflowScrolling: "touch",
        touchAction: "pan-x",
        background: "#ffffff",
        boxShadow: "0 4px 6px -2px rgba(0, 0, 0, 0.1)",
        marginBottom: 0,
      }}
    >
      <ul
        className="list-unstyled d-flex mb-0"
        style={{
          display: "flex",
          gap: "10px",
          padding: "6px 10px 4px",
          paddingRight: "20px",
          margin: "0",
          listStyle: "none",
        }}
      >
        {clonedItems.map((item, index) => (
          <li
            className={`text-center px-3 ${
              activeItem === item.content ? "text-primary" : "text-secondary"
            }`}
            key={`${item.content}-${index}`}
            style={{
              cursor: "pointer",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flexShrink: 0,
            }}
            onClick={() => setActive(item.content)}
          >
            <img
              src={item.icon}
              alt={item.text}
              style={{ width: "28px", height: "28px", objectFit: "cover" }}
            />
            <span
              style={{
                marginTop: "5px",
                color: activeItem === item.content ? "#2F4F4F" : "grey",
                fontSize: "10px",
                paddingBottom: "3px",
                borderBottom:
                  activeItem === item.content
                    ? "2px solid #383838"
                    : "2px solid transparent",
                width: "100%",
                display: "inline-block",
                fontWeight: activeItem === item.content ? 600 : 500,
              }}
            >
              {item.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TopBar;




