import React from "react";
import "swiper/css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Swiper, SwiperSlide } from "swiper/react";
import { FaMapMarkerAlt, FaUserAlt, FaBed, FaBuilding, FaCalendarAlt, FaDollarSign } from "react-icons/fa";

const HorizontalCard = () => {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <div className="card" style={{ width: "345px", height: "134px", display: "flex", flexDirection: "row" }}>
        <div style={{ flex: 1 }}>
          <Swiper spaceBetween={10} slidesPerView={1} style={{ height: "100%" }}>
            <SwiperSlide>
              <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQbuxUi3kh7dgfz7vXoxJRKI9-Kxfspn3_dUw&s" alt="Slide 1" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </SwiperSlide>
            <SwiperSlide>
              <img src="https://via.placeholder.com/134x134" alt="Slide 2" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </SwiperSlide>
          </Swiper>
        </div>
        <div className="card-body" style={{ flex: 2, padding: "10px" }}>
          <h5 className="card-title">Property Title</h5>
          <p className="card-text">
            <FaDollarSign /> Price: $1,200 <br />
            <FaBed /> Rooms: 3 <br />
            <FaUserAlt /> Profile: Owner <br />
            <FaBuilding /> Floor: 2nd <br />
            <FaCalendarAlt /> Months: 12 <br />
            <FaMapMarkerAlt /> Location: New York, USA
          </p>
        </div>
      </div>
    </div>
  );
};

export default HorizontalCard;
