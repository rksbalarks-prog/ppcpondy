
import React from "react";

const MobileFooter = ({ currentPage, navigateTo }) => {
  const pages = ["home", "page1", "page2", "page3", "page4", "page5", "page6"];

  return (
    <footer
      className="footer bg-dark text-light d-flex justify-content-around py-2"
      style={{ maxWidth: "450px", margin: "0 auto", width: "100%" }}
    >
      {pages.map((page, index) => (
        <button
          key={index}
          className={`btn btn-sm ${currentPage === page ? "btn-light" : "btn-secondary"}`}
          onClick={() => navigateTo(page)}
        >
          {page.charAt(0).toUpperCase() + page.slice(1)}
        </button>
      ))}
    </footer>
  );
};

export default MobileFooter;
