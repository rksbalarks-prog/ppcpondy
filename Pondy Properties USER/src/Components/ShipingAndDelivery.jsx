








import React, { useState, useEffect } from "react";
 import "react-quill/dist/quill.snow.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

const ShippingAndDelivery = () => {
    const [type, setType] = useState("shiping&Delivery"); // Default type
    const [content, setContent] = useState("");

          
const navigate = useNavigate();


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

    return (
           <div className="container">
              
            <div>
                <p dangerouslySetInnerHTML={{ __html: content }}></p>  
            </div>
        </div>
    );
};

export default ShippingAndDelivery;





