




import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEnvelope, FaPhone, FaUser } from "react-icons/fa";
import { BiSolidMessageSquareDetail } from "react-icons/bi";
import onlinPay from '../Assets/online_pay.jpeg'


const ContactedPage = () => {
  const [captcha, setCaptcha] = useState("B7C4I9j");

  const navigate = useNavigate();
  const [responseMessage, setResponseMessage] = useState('');
    const [error, setError] = useState('');
  
     const [formData, setFormData] = useState({
      name: '',
      email: '',
      phoneNumber: '',
      message: ''
    });

  
   
     const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };
  
    
const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/contactUs`, formData);

    if (response.status === 201) {
      setResponseMessage('Contact form submitted successfully!');
      setError('');
      setFormData({ name: '', email: '', phoneNumber: '', message: '' });  
    }
  } catch (error) {
    if (error.response) {
       setError(error.response.data.error || 'Submission failed');
    } else {
       setError('Server error, please try again later.');
    }
  }
};

  const refreshCaptcha = () => {
    const newCaptcha = Math.random().toString(36).substring(2, 8).toUpperCase();
    setCaptcha(newCaptcha);
  };

  return (
    <div className="container mt-4" style={{ backgroundColor: "#F5F5F5", padding: "20px" }}>
      <div className="row">
         <div className="col-md-8">
        <div className="p-3  fw-bold text-start" style={{ backgroundColor: "#F0F0F0",  }}>
              Contact With Us
            </div>
          <div className="card shadow-lg p-4 border-0">
          
            <p className="text-muted mt-2">
              If you did not find the answer to your question or problem, please get in
              touch with us using the form below and we will respond as soon as possible.
            </p>

         

      
       <form className="row g-3 p-3" onSubmit={handleSubmit}>
           {responseMessage && <p className="text-success text-center">{responseMessage}</p>}
      {error && <p className="text-danger text-center">{error}</p>}
        <div className="col-12">
          <label htmlFor="name" className="form-label">Name</label>
          <div className="input-group">
            <span className="input-group-text"><FaUser color='#2F747F' /></span>
            <input type="text" className="form-control m-0" id="name" name="name" placeholder="Enter your name" value={formData.name} onChange={handleChange} required />
          </div>
        </div>

        <div className="col-12">
          <label htmlFor="email" className="form-label">Email</label>
          <div className="input-group">
            <span className="input-group-text"><FaEnvelope color='#2F747F' /></span>
            <input type="email" className="form-control m-0" id="email" name="email" placeholder="Enter your email" value={formData.email} onChange={handleChange} required />
          </div>
        </div>

        <div className="col-12">
          <label htmlFor="phone" className="form-label">Phone Number</label>
          <div className="input-group">
            <span className="input-group-text"><FaPhone color='#2F747F' /></span>
            <input type="tel" className="form-control m-0" id="phone" name="phoneNumber" placeholder="Enter your phone number" value={formData.phoneNumber} onChange={handleChange} required />
          </div>
        </div>

        <div className="col-12">
          <label htmlFor="message" className="form-label">Message</label>
          <div className="input-group">
            <span className="input-group-text"><BiSolidMessageSquareDetail color='#2F747F' /></span>
            <textarea className="form-control m-0" id="message" name="message" rows="4" placeholder="Enter your message" value={formData.message} onChange={handleChange} required></textarea>
          </div>
        </div>

        <div className="col-12 text-center">
     
          <button type="submit" className="btn" style={{ background: '#E74C3C', color: "#fff" }}>Submit</button>
        
  </div>


      </form>

      <h5 className="mt-5">Map-Branch Office chetty street</h5>
          <div style={{ width: "100%", height: "400px" }}>
      <iframe
        title="Puducherry Location"
        width="100%"
        height="100%"
        frameBorder="0"
        style={{ border: 0 }}
        src="https://maps.google.com/maps?q=11.937389,79.829361&z=17&output=embed"
         allowFullScreen
      ></iframe>
    </div>
    <h5 className="mt-5">Map-Main office Aravind Street (<span style={{color:"red"}}>renovation</span>)</h5>
          <div style={{ width: "100%", height: "400px" }}>
      <iframe
        title="Puducherry Location"
        width="100%"
        height="100%"
        frameBorder="0"
        style={{ border: 0 }}
        src="https://www.google.com/maps?q=Pondy%20Used%20Cars,%2089%20Aurobindo%20Street,%20Mahatma%20Gandhi%20Rd%20Junction,%20Puducherry%20605001&z=17&output=embed"
         allowFullScreen
      ></iframe>
    </div>

      
          </div>
        </div>

               <div className="col-md-4">
                 <div className="card shadow p-3 mb-3 border-light" style={{ borderLeft: "5px solid #D4EEFF" }}>
                  <div className="p-2  fw-bold text-center" style={{ backgroundColor: "#F0F0F0",  }}>
                    Main Office
                  </div>
                  
                  <p>
                    <strong>Address:</strong>No.89, Aurobindo Street, M.G Road Junction, Puducherry-605001.
      
                  </p>
                  <p><strong>Landline:</strong> +91-0413 - 2914409 </p>
                  <p><strong>Mobile:</strong> +91-91505 24409</p>
                  <p><strong>Email:</strong> inf.ppcpdy@gmail.com</p>
                  <p><strong>Website:</strong>   www.ppcpondy.com</p>
                  <p><strong>Working Hours:</strong>  09:30 AM - 08:30 PM (Monday – Saturday)
                  10:30 AM - 06:30 PM (Sunday)</p>
                  <p><strong>Confirm office opening hours on government and local holidays.</strong></p>
      
                </div>
      
                 <div className="card shadow p-3 mb-3 border-light" style={{ borderLeft: "5px solid #D4EEFF" }}>
                  <div className="p-2  fw-bold text-center" style={{ backgroundColor: "#F0F0F0",  }}>
                    Branch Office
                  </div>
                  <p>
                    <strong>Address:</strong> No.101, Chetty Street,M.G Road Junction, Puducherry-605001
      
                  </p>
                  <p><strong>Landline:</strong> 0413 2914409 </p>
                  <p><strong>Mobile:</strong> +91 90253 16833</p>
                  <p><strong>WhatsApp:</strong>  +91 90253 16833</p>
                  <p><strong>Email:</strong>  inf.ppcpdy@gmail.com</p>
                  <p><strong>Working Hours:</strong>  09:30 AM - 08:30 PM (Monday – Saturday)
                  10:30 AM - 06:30 PM (Sunday)</p>
      
                  <p><strong>Confirm office opening hours on government and local holidays.</strong></p>
                </div>
      
                 <div className="card shadow p-3 mb-3 border-light" style={{ borderLeft: "5px solid #D4EEFF" }}>
                  <div className="p-2  fw-bold text-center" style={{ backgroundColor: "#F0F0F0", color: "#222222" }}>
                    Bank Details
                  </div>
                  <p><strong>Account Name:</strong> KALAISELVI</p>
                  <p><strong>Bank Name:</strong> AXIS BANK </p>
                  <p><strong>Account Number:</strong> 924010047404397</p>
                  <p><strong>IFSC Code:</strong> UTIB0005555</p>
                  <p><strong>Bank Address:</strong> Axis bank
          Auroville Branch Tamil Nadu 
          Pincode : 605101
      </p>
      <p><strong>GPAY,PHONE PE AND ALL UPI PAYMENT:</strong></p>
      <p><strong>UPI NUMBER:</strong> 9150524409 – KALAI SELVI RAJENDRAN </p>
      <p><strong>UPI ID:</strong> rksbalarks@okaxis</p>
                </div>
                <div className="card shadow p-3 border-light" style={{ borderLeft: "5px solid #D4EEFF" }}>
                  <div className="p-2  fw-bold text-center" style={{ backgroundColor: "#F0F0F0", color: "#222222" }}>
                    SCAN HERE
                  </div>
       <img src={onlinPay} alt="" />
                </div>
              </div>
              </div>
    </div>
  );
};

export default ContactedPage;
