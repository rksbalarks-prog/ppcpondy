import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import imge from "../Assets/website-construction-line-style.png"


const Building = () => {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100 flex-grow-1 overflow-auto px-3 py-2"
    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
    <div
      className="d-flex flex-column bg-white shadow overflow-hidden"
      style={{ width: "450px", height: "100vh" }}
    >
       <div className="flex-grow-1">
        <img
          src={imge}
          alt="Placeholder"
          className="w-100 h-100"
          style={{ objectFit: "cover" }}
        />
      </div>
       <div
        className="flex-grow-1 overflow-auto px-3 py-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <h1 style={{color:'#1E1A4F', fontSize:'50px'}}>Cooming Soon! !</h1>
        <p style={{color:'#1E1A4F', fontSize:'20px'}}>
         Page is Under Construction
        </p>
        <p style={{color:'#1E1A4F', fontSize:'20px'}}>
         Go back to more info
        </p>
      </div>
    </div>
  </div>
  );
};

export default Building;



