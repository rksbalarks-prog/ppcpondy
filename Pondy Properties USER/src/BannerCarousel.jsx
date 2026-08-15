
import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

 import carsale from "../Assets/carsale.jpeg";
import landFlat from "../Assets/landFlat.jpeg";
import rentpondy from "../Assets/rentpondy.jpeg";
import marriage from "../Assets/marriage.jpeg";
import pondycars from "../Assets/pondycars.jpeg";

const BannerCarousel = () => {
  const banners = [rentpondy, landFlat, marriage, carsale , pondycars];

  return (
    <div
      id="carouselExampleFade"
      className="carousel slide carousel-fade"
      data-bs-ride="carousel"
      data-bs-interval="3000"
    >
      <div className="carousel-inner">
        {banners.map((image, index) => (
          <div
            key={index}
            className={`carousel-item ${index === 0 ? "active" : ""}`}
            style={{
              transition: "opacity 1.5s ease-in-out",
            }}
          >
            <img
              src={image}
              className="d-block w-100"
              alt={`Slide ${index + 1}`}
              style={{
                objectFit: "cover",
                maxHeight: "500px",
              }}
            />
          </div>
        ))}
      </div>

      {/* Carousel Controls */}
      <button
        className="carousel-control-prev"
        type="button"
        data-bs-target="#carouselExampleFade"
        data-bs-slide="prev"
        style={{ display: "none" }}
      >
        <span className="carousel-control-prev-icon" aria-hidden="true"></span>
      </button>

      <button
        className="carousel-control-next"
        type="button"
        data-bs-target="#carouselExampleFade"
        data-bs-slide="next"
        style={{ display: "none" }}
      >
        <span className="carousel-control-next-icon" aria-hidden="true"></span>
      </button>
    </div>
  );
};

export default BannerCarousel;
