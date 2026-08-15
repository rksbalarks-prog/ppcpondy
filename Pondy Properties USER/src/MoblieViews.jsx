import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Navbar from "./Navbar";
import Appp from "./Appp";


const MoblieView = () => {
 

  return (
  <>
    <div
      className="d-flex justify-content-center align-items-center vh-100"
      style={{ minHeight: "100vh" , background:'#E5E5E5' }}
    >
<div style={{ height: "100vh",width:'500px', background:'white'}}>
<div style={{ height: "100%",width:'100%', position: "relative", overflowY:'hidden'}}>

<Navbar />
<Appp />
</div>
</div>

    </div>
    </>

  );
};

export default MoblieView;
