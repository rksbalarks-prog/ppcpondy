import React, { useEffect, useState } from 'react';
import homeup from '../Assets/homeup.jpg'
import { WhatsApp } from '@mui/icons-material';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { FaEnvelope, FaUser, FaPhone, FaArrowLeft } from 'react-icons/fa';
import { BiSolidMessageSquareDetail } from 'react-icons/bi';
import logo from '../Assets/legends1.png';
import logo1 from '../Assets/mail2.png';
import logo2 from '../Assets/www.png';
import logo5 from '../Assets/map68.png';
import logo4 from '../Assets/lmobile68.png';


import pic from '../Assets/painl68.png';
import pic2 from '../Assets/l168.png';
import pic3 from '../Assets/l268.png';
import pic4 from '../Assets/l468.png';
import pic5 from '../Assets/l368.png';
import pic6 from '../Assets/red68.png';

export default function OurSupport() {

     const [responseMessage, setResponseMessage] = useState("");
    const [error, setError] = useState("");
    
    
    useEffect(() => {
      if (responseMessage || error) {
        const timer = setTimeout(() => {
          setResponseMessage("");
          setError("");
        }, 3000);
    
        return () => clearTimeout(timer); // Cleanup timeout on component unmount
      }
    }, [responseMessage, error]);
    
    const location = useLocation();
    
    // Retrieve phone number from location state or localStorage
    const storedPhoneNumber = location.state?.phoneNumber || localStorage.getItem("phoneNumber") || "";
    
    // State to store form input values
    const [formData, setFormData] = useState({
      name: "",
      email: "",
      phoneNumber: storedPhoneNumber,
      message: "",
    });
    
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
    // Update phoneNumber in state if it changes in localStorage
    useEffect(() => {
      const phoneNumberFromStorage = localStorage.getItem("phoneNumber");
      if (phoneNumberFromStorage) {
        setFormData((prev) => ({ ...prev, phoneNumber: phoneNumberFromStorage }));
      }
    }, []);
    
    // Handle input changes
    const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    
    // Handle form submission
    const handleSubmit = async (e) => {
      e.preventDefault();
    
      try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/contactUs`, formData);
    
        if (response.status === 201) {
          setResponseMessage("Contact form submitted successfully!");
          setError("");
          setFormData({ name: "", email: "", phoneNumber: storedPhoneNumber, message: "" }); // Reset form
        }
      } catch (error) {
        setError(error.response?.data?.error || "Submission failed");
      }
    };
    
    
  
  const cardData = [
    {
      id: 1,
      imgSrc: logo,
      title: 'Legends Tech Solutions',
    },
    {
      id: 2,
      imgSrc: logo1,
      title: 'Email',
      text: 'info@legendstechsolution.com',
    },
    {
      id: 3,
      imgSrc: logo2,
      title: 'Website',
      text: 'Visit: www.legendstechsolution.com',
    },
    {
      id: 4,
      imgSrc: logo5,
      title: 'Main Office',
      text: 'No.36, 1st Floor, 100 Feet Road, Natesan Nagar, Pondicherry',
    },
    {
      id: 5,
      imgSrc: logo4,
      title: 'Contact Us',
      text: 'Mobile: +91 9488492325, +91 8220437673',
    },
  ];
  

  
const navigate = useNavigate();



  const cards = [
    { id: 1, image: pic, content: 'Web Desgin', },
    { id: 2, image: pic2, content: 'Web Application', },
    { id: 3, image: pic3, content: 'Moblie Application',  },
    { id: 4, image: pic4, content: 'Digital Marketing',  },
    { id: 5, image: pic5, content: 'Business Automation', },
    { id: 6, image: pic6, content: 'Software Training Programming',  },
  ];
  return (
    <div
      className="d-flex flex-column mx-auto custom-scrollbar"
      style={{
        maxWidth: '450px',
        height: '100vh',
        overflow: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        fontFamily: 'Inter, sans-serif',
      }}
    >
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
     </button> <h3 className="m-0 ms-3" style={{fontSize:"20px"}}> OurSupport</h3> </div>

      {/* Cards Section */}
      <div className="mb-4">
      {cardData.map((card) => (
  <div className="card mb-3 shadow" key={card.id}>
    <div className="row g-0">
      <div className="col-4 d-flex justify-content-center align-items-center">
        <img
          style={{ height: '50px' }}
          src={card.imgSrc}
          className="img-fluid rounded-start"
          alt={`Card ${card.id}`}
        />
      </div>
      <div className="col-8">
        <div className="card-body">
          <h5 className="card-title">{card.title}</h5>
          <p className="card-text" style={{ color: 'grey' }}>
            {card.text}
          </p>
        </div>
      </div>
    </div>
  </div>
))}

      </div>
      <div className="container" style={{ width: '450px' }}>
        <h4>Our Servies</h4>
      <div className="row">
        {cards.map((card) => (
          <div key={card.id} className="col-4 ">
            <div className="card d-flex flex-row align-items-center p-1 m-1" style={{ height: '40px' }}>
              <img
                src={card.image}
                alt="Card"
                style={{
                  width: '20px',
                  height: '20px',
                  objectFit: 'cover',
                  margin: '0 auto', // Centers the image horizontally
                }}
              />
              <div className="card-body p-1">
                <p className="card-text" style={{fontSize:"8px"}}>{card.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
     
<div className='text-center shadow p-1'><h4>Quick Contact</h4></div>
      
     
           {/* Form Section */}
           <form className="row g-3 p-3" onSubmit={handleSubmit}>
             <div className="col-12">
               <label htmlFor="name" className="form-label">
                 Name
               </label>
               <div className="input-group">
                 <span className="input-group-text">
                   <FaUser color="#2F747F" />
                 </span>
                 <input
                   type="text"
                   className="form-control m-0"
                   id="name"
                   name="name"
                   placeholder="Enter your name"
                   value={formData.name}
                   onChange={handleChange}
                   required
                 />
               </div>
             </div>
     
             <div className="col-12">
               <label htmlFor="email" className="form-label">
                 Email
               </label>
               <div className="input-group">
                 <span className="input-group-text">
                   <FaEnvelope color="#2F747F" />
                 </span>
                 <input
                   type="email"
                   className="form-control m-0"
                   id="email"
                   name="email"
                   placeholder="Enter your email"
                   value={formData.email}
                   onChange={handleChange}
                   required
                 />
               </div>
             </div>
     
             <div className="col-12">
               <label htmlFor="phone" className="form-label">
                 Phone Number
               </label>
               <div className="input-group">
                 <span className="input-group-text">
                   <FaPhone color="#2F747F" />
                 </span>
                 <input
                   type="tel"
                   className="form-control m-0"
                   id="phone"
                   name="phoneNumber"
                   value={formData.phoneNumber}
                   readOnly // ✅ Ensure phone number is displayed and not editable
                   required
                 />
               </div>
             </div>
     
             <div className="col-12">
               <label htmlFor="message" className="form-label">
                 Message
               </label>
               <div className="input-group">
                 <span className="input-group-text">
                   <BiSolidMessageSquareDetail color="#2F747F" />
                 </span>
                 <textarea
                   className="form-control m-0"
                   id="message"
                   name="message"
                   rows="4"
                   placeholder="Enter your message"
                   value={formData.message}
                   onChange={handleChange}
                   required
                 ></textarea>
               </div>
             </div>
     
             <div className="col-12 text-center">
               <button type="submit" className="btn" style={{ background: "#E74C3C", color: "#fff" }}>
                 Submit
               </button>
             </div>
           </form>
     

      {/* Response Messages */}
      {responseMessage && <p className="text-success text-center">{responseMessage}</p>}
      {error && <p className="text-danger text-center">{error}</p>}
    </div>

  );
}
