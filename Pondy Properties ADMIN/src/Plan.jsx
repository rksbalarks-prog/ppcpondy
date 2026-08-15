import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { useSelector } from "react-redux";
import { MdAddPhotoAlternate } from "react-icons/md";
import { FaFileVideo } from "react-icons/fa";
import { Button } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";

function Plan() {
  const location = useLocation();
  const { ppcId, phoneNumber } = location.state || {};
            
  const adminName = useSelector((state) => state.admin.name);
  

  // ✅ Record view on mount
useEffect(() => {
 const recordDashboardView = async () => {
   try {
     await axios.post(`${process.env.REACT_APP_API_URL}/record-view`, {
       userName: adminName,
       viewedFile: "Plan ",
       viewTime: moment().format("YYYY-MM-DD HH:mm:ss"), // optional, backend already handles it


     });
   } catch (err) {
   }
 };

 if (adminName) {
   recordDashboardView();
 }
}, [adminName]);
    
  const [formData, setFormData] = useState({
    phoneNumber: "",
    rentalPropertyAddress: "",
    state: "",
    city: "",
    district: "",
    area: "",
    streetName: "",
    doorNumber: "",
    nagar: "",
    ownerName: "",
    email: "",
    alternatePhone: "",
    countryCode: "+91", // Default value
    propertyMode: "",
    propertyType: "",
    bankLoan: "",
    negotiation: "",
    ownership: "",
    bedrooms: "",
    kitchen: "",
    kitchenType: "",
    balconies: "",
    floorNo: "",
    areaUnit: "",
    propertyApproved: "",
    propertyAge: "",
    postedBy: "",
    facing: "",
    salesMode: "",
    salesType: "",
    furnished: "",
    lift: "",
    attachedBathrooms: "",
    western: "",
    numberOfFloors: "",
    carParking: "",
    bestTimeToCall: "",
  });

  const [photos, setPhotos] = useState([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [video, setVideo] = useState(null);
  const [countryCodes, setCountryCodes] = useState([
    { code: "+1", country: "USA/Canada" },
    { code: "+44", country: "UK" },
    { code: "+91", country: "India" },
    { code: "+61", country: "Australia" },
    { code: "+81", country: "Japan" },
    { code: "+49", country: "Germany" },
    { code: "+33", country: "France" },
    { code: "+34", country: "Spain" },
    { code: "+55", country: "Brazil" },
    { code: "+52", country: "Mexico" },
    { code: "+86", country: "China" },
    { code: "+39", country: "Italy" },
    { code: "+7", country: "Russia/Kazakhstan" },
  ]);
  const [dataList, setDataList] = useState({});

  useEffect(() => {
    if (!ppcId) {
      return;  // If there's no ppcId, do not attempt to fetch data
    }
  
    const fetchPropertyData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/fetch-data?ppcId=${ppcId}`);
        const data = response.data.user;
        setFormData({
          phoneNumber: data.phoneNumber || "",
          propertyMode: data.propertyMode || '',
          propertyType: data.propertyType || '',
          price: data.price || '',
          propertyAge: data.propertyAge || '',
          bankLoan: data.bankLoan || '',
          negotiation: data.negotiation || '',
          ownership: data.ownership || '',
          bedrooms: data.bedrooms || '',
          kitchen: data.kitchen || '',
          kitchenType: data.kitchenType || '',
          balconies: data.balconies || '',
          floorNo: data.floorNo || '',
          areaUnit: data.areaUnit || '',
          propertyApproved: data.propertyApproved || '',
          postedBy: data.postedBy || '',
          facing: data.facing || '',
          salesMode: data.salesMode || '',
          salesType: data.salesType || '',
          description: data.description || '',
          furnished: data.furnished || '',
          lift: data.lift || '',
          attachedBathrooms: data.attachedBathrooms || '',
          western: data.western || '',
          numberOfFloors: data.numberOfFloors || '',
          carParking: data.carParking || '',
          rentalPropertyAddress: data.rentalPropertyAddress || '',
          country: data.country || '',
          state: data.state || '',
          city: data.city || '',
          district: data.district || '',
          area: data.area || '',
          streetName: data.streetName || '',
          doorNumber: data.doorNumber || '',
          nagar: data.nagar || '',
          ownerName: data.ownerName || '',
          email: data.email || '',
          bestTimeToCall: data.bestTimeToCall || ''
        });
        setPhotos(data.photos || []);
        setVideo(data.video || null);
      } catch (error) {
        toast.error('Failed to fetch property details');
      }
    };
  
    fetchPropertyData();
  }, [ppcId]);
  

  // Fetch dropdown data
  const fetchDropdownData = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/fetch`);
      const groupedData = response.data.data.reduce((acc, item) => {
        if (!acc[item.field]) acc[item.field] = [];
        acc[item.field].push(item.value);
        return acc;
      }, {});
      setDataList(groupedData);
    } catch (error) {
    }
  };

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (photos.length + files.length <= 15) {
      files.forEach((file) => {
        if (file.size > maxSize) {
          alert("File size exceeds the 10MB limit");
          return;
        }
      });
      setPhotos([...photos, ...files]);
      setSelectedPhotoIndex(0);
    } else {
      alert("Maximum 15 photos can be uploaded.");
    }
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
    if (index === selectedPhotoIndex) {
      setSelectedPhotoIndex(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!ppcId) {
      alert("PPC-ID is required. Please refresh or try again.");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("ppcId", ppcId);
    Object.keys(formData).forEach((key) => {
      formDataToSend.append(key, formData[key]);
    });

    photos.forEach((photo) => {
      formDataToSend.append("photos", photo);
    });

    if (video) {
      formDataToSend.append("video", video);
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/update-property`,
        formDataToSend,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      alert(response.data.message);
    } catch (error) {
    }
  };

  return (
    <div>
      <h1>Edit Property</h1>
      <form onSubmit={handleSubmit}>
        <p className="p-3" style={{ color: "white", backgroundColor: "rgb(47,116,127)" }}>
          PPC-ID: {ppcId}
        </p>

        {/* Photo Upload */}
        <div>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handlePhotoUpload}
            name="photos"
            id="photo-upload"
            className="photo-upload-input"
          />
          <label htmlFor="photo-upload" className="photo-upload-label fw-normal m-0">
            <MdAddPhotoAlternate
              style={{
                color: "white",
                backgroundColor: "#2e86e4",
                padding: "5px",
                fontSize: "30px",
                borderRadius: "50%",
                marginRight: "5px",
              }}
            />
            Upload Property Images
          </label>
        </div>

        {/* Display uploaded photos */}
        {photos.length > 0 && (
          <div className="uploaded-photos">
            <h4>Uploaded Photos</h4>
            <div className="uploaded-photos-grid">
              {photos.map((photo, index) => (
                <div key={index} className="uploaded-photo-item">
                  <input
                    type="radio"
                    name="selectedPhoto"
                    className="me-1"
                    checked={selectedPhotoIndex === index}
                    onChange={() => setSelectedPhotoIndex(index)}
                  />
                  <img src={URL.createObjectURL(photo)} alt="Uploaded" className="uploaded-photo mb-3" />
                  <button className="remove-photo-btn" onClick={() => removePhoto(index)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video Upload */}
        <h4 style={{ color: "rgb(47,116,127)", fontWeight: "bold", marginBottom: "10px" }}>
          Property Video
        </h4>
        <div className="form-group">
          <input
            type="file"
            name="video"
            accept="video/*"
            id="videoUpload"
            onChange={(e) => setVideo(e.target.files[0])}
            className="d-none"
          />
          <label htmlFor="videoUpload" className="file-upload-label fw-normal">
            <span className="ps-5 pt-5">
              <FaFileVideo
                style={{
                  color: "white",
                  backgroundColor: "#2e86e4",
                  padding: "5px",
                  fontSize: "30px",
                  marginRight: "5px",
                }}
              />
              Upload Property Video
            </span>
          </label>
        </div>
        {video && (
          <div className="selected-video-container">
            <h4 className="text-start">Selected Video:</h4>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <video width="200" controls>
                <source src={URL.createObjectURL(video)} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <Button variant="danger" onClick={() => setVideo(null)} style={{ height: "40px" }}>
                Remove
              </Button>
            </div>
          </div>
        )}

        {/* Form Fields */}
        <div className="form-group">
          <label>Phone Number:</label>
          <input
            type="text"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleFieldChange}
            className="form-control"
          />
        </div>

        {/* Country Code Dropdown */}
        <div style={{ marginBottom: "15px" }}>
          <label>
            Country Code:
            <select
              name="countryCode"
              value={formData.countryCode || ""}
              onChange={handleFieldChange}
              className="form-control"
            >
              <option value="">Select Country Code</option>
              {countryCodes.map((item, index) => (
                <option key={index} value={item.code}>
                  {item.code} - {item.country}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Dynamic Dropdown Fields */}
        {[
          "propertyMode", "propertyType", "bankLoan", "negotiation", "ownership", "bedrooms", 
          "kitchen", "kitchenType", "balconies", "floorNo", "areaUnit", "propertyApproved", 
          "propertyAge", "postedBy", "facing", "salesMode", "salesType", "furnished", "lift", 
          "attachedBathrooms", "western", "numberOfFloors", "carParking", "bestTimeToCall"
        ].map((field) => (
          <div key={field} style={{ marginBottom: "15px" }}>
            <label>
              {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, " $1")}:
              <select
                name={field}
                value={formData[field] || ""}
                onChange={handleFieldChange}
                className="form-control"
              >
                <option value="">Select {field.replace(/([A-Z])/g, " $1")}</option>
                {dataList[field] && dataList[field].map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ))}

        {/* Submit Button */}
        <button type="submit" className="btn btn-primary">
          Save Property
        </button>
      </form>
    </div>
  );
}

export default Plan;
