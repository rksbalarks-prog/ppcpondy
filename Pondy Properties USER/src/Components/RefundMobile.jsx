

import React, { useState, useEffect } from "react";
import "react-quill/dist/quill.snow.css";
import axios from "axios";
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function RefundMobile() {
    const [type, setType] = useState("refundPolicy"); // Default type
       const [content, setContent] = useState("");
   
        
          const [isScrolling, setIsScrolling] = useState(false);
        
          useEffect(() => {
            let scrollTimeout;
        
            const handleScroll = () => {
              setIsScrolling(true);
        
              clearTimeout(scrollTimeout);
              scrollTimeout = setTimeout(() => {
                setIsScrolling(false);
              }, 150); // Adjust the delay as needed
            };
        
            window.addEventListener("scroll", handleScroll);
        
            return () => {
              clearTimeout(scrollTimeout);
              window.removeEventListener("scroll", handleScroll);
            };
          }, []);
       // Fetch existing content when component loads
       useEffect(() => {
           const fetchContent = async () => {
               try {
                   const response = await axios.get(`${process.env.REACT_APP_API_URL}/get-text/${type}`);
                   setContent(response.data?.content || ""); // Set empty string if undefined
               } catch (error) {
                   setContent(""); // Ensure it doesn't break
               }
           };
   
           fetchContent();
       }, [type]); // Runs when `type` changes
   
      const navigate = useNavigate();


     

  return (
    <div  className="d-flex flex-column mx-auto custom-scrollbar"
    style={{
      maxWidth: '450px',
      height: '100vh',
      overflow: 'auto',
      scrollbarWidth: 'none', /* For Firefox */
      msOverflowStyle: 'none', /* For Internet Explorer */
      fontFamily: 'Inter, sans-serif'
    }}>


      <div className="d-flex align-items-center justify-content-start w-100"  style={{
        background: "#EFEFEF",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        opacity: isScrolling ? 0 : 1,
        pointerEvents: isScrolling ? "none" : "auto",
        transition: "opacity 0.3s ease-in-out",
      }}>
       <button
            onClick={() => navigate(-1)}
            className="pe-5"
            style={{
              backgroundColor: '#f0f0f0',
              border: 'none',
              padding: '10px 20px',
              cursor: 'pointer',
              transition: 'all 0.3s ease-in-out',
              display: 'flex',
              alignItems: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f4f5'; // Change background
              e.currentTarget.querySelector('svg').style.color = '#00B987'; // Change icon color
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
              e.currentTarget.querySelector('svg').style.color = '#30747F';
            }}
          >
            <FaArrowLeft style={{ color: '#30747F', transition: 'color 0.3s ease-in-out' , background:"transparent"}} />
          </button> <h3 className="m-0 ms-3" style={{fontSize:"20px"}}>RefundPolicy </h3> </div>

    <div>
                <p dangerouslySetInnerHTML={{ __html: content }}></p>  
            </div>

</div> 
 )
}
