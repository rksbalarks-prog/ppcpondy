
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

const PropertyVideos = () => {
  const location = useLocation();
  const storedPhoneNumber = location.state?.phoneNumber || localStorage.getItem("phoneNumber") || "";
  const [phoneNumber, setPhoneNumber] = useState(storedPhoneNumber);

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
const [showPopup, setShowPopup] = useState(false);
const [selectedPpcId, setSelectedPpcId] = useState(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-property-videos`);

      const normalizedVideos = res.data.videos.map(video => ({
        ...video,
        video: video.video.replace(/\\/g, "/")
      }));

      setVideos(normalizedVideos);
    } catch (error) {
      console.error("Failed to fetch videos", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (ppcId) => {
    navigate(`/detail/${ppcId}`, { state: { phoneNumber } });
  };

  return (
    <div className="container py-4">
      <h4 className="mb-3">Property Videos</h4>

      {loading ? (
        <p>Loading videos...</p>
      ) : videos.length === 0 ? (
        <p>No videos found.</p>
      ) : (
        <div className="row">
          {videos.map((video, index) => (
            <div className="col-12 mb-4" key={index}>
              <div className="card shadow-sm h-100">
                <video
                  controls
                  preload="metadata"
                  style={{
                    width: "100%",
                    height: "220px",
                    objectFit: "contain",
                    borderTopLeftRadius: "5px",
                    borderTopRightRadius: "5px",
                    backgroundColor: "#000"
                  }}
                >
                  <source
                    src={`https://ppcpondy.com/PPC/${video.video}`}
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>
                <div className="card-body">
                  <p className="card-text fw-bold">
  <span
  style={{ cursor: "pointer", color: "#007bff" }}
  onClick={() => {
    setSelectedPpcId(video.ppcId);
    setShowPopup(true);
  }}
>
  PPC ID: {video.ppcId}, <strong style={{ color: "black" }}>{video.propertyType}</strong>
</span>


                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showPopup && (
  <div style={{
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999
  }}>
    <div style={{
      background: 'white', padding: '20px', borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)', textAlign: 'center'
    }}>
      <p>Do you want to see the property detail?</p>
      <button
        onClick={() => {
          handleNavigate(selectedPpcId);
          setShowPopup(false);
        }} className="p-2 border-0"
        style={{ marginRight: '10px' , background:"#30747F", color:"#fff"}}
      >
        Yes
      </button>
      <button className="p-2 border-0" style={{ background:"#f05226ff", color:"#fff"}} onClick={() => setShowPopup(false)}>No</button>
    </div>
  </div>
)}

    </div>
  );
};

export default PropertyVideos;




 