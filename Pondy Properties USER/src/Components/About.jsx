





import React, { useState, useEffect } from "react";
 import "react-quill/dist/quill.snow.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

const TextEditor = () => {
    const [type, setType] = useState("aboutUs");  
    const [content, setContent] = useState("");

          
const navigate = useNavigate();

     useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/get-text/${type}`);
                setContent(response.data?.content || "");  
            } catch (error) {
                setContent(""); 
            }
        };

        fetchContent();
    }, [type]);  

    return (
           <div className="container">
                
            <div>
                <p dangerouslySetInnerHTML={{ __html: content }}></p>  
            </div>
        </div>
    );
};

export default TextEditor;


