



import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FiEdit3 } from 'react-icons/fi';
import { RiDeleteBinLine } from 'react-icons/ri';

const UpLoadImagesAds = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);

  const [previewImages, setPreviewImages] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL;

  const fetchUploadedImages = async () => {
    try {
      const res = await axios.get(`${API_URL}/get-uploadimages-ads`);
      setUploads(res.data.data);
    } catch (err) {
      setError('Failed to fetch uploaded images');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUploadedImages();
  }, []);

const handleFileChange = (e) => {
  const newFiles = Array.from(e.target.files);

  // Combine existing and new files
  const combinedFiles = [...selectedFiles, ...newFiles];

if (combinedFiles.length > 50) {
  setMessage('You can only upload up to 50 images.');
  return;
}


  setSelectedFiles(combinedFiles);

  // Generate new preview URLs and append to existing ones
  const newPreviews = newFiles.map(file => URL.createObjectURL(file));
  setPreviewImages(prev => [...prev, ...newPreviews]);

  setMessage('');
};


  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setMessage('Please select at least one image.');
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append('images', file));

    try {
      if (editId) {
        await axios.put(`${API_URL}/edit-uploadimage-ads/${editId}`, formData);
        setMessage('Images updated successfully!');
        setEditId(null);
      } else {
        await axios.post(`${API_URL}/uploadimage-ads`, formData);
        setMessage('Images uploaded successfully!');
      }

      setSelectedFiles([]);
      setPreviewImages([]);
      fetchUploadedImages();
    } catch (error) {
      setMessage(`Upload failed: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this upload?')) return;

    try {
      await axios.delete(`${API_URL}/delete-uploadimage-ads/${id}`);
      setMessage('Upload deleted successfully');
      fetchUploadedImages();
    } catch (error) {
      setMessage(`Delete failed: ${error.message}`);
    }
  };

  const handleEdit = (id) => {
    setEditId(id);
    setMessage('Now editing this upload. Select new images and click "Upload"');
    window.scrollTo(0, 0);
  };


    const fileInputRef = useRef(null);

  const handleClick = () => {
    fileInputRef.current.click();
  };
  return (
    <div style={{ padding: '20px' }}>
      <h2>{editId ? 'Edit Images' :  'Ads Images Upload (Maximum 50 Images)'}</h2>
  <div
      onClick={handleClick}
      style={{
        border: '2px dashed #9ddcff',
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#eefaff',
        borderRadius: '8px',
        cursor: 'pointer',
        width: '250px',
        margin: 'auto',
      }}
    >
      <img
        src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAB8ElEQVR4nO2aPW7CMBRFZ2YoXATnFFGpXAJnIBOoiu6oUKzAB6wE7gEGS9EWmFaW+FT8ZrYSlmtb8m9+zs6TYE+9LBDwMDCwZC/3AO/X6+X1+8Hg8HGEOshO4A2zUE5Qi9SQBlWAHqAAgj8hYZ4FGkAB8BMo7JoBKw9AO+4IVG+AOaCtwAJeUOfZx/Aa2BYwACML+2ASUARXLtEF4BqAoyyqya9FiCNgaqHPBpNfXQmCUMzCb0U9z+dMQJBAJxEAJFBTxLkEio1lOdyAIMlgBFI6WRzFkiSRF8DQCgaTZI6Ab4ZBgdDeHogqMRD2G9dpMkKyAo5sxXJc2kSIJcRckmrbA+a+9MJkklNs3GQT1H7v8bgWMRtBDz29U11Oekx8Ufb+pILJEDvAePAKmCFJ3YOxx9Hfl8DP5L8EZ4ANwMgJGUt4wAiRwEJbOXDCN34ewU+DWJgIWdV/EbDdX+wULZr3YysOngec6ULODbwOXB9nhS3INAXAAAAAElFTkSuQmCC"
        alt="upload icon"
        style={{ width: '40px', marginBottom: '8px' }}
      />
      <div style={{ color: '#00aaff', fontWeight: 'bold' }}>Click To Upload</div>
      <input
        type="file"
        multiple
        accept="image/*,video/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>      <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap' }}>
        {previewImages.map((src, idx) => (
          <img key={idx} src={src} alt={`preview-${idx}`} style={{ width: '100px', height: '100px', objectFit: 'cover', margin: '5px' }} />
        ))}
      </div>
      <button onClick={handleUpload} style={{ marginTop: '10px' , background: '#49B02D', color: 'white'}}>
        {editId ? 'Update Images' : 'Upload'}
      </button>
      {message && <p style={{ marginTop: '10px', color: message.includes('success') ? 'green' : 'red' }}>{message}</p>}

      <hr style={{ margin: '30px 0' }} />
      <h2 className='text-center text-success m-3' > Get Ads Images </h2>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Uploaded At</th>
              <th>Images</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {uploads.map((upload, index) => (
              <tr key={upload._id}>
                <td>{index + 1}</td>
                <td>{new Date(upload.uploadDate || upload.createdAt).toLocaleString()}</td>
                <td style={{ display: 'flex', flexWrap: 'wrap' }}>
                  {upload.images.map((img, i) => (
                    <img
                      key={i}
                      src={`https://ppcpondy.com/PPC/${img.replace(/\\/g, '/')}`}
                    // src={`http://localhost:5000/${img.replace(/\\/g, '/')}`}
                      alt="upload"
                      style={{ width: '80px', height: '80px', objectFit: 'cover', margin: '3px' }}
                    />
                  ))}
                </td>
                <td>
                  <button onClick={() => handleEdit(upload._id)} style={{ marginRight: '10px' , background: '#2E59D7', color: 'white'}}><FiEdit3 />
</button>
                  <button onClick={() => handleDelete(upload._id)} style={{ backgroundColor: '#24272C', color: 'white' }}><RiDeleteBinLine /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UpLoadImagesAds;
