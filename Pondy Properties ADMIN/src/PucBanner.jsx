 
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const UploadedImagesViewer = () => {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch all uploaded images from backend
  const fetchUploadedImages = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-uploadimages-bride`);
      // Reverse to show latest uploads first
      const sortedUploads = res.data.data.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
      setUploads(sortedUploads);
    } catch (err) {
      setError('Failed to fetch uploaded images');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUploadedImages();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>All Uploaded Images</h2>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {uploads.map((upload) =>
          upload.images.map((imgPath, idx) => (
            <img
              key={upload._id + idx}
              src={`https://ppcpondy.com/PPC/${imgPath.replace(/\\/g, '/')}`}
              alt="Uploaded"
              style={{
                width: '120px',
                height: '120px',
                objectFit: 'cover',
                borderRadius: '8px',
                border: '1px solid #ccc',
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default UploadedImagesViewer;
























































































