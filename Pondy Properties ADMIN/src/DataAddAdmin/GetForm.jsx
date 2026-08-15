




import React, { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment";
import { useSelector } from "react-redux";

function GetForm() {
  const [ppcId, setPpcId] = useState(null);
  const [formData, setFormData] = useState({
    ppcId: "",
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
    video: "",
    photos: [],
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
     district: "",
    minPrice:"",
    maxPrice:"",
    paymentType:"",
    state:"",
  });

 
  
  useEffect(() => {
    const fetchPpcId = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/latest-ppcid`);
        const nextPpcId = response.data.latestPpcId ? response.data.latestPpcId + 1 : 1001;
        setPpcId(nextPpcId);
      } catch (error) {
      }
    };

    fetchPpcId();
  }, []);

  const [dataList, setDataList] = useState({}); // Object to store dropdown options for each field

  // Fetch dropdown options for all fields
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

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files).map((file) => URL.createObjectURL(file));
    setFormData({ ...formData, photos: files });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/add-property`, formData);
      alert(response.data.message);
      if (response.data.message === "Property Added Successfully") {
        // Redirect or handle success
      }
    } catch (error) {
    }
  };

  useEffect(() => {
    fetchDropdownData(); // Fetch dropdown options when the component mounts
  }, []);


  
const reduxAdminName = useSelector((state) => state.admin.name);
const reduxAdminRole = useSelector((state) => state.admin.role);

const adminName = reduxAdminName || localStorage.getItem("adminName");
const adminRole = reduxAdminRole || localStorage.getItem("adminRole");


 const [allowedRoles, setAllowedRoles] = useState([]);
 const [loading, setLoading] = useState(true);
 
 const fileName = "Admin GetForm"; // current file
 
 // Sync Redux to localStorage
 useEffect(() => {
   if (reduxAdminName) localStorage.setItem("adminName", reduxAdminName);
   if (reduxAdminRole) localStorage.setItem("adminRole", reduxAdminRole);
 }, [reduxAdminName, reduxAdminRole]);
 
 // Record dashboard view
 useEffect(() => {
   const recordDashboardView = async () => {
     try {
       await axios.post(`${process.env.REACT_APP_API_URL}/record-view`, {
         userName: adminName,
         role: adminRole,
         viewedFile: fileName,
         viewTime: moment().format("YYYY-MM-DD HH:mm:ss"),
       });
     } catch (err) {
     }
   };
 
   if (adminName && adminRole) {
     recordDashboardView();
   }
 }, [adminName, adminRole]);
 
 // Fetch role-based permissions
 useEffect(() => {
   const fetchPermissions = async () => {
     try {
       const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-role-permissions`);
       const rolePermissions = res.data.find((perm) => perm.role === adminRole);
       const viewed = rolePermissions?.viewedFiles?.map(f => f.trim()) || [];
       setAllowedRoles(viewed);
     } catch (err) {
     } finally {
       setLoading(false);
     }
   };
 
   if (adminRole) {
     fetchPermissions();
   }
 }, [adminRole]);
 

 if (loading) return <p>Loading...</p>;

 if (!allowedRoles.includes(fileName)) {
   return (
     <div className="text-center text-red-500 font-semibold text-lg mt-10">
       Only admin is allowed to view this file.
     </div>
   );
 }
 
 

  return (
    <div>
      <h1>Property Management</h1>
      <form onSubmit={handleSubmit}>
      <p className='p-3' style={{color:"white",backgroundColor:"rgb(47,116,127)"}}>PPC-ID: {ppcId}</p>
      {Object.keys(formData).map((field) => {
          if (field === "photos") {
            return (
              <div key={field} style={{ marginBottom: "15px" }}>
                <label>
                  Upload Photos:
                  <input
                    type="file"
                    name={field}
                    multiple
                    onChange={handlePhotoChange}
                    className="form-control"
                  />
                </label>
                <div>
                  {formData.photos.map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`Property ${index + 1}`}
                      style={{ width: "100px", marginRight: "10px" }}
                    />
                  ))}
                </div>
              </div>
            );
          } else if (
            [
              "propertyMode",
              "propertyType",
              "bankLoan",
              "negotiation",
              "ownership",
              "bedrooms",
              "kitchen",
              "kitchenType",
              "balconies",
              "floorNo",
              "areaUnit",
              "propertyApproved",
              "propertyAge",
              "postedBy",
              "facing",
              "salesMode",
              "salesType",
              "furnished",
              "lift",
              "attachedBathrooms",
              "western",
              "numberOfFloors",
              "carParking",
              "bestTimeToCall",
               "district",
              "minPrice",
              "maxPrice",
              "paymentType",
              "state",

            ].includes(field)
          ) {
            return (
              <div key={field} style={{ marginBottom: "15px" }}>
                <label>
                  {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, " $1")}:
                  <select
                    name={field}
                    value={formData[field] || ""}
                    onChange={handleFieldChange}
                    className="form-control"
                  >
                    <option value="">Select {field}</option>
                    {dataList[field]?.map((value, index) => (
                      <option key={index} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            );
          } else {
            return (
              <div key={field} style={{ marginBottom: "15px" }}>
                <label>
                  {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, " $1")}:
                  <input
                    type="text"
                    name={field}
                    value={formData[field] || ""}
                    onChange={handleFieldChange}
                    className="form-control"
                  />
                </label>
              </div>
            );
          }
        })}
        <button type="submit" className="btn btn-primary">
          Save Property
        </button>
      </form>
    </div>
  );
}

export default GetForm;
