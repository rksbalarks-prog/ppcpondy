import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicyWeb() {
    const [type, setType] = useState("privacyPolicy"); // Default type
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
           <div className="container mt-5">
            <div>
                <p dangerouslySetInnerHTML={{ __html: content }}></p>  
            </div>
        </div>  )
}
