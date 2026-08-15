import React from "react";

const HomePage = () => {
  return (
    <div className="text-center">
      <h2>Welcome to the Home Page</h2>
      <p>
        This is the main page of your application. You can navigate to other
        pages using the navigation icons or the footer buttons.
      </p>
      <div>
        <img
          src="https://via.placeholder.com/300"
          alt="Placeholder Image"
          className="img-fluid"
        />
      </div>
      <p>
        Here you can add more content, such as information, links, or other
        sections relevant to your application.
      </p>
    </div>
  );
};

export default HomePage;
