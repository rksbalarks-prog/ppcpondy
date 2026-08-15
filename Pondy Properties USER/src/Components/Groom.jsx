 


import React, { useEffect, useState } from 'react';
import axios from 'axios';
import NoData from "../Assets/OOOPS-No-Data-Found.png";
import { useLocation } from 'react-router-dom';

const Groom = () => {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPopup, setShowPopup] = useState(false);

  const location = useLocation();
  const storedPhoneNumber = location.state?.phoneNumber || localStorage.getItem("phoneNumber") || "";
  const [phoneNumber, setPhoneNumber] = useState(storedPhoneNumber);

  // Fetch uploaded images
  const fetchUploadedImages = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-uploadimages`);
      const sortedUploads = res.data.data.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
      setUploads(sortedUploads);
    } catch (err) {
      // setError('Failed to fetch uploaded images');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUploadedImages();
  }, []);

  // Record user viewing the Groom page
  useEffect(() => {
    const recordDashboardView = async () => {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
          phoneNumber: phoneNumber,
          viewedFile: "Groom",
          viewTime: new Date().toISOString(),
        });
      } catch (err) {}
    };

    if (phoneNumber) {
      recordDashboardView();
    }
  }, [phoneNumber]);

  // Handle image click and record the click in DB
  const handleImageClick = async (imageUrl) => {

    try {
      if (!phoneNumber) return;

      await axios.post(`${process.env.REACT_APP_API_URL}/record-image-click-groom`, {
        phoneNumber,
        imageUrl
      });
    } catch (err) {
      console.error("Image click logging failed:", err);
    }
            setShowPopup(true);
  };

  const handleYes = () => {
    setShowPopup(false);
    window.location.href = "https://play.google.com/store/apps/details?id=com.thulirsolutions.pondicherrymatrimony&hl=en"; // or use navigate("/your-path") for internal route
  };

  const handleNo = () => {
    setShowPopup(false);
  };

  return (
    <div style={{ padding: '5px' }}>
      {loading ? (
        <div
          className="text-center my-4"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <span className="spinner-border text-primary" role="status" />
          <p className="mt-2">Loading Data...</p>
        </div>
      ) : uploads.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {uploads.map((upload) =>
            upload.images.map((imgPath, idx) => {
              const imageUrl = `https://ppcpondy.com/PPC/${imgPath.replace(/\\/g, '/')}`;
              return (
                <img
                  key={upload._id + idx}
                  src={imageUrl}
                  alt="Uploaded"
                  onClick={() => handleImageClick(imageUrl)}
                  style={{
                    height: "170px",
                    width: '100%',
                    objectFit: 'fill',
                    borderRadius: '15px',
                    boxShadow: "rgba(0, 0, 0, 0.08) 0px 4px 12px"
                  }}
                />
              );
            })
          )}
                     {showPopup && (
        <div className="popup-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1509,
            animation: 'fadeIn 0.3s ease-in-out',
          }}>
          <div  className="dropdown-popup"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white',
              width: '100%',
              maxWidth: '300px',
              padding: '10px',
              zIndex: 10,
              boxShadow: '0 4px 8px rgba(0, 123, 255, 0.3)',
              borderRadius: '18px',
              animation: 'popupOpen 0.3s ease-in-out',
            }}>
            <p className='text-center'>you want to see more details?</p>
            <div className="d-flex justify-content-around">
              <button   style={{
                  background: '#EAEAF6',
                  cursor: 'pointer',
                  border: 'none',
                  color: '#0B57CF',
                  borderRadius: '10px',
                  padding: '5px 10px',
                  fontWeight: 500,
                }} onClick={handleNo}>No</button>
              <button    style={{
                  background: '#0B57CF',
                  cursor: 'pointer',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '10px',
                }} onClick={handleYes}>Yes</button>
            </div>
          </div>
        </div>
      )}
        </div>
      ) : (
        <div
          className="text-center my-4"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <img src={NoData} alt="No data" width={100} />
          <p>No Data found.</p>
        </div>
      )}
    </div>
  );
};

export default Groom;
