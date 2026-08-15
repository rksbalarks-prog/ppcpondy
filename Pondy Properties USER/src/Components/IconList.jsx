import React from "react";
import PYBIKES from "../Assets/PY Bikes.png"
import sale from "../Assets/Sale Property-01.png"
import allbike from "../Assets/All Bikes-01.png"
import rentadfas from "../Assets/Rent Property-01.png"
import buyer from "../Assets/Buyer List-01.png"

import text3 from "../Assets/text3.png"
import text1 from "../Assets/text1.png"
import text2 from "../Assets/text2.png"
import text4 from "../Assets/text4.png"
import text5 from "../Assets/text5.png"


const IconList = () => {
  return (
    <div className="container my-4">
    <div className="d-flex justify-content-between overflow-auto py-2">
      <div className="d-flex flex-column align-items-center mx-2">
        <img
          src={PYBIKES}
          alt="Image 1"
          className="mb-2"
          style={{ width: '30px', height: '30px' }}
        />
         <img
          src={text3}
          alt="Image 1"
          className="mb-2"
          style={{ width: '60px', height: '20px' }}
        />
        {/* <p><span>PY BIKES</span></p> */}
      </div>
      <div className="d-flex flex-column align-items-center mx-2">
        <img
          src={sale}
          alt="Image 2"
          className="mb-2"
          style={{ width: '30px', height: '30px' }}
        />
   <img
          src={text1}
          alt="Image 1"
          className="mb-2"
          style={{ width: '60px', height: '20px' }}
        />      </div>
      <div className="d-flex flex-column align-items-center mx-2">
        <img
          src={allbike}
          alt="Image 3"
          className="mb-2"
          style={{ width: '30px', height: '30px' }}
        />
   <img
          src={text5}
          alt="Image 1"
          className="mb-2"
          style={{ width: '60px', height: '20px' }}
        />      </div>
      <div className="d-flex flex-column align-items-center mx-2">
        <img
          src={rentadfas}
          alt="Image 4"
          className="mb-2"
          style={{ width: '30px', height: '30px' }}
        />
   <img
          src={text2}
          alt="Image 1"
          className="mb-2"
          style={{ width: '60px', height: '20px' }}
        />      </div>
      <div className="d-flex flex-column align-items-center mx-2">
        <img
          src={buyer}
          alt="Image 5"
          className="mb-2"
          style={{ width: '30px', height: '30px' }}
        />
   <img
          src={text4}
          alt="Image 1"
          className="mb-2"
          style={{ width: '60px', height: '20px' }}
        />   
           </div>




           <div className="d-flex flex-column align-items-center mx-2">
        <img
          src={buyer}
          alt="Image 5"
          className="mb-2"
          style={{ width: '30px', height: '30px' }}
        />
   <img
          src={text4}
          alt="Image 1"
          className="mb-2"
          style={{ width: '60px', height: '20px' }}
        />   
           </div><div className="d-flex flex-column align-items-center mx-2">
        <img
          src={buyer}
          alt="Image 5"
          className="mb-2"
          style={{ width: '30px', height: '30px' }}
        />
   <img
          src={text4}
          alt="Image 1"
          className="mb-2"
          style={{ width: '60px', height: '20px' }}
        />   
           </div><div className="d-flex flex-column align-items-center mx-2">
        <img
          src={buyer}
          alt="Image 5"
          className="mb-2"
          style={{ width: '30px', height: '30px' }}
        />
   <img
          src={text4}
          alt="Image 1"
          className="mb-2"
          style={{ width: '60px', height: '20px' }}
        />   
           </div><div className="d-flex flex-column align-items-center mx-2">
        <img
          src={buyer}
          alt="Image 5"
          className="mb-2"
          style={{ width: '30px', height: '30px' }}
        />
   <img
          src={text4}
          alt="Image 1"
          className="mb-2"
          style={{ width: '60px', height: '20px' }}
        />   
           </div><div className="d-flex flex-column align-items-center mx-2">
        <img
          src={buyer}
          alt="Image 5"
          className="mb-2"
          style={{ width: '30px', height: '30px' }}
        />
   <img
          src={text4}
          alt="Image 1"
          className="mb-2"
          style={{ width: '60px', height: '20px' }}
        />   
           </div>
    </div>
  </div>
  );
};

export default IconList;
