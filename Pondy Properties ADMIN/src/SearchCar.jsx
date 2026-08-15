

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import moment from "moment";
import { useSelector } from "react-redux";
import {FaKitchenSet ,FaChartArea, FaMapPin, FaDoorClosed , FaRoad ,FaRegAddressCard } from 'react-icons/fa6';
import { MdLocationOn, MdOutlineMeetingRoom, MdOutlineOtherHouses, MdSchedule , MdApproval, MdLocationCity } from "react-icons/md";
import { BsBuildingsFill, BsFillHouseCheckFill } from "react-icons/bs";
import { GiKitchenScale,  GiResize , GiGears} from "react-icons/gi";
import { HiUserGroup } from "react-icons/hi";
import { BiSearchAlt,  BiWorld} from "react-icons/bi";
import {  MdElevator   } from "react-icons/md";
import { FaEye, FaEdit } from 'react-icons/fa';
import { RiRadioButtonFill } from 'react-icons/ri';
import { 
  FaFilter, FaHome, FaCity, FaRupeeSign, FaBed, FaCheck, FaTimes, 
  FaTools, FaIdCard, FaCalendarAlt, FaUserAlt, FaRulerCombined, FaBath, 
   FaCar, FaHandshake, FaToilet, 
  FaCamera,
  
} from "react-icons/fa";
import { TbArrowLeftRight, TbChecklist } from "react-icons/tb";
import { AiOutlineColumnWidth, AiOutlineColumnHeight } from "react-icons/ai";
import { BsBank } from "react-icons/bs";
import { useNavigate } from 'react-router-dom';
import { Table } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
const SearchProperty = () => {
  const [properties, setProperties] = useState([]);
    const [hoverAdvance, setHoverAdvance] = useState(false);
    const [hoverSearch, setHoverSearch] = useState(false);
    const navigate = useNavigate(); // Initialize navigate

  
  const [advancedFilters, setAdvancedFilters] = useState({
    propertyMode: '', propertyType: '', minPrice: '', maxPrice: '', propertyAge: '', bankLoan: '',
    negotiation: '', length: '', breadth: '', totalArea: '', ownership: '', bedrooms: '',
    kitchen: '', kitchenType: '', balconies: '', floorNo: '', areaUnit: '', propertyApproved: '',
    facing: '', salesMode: '', salesType: '', furnished: '', lift: '', attachedBathrooms: '',
    western: '', numberOfFloors: '', carParking: '', city: '' , status:'', area: ''
  });
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/properties`);
        setProperties(response.data); // Save all fetched properties
      } catch (error) {
      }
    };
    fetchProperties();
  }, []);
            

      const tableRef = useRef();
    
      const handlePrint = () => {
        const printContent = tableRef.current.innerHTML;
        const printWindow = window.open("", "", "width=1200,height=800");
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Table</title>
              <style>
                table { border-collapse: collapse; width: 100%; font-size: 12px; }
                th, td { border: 1px solid #000; padding: 6px; text-align: left; }
                th { background: #f0f0f0; }
              </style>
            </head>
            <body>
              <h3>Filtered Users</h3>
              <table>${printContent}</table>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      };
  const filteredProperties = properties.filter((property) => {
    const advancedFilterMatch = Object.keys(advancedFilters).every((key) => {
      if (!advancedFilters[key]) return true;
  
      if (key === "minPrice") {
        return property.price >= Number(advancedFilters[key]);
      }
      if (key === "maxPrice") {
        return property.price <= Number(advancedFilters[key]);
      }
  
      return property[key]?.toString()?.toLowerCase()?.includes(advancedFilters[key]?.toLowerCase());
    });
  
    return advancedFilterMatch; // ← THIS was missing
  });
  const [showStatusOptions, setShowStatusOptions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const statusOptions = ["active", "pending", "delete", "incomplete", "complete", "contact"];

  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  const closeStatusOptions = () => {
    setShowStatusOptions(false);
    setSearchQuery('');
  };

  const handleStatusSelect = (value) => {
    setAdvancedFilters((prev) => ({ ...prev, status: value }));
    closeStatusOptions();
  };

  const filterOptions = (options) =>
    options.filter((option) => option.toLowerCase().includes(searchQuery.toLowerCase()));

    const [dataList, setDataList] = useState({});
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
        
          const [dropdownState, setDropdownState] = useState({
            activeDropdown: null,
            filterText: "",
            position: { top: 0, left: 0 },
          });
          const toggleDropdown = (field) => {
            setDropdownState((prevState) => ({
              activeDropdown: prevState.activeDropdown === field ? null : field,
              filterText: "",
            }));
          };
          const fieldLabels = {
            propertyMode: "Property Mode",
            propertyType: "Property Type",
            price: "Price",
            propertyAge: "Property Age",
            bankLoan: "Bank Loan",
            negotiation: "Negotiation",
            length: "Length",
            breadth: "Breadth",
            totalArea: "Total Area",
            ownership: "Ownership",
            bedrooms: "Bedrooms",
            kitchen: "Kitchen",
            kitchenType: "Kitchen Type",
            balconies: "Balconies",
            floorNo: "Floor No.",
            areaUnit: "Area Unit",
            propertyApproved: "Property Approved",
            postedBy: "Posted By",
            facing: "Facing",
            salesMode: "Sales Mode",
            salesType: "Sales Type",
            description: "Description",
            furnished: "Furnished",
            lift: "Lift",
            attachedBathrooms: "Attached Bathrooms",
            western: "Western Toilet",
            numberOfFloors: "Number of Floors",
            carParking: "Car Parking",
            rentalPropertyAddress: "Property Address",
            country: "Country",
            state: "State",
            city: "City",
            district: "District",
            area: "Area",
            streetName: "Street Name",
            doorNumber: "Door Number",
            nagar: "Nagar",
            ownerName: "Owner Name",
            email: "Email",
            phoneNumber: "Phone Number",
            phoneNumberCountryCode: "Phone Country Code",
            alternatePhone: "Alternate Phone",
            alternatePhoneCountryCode: "Alternate Phone Country Code",
            bestTimeToCall: "Best Time to Call",
          };
  const handleAdvancedFilterChange = (e) => {
    const { name, value } = e.target;
    setAdvancedFilters((prevState) => ({ ...prevState, [name]: value }));
    setDropdownState((prevState) => ({ ...prevState, filterText: value }));
  };
  const renderDropdown = (field) => {
    const options = dataList[field] || [];
    const filteredOptions = options.filter((option) =>
      option.toLowerCase().includes(dropdownState.filterText.toLowerCase())
    );

    return (
      dropdownState.activeDropdown === field && (
        <div
          className="dropdown-popup"
          style={{
        
            backgroundColor: '#fff',
            width: '100%',
            maxWidth: '400px',
            padding: '10px',
            zIndex: 10,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            overflowY: 'auto',
            maxHeight: '50vh',
            animation: 'popupOpen 0.3s ease-in-out',
          }}
        >
                    <div
        style={{
          fontWeight: "bold",
          fontSize: "16px",
          marginBottom: "10px",
          textAlign: "start",
          color: "#019988",
        }}
      >
         {fieldLabels[field] || "Property Field"}
      </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              placeholder="Filter options..."
              value={dropdownState.filterText}
              onChange={handleAdvancedFilterChange}
              style={{
                width: '80%',
                padding: '5px',
                marginBottom: '10px',
              }}
            />
            <button
              type="button"
              onClick={() => toggleDropdown(field)}
              style={{
                cursor: 'pointer',
                border: 'none',
                background: 'none',
              }}
            >
              <FaTimes size={18} color="red" />
            </button>
          </div>
          <ul
            style={{
              listStyleType: 'none',
              padding: 0,
              margin: 0,
            }}
          >
          
{filteredOptions.map((option, index) => (
<li
  key={index}
  onClick={() => {
    // Update advanced filters
    setAdvancedFilters((prevState) => ({
      ...prevState,
      [field]: option,
    }));
    
 
    
    // Toggle dropdown visibility
    toggleDropdown(field);
  }}
  style={{
    padding: '5px',
    cursor: 'pointer',
    backgroundColor: '#f9f9f9',
    marginBottom: '5px',
  }}
>
  {option}
</li>
))}

          </ul>
        </div>
      )
    );
  };



  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);
  
  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");
  
  
   const [allowedRoles, setAllowedRoles] = useState([]);
       const [loading, setLoading] = useState(true);
   
   const fileName = "Search Property"; // current file
   
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
    <div className="container">
<h3>All Properties</h3>
<button
  type="button"
  className="btn btn-primary mb-3"
  data-bs-toggle="modal"
  data-bs-target="#filterPopup"
>
  Search List
</button>
             <button className="btn btn-secondary mb-3 ms-2" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
<div
  className="modal fade"
  id="filterPopup"
  tabIndex="-1"
  aria-labelledby="filterPopupLabel"
  aria-hidden="true"
>
  <div className="modal-dialog modal-dialog-centered">
    <div className="modal-content rounded-4 shadow">
      <div className="modal-header">
        <h5 className="modal-title" id="filterPopupLabel">
          Search Property
        </h5>
        <button
          type="button"
          className="btn-close"
          data-bs-dismiss="modal"
          aria-label="Close"
        ></button>
      </div>
      <div className="modal-body">
         <div className="mb-4 three-column-grid"
 >


        <div className="form-group">
      <label style={{ width: '100%' }}>
        <label>Status</label>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ flex: "1", position: "relative" }}>
            <select
              name="status"
              value={advancedFilters.status || ""}
              onChange={() => {}}
              className="form-control"
              style={{ display: "none" }}
            >
              <option value="">Select status</option>
              {statusOptions.map((status, index) => (
                <option key={index} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <button
              className="m-0"
              type="button"
              onClick={() => setShowStatusOptions(!showStatusOptions)}
              style={{
                cursor: "pointer",
                border: "1px solid #2F747F",
                padding: "10px",
                background: "#fff",
                borderRadius: "5px",
                width: "100%",
                textAlign: "left",
                color: "#2F747F",
              }}
            >
              <span style={{ marginRight: "10px" }}>
                <TbChecklist />
              </span>
              {advancedFilters.status || "Select status"}
            </button>

            {showStatusOptions && (
              <div
                style={{
                  position: 'fixed',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: '#E9F7F2',
                  width: '100%',
                  maxWidth: '350px',
                  padding: '10px',
                  zIndex: 10,
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  overflowY: 'auto',
                  maxHeight: '50vh',
                  animation: 'popupOpen 0.3s ease-in-out',
                }}
              >
                <label
                  style={{
                    fontWeight: "bold",
                    fontSize: "16px",
                    marginBottom: "10px",
                    textAlign: "start",
                    color: "#019988",
                  }}
                >
                  Status
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search options"
                  style={{
                    width: '80%',
                    padding: '5px',
                    background: "#C0DFDA",
                    border: "none",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={closeStatusOptions}
                  style={{
                    cursor: 'pointer',
                    border: 'none',
                    background: 'none',
                    float: 'right',
                  }}
                >
                  <FaTimes size={18} color="red" />
                </button>

                {filterOptions(statusOptions).map((value, index) => (
                  <div
                    key={index}
                    style={{ padding: "10px", cursor: "pointer" }}
                    onClick={() => handleStatusSelect(value)}
                  >
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </label>
    </div>
        {/* Property Mode */}
        <div className="form-group ">
          <label style={{ width: '100%'}}>
          <label>Property Mode  </label>
      
            <div style={{ display: "flex", alignItems: "center", width:"100%" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="propertyMode"
                  value={advancedFilters.propertyMode || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select Property Mode</option>
                  {dataList.propertyMode?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("propertyMode")}
                  style={{
                    cursor: "pointer",
                    border: "1px solid #2F747F",
                    padding: "10px",
                    background: "#fff",
                    borderRadius: "5px",
                    width: "100%",
                    textAlign: "left",
                    color: "#2F747F",
                  }}
                >
                  <span style={{ marginRight: "10px" }}>
            <MdApproval />
                  </span>
                  {advancedFilters.propertyMode || "Select Property Mode"}
                </button>
      
                {renderDropdown("propertyMode")}
              </div>
            </div>
          </label>
        </div>
      
      
        <div className="form-group ">
          <label style={{ width: '100%'}}>
      <label>Property Type  </label>
            <div style={{ display: "flex", alignItems: "center"}}>
              <div style={{ flex: "1" }}>
                <select
                  name="propertyType"
                  value={advancedFilters.propertyType || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select property Type</option>
                  {dataList.propertyType?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("propertyType")}
                  style={{
                    cursor: "pointer",
                    border: "1px solid #2F747F",
                    padding: "10px",
                    background: "#fff",
                    borderRadius: "5px",
                    width: "100%",
                    textAlign: "left",
                    color: "#2F747F",
                  }}
                >
                  <span style={{ marginRight: "10px" }}>
         <MdOutlineOtherHouses />
                  </span>
                  {advancedFilters.propertyType || "Select Property Type"}
                </button>
      
                {renderDropdown("propertyType")}
              </div>
            </div>
          </label>
        </div>
        {/* Price */}
       
        <div className="form-group ">
        <label>Price  </label>
        <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
          <FaRupeeSign className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
          <input
            type="tel"
            name="price"
            value={advancedFilters.price}
            onChange={handleAdvancedFilterChange}
            className="form-input m-0"
            placeholder="price"
            style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
          />
        </div>
        </div>
        {/* Property Age */}
        <div className="form-group ">
          <label style={{ width: '100%'}}>
          <label>Property Age </label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="propertyAge"
                  value={advancedFilters.propertyAge || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select Property Age</option>
                  {dataList.propertyAge?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("propertyAge")}
                  style={{
                    cursor: "pointer",
                    border: "1px solid #2F747F",
                    padding: "10px",
                    background: "#fff",
                    borderRadius: "5px",
                    width: "100%",
                    textAlign: "left",
                    color: "#2F747F",
                  }}
                >
                  <span style={{ marginRight: "10px" }}>
            <MdSchedule />
                  </span>
                  {advancedFilters.propertyAge || "Select Property Age"}
                </button>
      
                {renderDropdown("propertyAge")}
              </div>
            </div>
          </label>
        </div>
      
        {/* Bank Loan */}
      
        <div className="form-group ">
          <label style={{ width: '100%'}}>
          <label>Bank Loan </label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="bankLoan"
                  value={advancedFilters.bankLoan || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select Bank Loan</option>
                  {dataList.bankLoan?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("bankLoan")}
                  style={{
                    cursor: "pointer",
                    border: "1px solid #2F747F",
                    padding: "10px",
                    background: "#fff",
                    borderRadius: "5px",
                    width: "100%",
                    textAlign: "left",
                    color: "#2F747F",
                  }}
                >
                  <span style={{ marginRight: "10px" }}>
             <BsBank />
                  </span>
                  {advancedFilters.bankLoan || "Select Bank Loan"}
                </button>
      
                {renderDropdown("bankLoan")}
              </div>
            </div>
          </label>
        </div>
      
      {/* // )} */}
      
      
      {/* {currentStep >= 2 && ( */}
        {/* Negotiation */}
      
        <div className="form-group ">
          <label style={{ width: '100%'}}>
          <label>Negotiation </label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="negotiation"
                  value={advancedFilters.negotiation || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select negotiation</option>
                  {dataList.negotiation?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("negotiation")}
                  style={{
                    cursor: "pointer",
                    border: "1px solid #2F747F",
                    padding: "10px",
                    background: "#fff",
                    borderRadius: "5px",
                    width: "100%",
                    textAlign: "left",
                    color: "#2F747F",
                  }}
                >
                  <span style={{ marginRight: "10px" }}>
           <FaHandshake />
                  </span>
                  {advancedFilters.negotiation || "Selectnegotiation"}
                </button>
      
                {renderDropdown("negotiation")}
              </div>
            </div>
          </label>
        </div>
      
        {/* Length */} 
        <div className="form-group ">
        <label>length:</label>
        <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
          <AiOutlineColumnHeight className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
          <input
            type="text"
            name="length"
            value={advancedFilters.length}
            onChange={handleAdvancedFilterChange}
            className="form-input m-0"
            placeholder="length"
            style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
          />
        </div>
      </div>
        {/* Breadth */}
        <div className="form-group ">
        <label>breadth:</label>
        <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
          <AiOutlineColumnWidth className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
          <input
            type="text"
            name="breadth"
            value={advancedFilters.breadth}
            onChange={handleAdvancedFilterChange}
            className="form-input m-0"
            placeholder="breadth"
            style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
          />
        </div>
        </div>
       
        {/* Total Area */}
        <div className="form-group ">
        <label>Total Area:  </label>
        <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
          <GiResize className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
          <input
            type="text"
            name="totalArea"
            value={advancedFilters.totalArea}
            onChange={handleAdvancedFilterChange}
            className="form-input m-0"
            placeholder="totalArea"
            style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
          />
        </div>
        </div>
      
          {/* areaUnit */}
          <div className="form-group ">
          <label style={{ width: '100%'}}>
          <label>Area Unit  </label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="areaUnit"
                  value={advancedFilters.areaUnit || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select areaUnit</option>
                  {dataList.areaUnit?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("areaUnit")}
                  style={{
                    cursor: "pointer",
                    border: "1px solid #2F747F",
                    padding: "10px",
                    background: "#fff",
                    borderRadius: "5px",
                    width: "100%",
                    textAlign: "left",
                    color: "#2F747F",
                  }}
                >
                  <span style={{ marginRight: "10px" }}>
                   <FaChartArea />
                  </span>
                  {advancedFilters.areaUnit || "Select areaUnit"}
                </button>
      
                {renderDropdown("areaUnit")}
              </div>
            </div>
          </label>
        </div>
      
        {/* Ownership */}
        <div className="form-group ">
          <label style={{ width: '100%'}}>
          <label>Ownership </label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="ownership"
                  value={advancedFilters.ownership || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select ownership</option>
                  {dataList.ownership?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("ownership")}
                  style={{
                    cursor: "pointer",
                    border: "1px solid #2F747F",
                    padding: "10px",
                    background: "#fff",
                    borderRadius: "5px",
                    width: "100%",
                    textAlign: "left",
                    color: "#2F747F",
                  }}
                >
                  <span style={{ marginRight: "10px" }}>
             <HiUserGroup />
                  </span>
                  {advancedFilters.ownership || "Select ownership"}
                </button>
      
                {renderDropdown("ownership")}
              </div>
            </div>
          </label>
        </div>
      
      
      
        {/* Bedrooms */}
      
      <div className="form-group ">
          <label style={{ width: '100%'}}>
          <label>bedrooms </label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="bedrooms"
                  value={advancedFilters.bedrooms || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select bedrooms</option>
                  {dataList.bedrooms?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("bedrooms")}
                  style={{
                    cursor: "pointer",
                    border: "1px solid #2F747F",
                    padding: "10px",
                    background: "#fff",
                    borderRadius: "5px",
                    width: "100%",
                    textAlign: "left",
                    color: "#2F747F",
                  }}
                >
                  <span style={{ marginRight: "10px" }}>
          <FaBed />
                  </span>
                  {advancedFilters.bedrooms || "Select bedrooms"}
                </button>
      
                {renderDropdown("bedrooms")}
              </div>
            </div>
          </label>
        </div>
        {/* kitchen */}
        <div className="form-group ">
          <label style={{ width: '100%'}}>
          <label>kitchen </label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="kitchen"
                  value={advancedFilters.kitchen || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select kitchen</option>
                  {dataList.kitchen?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("kitchen")}
                  style={{
                    cursor: "pointer",
                    border: "1px solid #2F747F",
                    padding: "10px",
                    background: "#fff",
                    borderRadius: "5px",
                    width: "100%",
                    textAlign: "left",
                    color: "#2F747F",
                  }}
                >
                  <span style={{ marginRight: "10px" }}>
               <GiKitchenScale />
                  </span>
                  {advancedFilters.kitchen || "Select kitchen"}
                </button>
      
                {renderDropdown("kitchen")}
              </div>
            </div>
          </label>
        </div>
          {/* kitchenType */}
          <div className="form-group ">
          <label style={{ width: '100%'}}>
          <label>kitchenType </label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="kitchenType"
                  value={advancedFilters.kitchenType || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select kitchenType</option>
                  {dataList.kitchenType?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("kitchenType")}
                  style={{
                    cursor: "pointer",
                    border: "1px solid #2F747F",
                    padding: "10px",
                    background: "#fff",
                    borderRadius: "5px",
                    width: "100%",
                    textAlign: "left",
                    color: "#2F747F",
                  }}
                >
                  <span style={{ marginRight: "10px" }}>
                 <FaKitchenSet />
                  </span>
                  {advancedFilters.kitchenType || "Select kitchenType"}
                </button>
      
                {renderDropdown("kitchenType")}
              </div>
            </div>
          </label>
        </div>
          {/* balconies */}
          <div className="form-group ">
          <label style={{ width: '100%'}}>
          <label>balconies </label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="balconies"
                  value={advancedFilters.balconies || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select balconies</option>
                  {dataList.balconies?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("balconies")}
                  style={{
                    cursor: "pointer",
                    border: "1px solid #2F747F",
                    padding: "10px",
                    background: "#fff",
                    borderRadius: "5px",
                    width: "100%",
                    textAlign: "left",
                    color: "#2F747F",
                  }}
                >
                  <span style={{ marginRight: "10px" }}>
              <MdOutlineMeetingRoom />
                  </span>
                  {advancedFilters.balconies || "Select balconies"}
                </button>
      
                {renderDropdown("balconies")}
              </div>
            </div>
          </label>
        </div>
          {/* floorNo */}
          <div className="form-group ">
          <label style={{ width: '100%'}}>
          <label>floorNo </label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="floorNo"
                  value={advancedFilters.floorNo || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select floorNo</option>
                  {dataList.floorNo?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("floorNo")}
                  style={{
                    cursor: "pointer",
                    border: "1px solid #2F747F",
                    padding: "10px",
                    background: "#fff",
                    borderRadius: "5px",
                    width: "100%",
                    textAlign: "left",
                    color: "#2F747F",
                  }}
                >
                  <span style={{ marginRight: "10px" }}>
              <BsBuildingsFill />
                  </span>
                  {advancedFilters.floorNo || "Select floorNo"}
                </button>
      
                {renderDropdown("floorNo")}
              </div>
            </div>
          </label>
        </div>
        
      
          {/* propertyApproved */}
      
          <div className="form-group ">
          <label style={{ width: '100%'}}>
          <label>property Approved</label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="propertyApproved"
                  value={advancedFilters.propertyApproved || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select propertyApproved</option>
                  {dataList.propertyApproved?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("propertyApproved")}
                  style={{
                    cursor: "pointer",
                    border: "1px solid #2F747F",
                    padding: "10px",
                    background: "#fff",
                    borderRadius: "5px",
                    width: "100%",
                    textAlign: "left",
                    color: "#2F747F",
                  }}
                >
                  <span style={{ marginRight: "10px" }}>
                    <BsFillHouseCheckFill />
                  </span>
                  {advancedFilters.propertyApproved || "Select propertyApproved"}
                </button>
      
                {renderDropdown("propertyApproved")}
              </div>
            </div>
          </label>
        </div>
      
          {/* postedBy */}
          <div className="form-group ">
          <label style={{ width: '100%'}}>
          <label>postedBy  </label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="postedBy"
                  value={advancedFilters.postedBy || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select postedBy</option>
                  {dataList.postedBy?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("postedBy")}
                  style={{
                    cursor: "pointer",
                    border: "1px solid #2F747F",
                    padding: "10px",
                    background: "#fff",
                    borderRadius: "5px",
                    width: "100%",
                    textAlign: "left",
                    color: "#2F747F",
                  }}
                >
                  <span style={{ marginRight: "10px" }}>
              <FaUserAlt />
                  </span>
                  {advancedFilters.postedBy || "Select postedBy"}
                </button>
      
                {renderDropdown("postedBy")}
              </div>
            </div>
          </label>
        </div>
          {/* facing */}
          <div className="form-group ">
      
          <label style={{ width: '100%'}}>
          <label>facing</label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="facing"
                  value={advancedFilters.facing || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select facing</option>
                  {dataList.facing?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("facing")}
                  style={{
                    cursor: "pointer",
                    border: "1px solid #2F747F",
                    padding: "10px",
                    background: "#fff",
                    borderRadius: "5px",
                    width: "100%",
                    textAlign: "left",
                    color: "#2F747F",
                  }}
                >
                  <span style={{ marginRight: "10px" }}>
               <TbArrowLeftRight />
                  </span>
                  {advancedFilters.facing || "Select facing"}
                </button>
      
                {renderDropdown("facing")}
              </div>
            </div>
          </label>
        </div>
          {/* salesMode */}
      
          <div className="form-group ">
          <label style={{ width: '100%'}}>
          <label>sales Mode</label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="salesMode"
                  value={advancedFilters.salesMode || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select salesMode</option>
                  {dataList.salesMode?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("salesMode")}
                  style={{
                    cursor: "pointer",
                    border: "1px solid #2F747F",
                    padding: "10px",
                    background: "#fff",
                    borderRadius: "5px",
                    width: "100%",
                    textAlign: "left",
                    color: "#2F747F",
                  }}
                >
                  <span style={{ marginRight: "10px" }}>
                  <GiGears />
                  </span>
                  {advancedFilters.salesMode || "Select salesMode"}
                </button>
      
                {renderDropdown("salesMode")}
              </div>
            </div>
          </label>
        </div>
          {/* salesType */}
          <div className="form-group ">
          <label style={{ width: '100%'}}>
            <label>Sale Type  </label>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="salesType"
                  value={advancedFilters.salesType || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select salesType</option>
                  {dataList.salesType?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("salesType")}
                  style={{
                    cursor: "pointer",
                    border: "1px solid #2F747F",
                    padding: "10px",
                    background: "#fff",
                    borderRadius: "5px",
                    width: "100%",
                    textAlign: "left",
                    color: "#2F747F",
                  }}
                >
                  <span style={{ marginRight: "10px" }}>
              <MdOutlineOtherHouses />
                  </span>
                  {advancedFilters.salesType || "Select salesType"}
                </button>
      
                {renderDropdown("salesType")}
              </div>
            </div>
          </label>
        </div>
      
      
     
      
        {/* furnished */}
        <div className="form-group ">
          <label style={{width:"100%"}}>
          <label>furnished</label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="furnished"
                  value={advancedFilters.furnished || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select furnished</option>
                  {dataList.furnished?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("furnished")}
                  style={{
                    cursor: "pointer",
                    border: "1px solid #2F747F",
                    padding: "10px",
                    background: "#fff",
                    borderRadius: "5px",
                    width: "100%",
                    textAlign: "left",
                    color: "#2F747F",
                  }}
                >
                  <span style={{ marginRight: "10px" }}>
                     <FaHome />
                  </span>
                  {advancedFilters.furnished || "Select furnished"}
                </button>
      
                {renderDropdown("furnished")}
              </div>
            </div>
          </label>
        </div>
          {/*lift */}
          <div className="form-group ">
          <label style={{ width: '100%'}}>
            <label>lift</label>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="lift"
                  value={advancedFilters.lift || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select lift</option>
                  {dataList.lift?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("lift")}
                  style={{
                    cursor: "pointer",
                    border: "1px solid #2F747F",
                    padding: "10px",
                    background: "#fff",
                    borderRadius: "5px",
                    width: "100%",
                    textAlign: "left",
                    color: "#2F747F",
                  }}
                >
                  <span style={{ marginRight: "10px" }}>
                    <MdElevator />
                  </span>
                  {advancedFilters.lift || "Select lift"}
                </button>
      
                {renderDropdown("lift")}
              </div>
            </div>
          </label>
        </div>
      
            {/*attachedBathrooms */}
            <div className="form-group ">
          <label style={{ width: '100%'}}>
          <label>attached Bathrooms</label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="attachedBathrooms"
                  value={advancedFilters.attachedBathrooms || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select attachedBathrooms</option>
                  {dataList.attachedBathrooms?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("attachedBathrooms")}
                  style={{
                    cursor: "pointer",
                    border: "1px solid #2F747F",
                    padding: "10px",
                    background: "#fff",
                    borderRadius: "5px",
                    width: "100%",
                    textAlign: "left",
                    color: "#2F747F",
                  }}
                >
                  <span style={{ marginRight: "10px" }}>
                   <FaBath />
                  </span>
                  {advancedFilters.attachedBathrooms || "Select attachedBathrooms"}
                </button>
      
                {renderDropdown("attachedBathrooms")}
              </div>
            </div>
          </label>
        </div>
          {/* western */}
          <div className="form-group ">
      
          <label style={{ width: '100%'}}>
          <label>western</label>
      
            <div style={{ display: "flex", alignItems: "center"}}>
              <div style={{ flex: "1" }}>
                <select
                  name="western"
                  value={advancedFilters.western || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select western</option>
                  {dataList.western?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("western")}
                  style={{
                    cursor: "pointer",
                    border: "1px solid #2F747F",
                    padding: "10px",
                    background: "#fff",
                    borderRadius: "5px",
                    width: "100%",
                    textAlign: "left",
                    color: "#2F747F",
                  }}
                >
                  <span style={{ marginRight: "10px" }}>
                     <FaToilet />
                  </span>
                  {advancedFilters.western || "Select western"}
                </button>
      
                {renderDropdown("western")}
              </div>
            </div>
          </label>
        </div>
          {/* numberOfFloors */}
          <div className="form-group ">
      
          <label style={{ width: '100%'}}>
          <label>number Of Floors</label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="numberOfFloors"
                  value={advancedFilters.numberOfFloors || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select numberOfFloors</option>
                  {dataList.numberOfFloors?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("numberOfFloors")}
                  style={{
                    cursor: "pointer",
                    border: "1px solid #2F747F",
                    padding: "10px",
                    background: "#fff",
                    borderRadius: "5px",
                    width: "100%",
                    textAlign: "left",
                    color: "#2F747F",
                  }}
                >
                  <span style={{ marginRight: "10px" }}>
                     <BsBuildingsFill />
                  </span>
                  {advancedFilters.numberOfFloors || "Select numberOfFloors"}
                </button>
      
                {renderDropdown("numberOfFloors")}
              </div>
            </div>
          </label>
        </div>
          {/* carParking */}
      
          <div className="form-group ">
          <label style={{ width: '100%'}}>
          <label>car Parking</label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="carParking"
                  value={advancedFilters.carParking || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select carParking</option>
                  {dataList.carParking?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("carParking")}
                  style={{
                    cursor: "pointer",
                    border: "1px solid #2F747F",
                    padding: "10px",
                    background: "#fff",
                    borderRadius: "5px",
                    width: "100%",
                    textAlign: "left",
                    color: "#2F747F",
                  }}
                >
                  <span style={{ marginRight: "10px" }}>
                    <FaCar />
                  </span>
                  {advancedFilters.carParking || "Select carParking"}
                </button>
      
                {renderDropdown("carParking")}
              </div>
            </div>
          </label>
        </div>
      
      
        {/*   rentalPropertyAddress */}
        <div className="form-group ">
      <label>rental Property Address:</label>
      
      <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', border: '1px solid #2F747F', background:"#fff"}}>
          <MdLocationCity className="input-icon" 
          style={{color: '#2F747F', marginLeft:"10px"}} />
          <input
            type="text"
            name="rentalPropertyAddress"
            value={advancedFilters.rentalPropertyAddress}
            onChange={handleAdvancedFilterChange}
            className="form-input m-0"
            placeholder="Rental Property Address"
            style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
          />
        </div>
      </div>
      
      
        {/* country */}
      
        <div className="form-group ">
        <label>country:</label>
        <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
          <BiWorld className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
          <input
            type="text"
            name="country"
            value={advancedFilters.country}
            onChange={handleAdvancedFilterChange}
            className="form-input m-0"
            placeholder="country"
            style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
          />
        </div>
        </div>
        
        {/* State */}
      
      <div className="form-group ">
        <label>State:</label>
        <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
          <MdLocationCity className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
          <input
            type="text"
            name="state"
            value={advancedFilters.state}
            onChange={handleAdvancedFilterChange}
            className="form-input m-0"
            placeholder="State"
            style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
          />
        </div>
      </div>
        {/* City */}
      
      <div className="form-group ">
        <label>City:</label>
        <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
          <FaCity className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
          <input
            type="text"
            name="city"
            value={advancedFilters.city}
            onChange={handleAdvancedFilterChange}
            className="form-input m-0"
            placeholder="City"
            style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
          />
        </div>
      </div>
      
        {/* district */}
        <div className="form-group ">
        <label>District:</label>
        <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
          <FaRegAddressCard className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
          <input
            type="text"
            name="district"
            value={advancedFilters.district}
            onChange={handleAdvancedFilterChange}
            className="form-input m-0"
            placeholder="District"
            style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
          />
        </div>
      </div>
        {/* area */}
        <div className="form-group ">
        <label>Area:</label>
        <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
          <MdLocationOn className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
          <input
            type="text"
            name="area"
            value={advancedFilters.area}
            onChange={handleAdvancedFilterChange}
            className="form-input m-0"
            placeholder="Area"
            style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
          />
        </div>
      </div>
        {/* streetName */}
        <div className="form-group ">
        <label>Street Name:</label>
        <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
          <FaRoad className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
          <input
            type="text"
            name="streetName"
            value={advancedFilters.streetName}
            onChange={handleAdvancedFilterChange}
            className="form-input m-0"
            placeholder="Street Name"
            style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
          />
        </div>
      </div>
        {/* doorNumber */}
        <div className="form-group ">
        <label>Door Number:</label>
        <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
          <FaDoorClosed className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
          <input
            type="text"
            name="doorNumber"
            value={advancedFilters.doorNumber}
            onChange={handleAdvancedFilterChange}
            className="form-input m-0"
            placeholder="Door Number"
            style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
          />
        </div>
        </div>
      
        {/* Nagar */}
        <div className="form-group ">
        <label>Nagar:</label>
        <div className="input-card p-0 rounded-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',  border: '1px solid #2F747F', background:"#fff" }}>
          <FaMapPin className="input-icon" style={{color: '#2F747F', marginLeft:"10px"}} />
          <input
            type="text"
            name="nagar"
            value={advancedFilters.nagar}
            onChange={handleAdvancedFilterChange}
            className="form-input m-0"
            placeholder="Nagar"
            style={{ flex: '1 0 80%', padding: '8px', fontSize: '14px', border: 'none', outline: 'none' }}
          />
        </div>
      </div>
      
        
    

        {/* Best Time to Call */}
        <div className="form-group " >
          <label style={{width:'100%'}}>
          <label>best Time To Call</label>
      
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: "1" }}>
                <select
                  name="bestTimeToCall"
                  value={advancedFilters.bestTimeToCall || ""}
                  onChange={handleAdvancedFilterChange}
                  className="form-control"
                  style={{ display: "none" }} // Hide the default <select> dropdown
                >
                  <option value="">Select bestTimeToCall</option>
                  {dataList.bestTimeToCall?.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
      
                <button
                  className="m-0"
                  type="button"
                  onClick={() => toggleDropdown("bestTimeToCall")}
                  style={{
                    cursor: "pointer",
                    border: "1px solid #2F747F",
                    padding: "10px",
                    background: "#fff",
                    borderRadius: "5px",
                    width: "100%",
                    textAlign: "left",
                    color: "#2F747F",
                  }}
                >
                  <span style={{ marginRight: "10px" }}>
                    <FaHome />
                  </span>
                  {advancedFilters.bestTimeToCall || "Select bestTimeToCall"}
                </button>
      
                {renderDropdown("bestTimeToCall")}
              </div>
            </div>
          </label>
        </div>

     

      </div>
        {/* Your search content goes here */}
      </div>
      <div className="modal-footer">
        <button
          type="button"
          className="btn btn-secondary"
          data-bs-dismiss="modal"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</div>


      {/* Inline filter row — quick filters above the table. These bind to the
          same advancedFilters state as the "Search List" modal, so changes in
          either reflect immediately. The modal stays available for the full
          set of advanced filters. */}
      <div
        className="mb-3 p-3"
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <div className="row g-2 align-items-end">
          <div className="col-md-2">
            <label className="form-label fw-semibold mb-1">Property Mode</label>
            <select
              className="form-select"
              value={advancedFilters.propertyMode || ""}
              onChange={(e) =>
                setAdvancedFilters((prev) => ({
                  ...prev,
                  propertyMode: e.target.value,
                }))
              }
            >
              <option value="">All</option>
              {(dataList.propertyMode || []).map((opt, i) => (
                <option key={i} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-2">
            <label className="form-label fw-semibold mb-1">Property Type</label>
            <select
              className="form-select"
              value={advancedFilters.propertyType || ""}
              onChange={(e) =>
                setAdvancedFilters((prev) => ({
                  ...prev,
                  propertyType: e.target.value,
                }))
              }
            >
              <option value="">All</option>
              {(dataList.propertyType || []).map((opt, i) => (
                <option key={i} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-2">
            <label className="form-label fw-semibold mb-1">Min Price</label>
            <input
              type="number"
              list="priceSuggestions"
              className="form-control"
              placeholder="Min"
              value={advancedFilters.minPrice || ""}
              onChange={(e) =>
                setAdvancedFilters((prev) => ({
                  ...prev,
                  minPrice: e.target.value,
                }))
              }
            />
          </div>

          <div className="col-md-2">
            <label className="form-label fw-semibold mb-1">Max Price</label>
            <input
              type="number"
              list="priceSuggestions"
              className="form-control"
              placeholder="Max"
              value={advancedFilters.maxPrice || ""}
              onChange={(e) =>
                setAdvancedFilters((prev) => ({
                  ...prev,
                  maxPrice: e.target.value,
                }))
              }
            />
          </div>

          {/* Shared suggestion list — browsers show it as a dropdown when the
              Min/Max Price input is focused. Users can still type any custom
              value; the suggestions are just shortcuts. */}
          <datalist id="priceSuggestions">
            <option value="100000" label="₹1 Lakh" />
            <option value="200000" label="₹2 Lakh" />
            <option value="500000" label="₹5 Lakh" />
            <option value="1000000" label="₹10 Lakh" />
            <option value="1500000" label="₹15 Lakh" />
            <option value="2000000" label="₹20 Lakh" />
            <option value="3000000" label="₹30 Lakh" />
            <option value="5000000" label="₹50 Lakh" />
            <option value="7500000" label="₹75 Lakh" />
            <option value="10000000" label="₹1 Crore" />
            <option value="15000000" label="₹1.5 Crore" />
            <option value="20000000" label="₹2 Crore" />
            <option value="30000000" label="₹3 Crore" />
            <option value="50000000" label="₹5 Crore" />
            <option value="100000000" label="₹10 Crore" />
          </datalist>

          <div className="col-md-1">
            <label className="form-label fw-semibold mb-1">Total Area</label>
            <input
              type="number"
              className="form-control"
              placeholder="Area"
              value={advancedFilters.totalArea || ""}
              onChange={(e) =>
                setAdvancedFilters((prev) => ({
                  ...prev,
                  totalArea: e.target.value,
                }))
              }
            />
          </div>

          <div className="col-md-2">
            <label className="form-label fw-semibold mb-1">Area</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Pondicherry"
              value={advancedFilters.area || ""}
              onChange={(e) =>
                setAdvancedFilters((prev) => ({
                  ...prev,
                  area: e.target.value,
                }))
              }
            />
          </div>

          <div className="col-md-1 d-flex">
            <button
              type="button"
              className="btn btn-outline-secondary w-100"
              onClick={() =>
                setAdvancedFilters((prev) => ({
                  ...prev,
                  propertyMode: "",
                  propertyType: "",
                  minPrice: "",
                  maxPrice: "",
                  totalArea: "",
                  area: "",
                }))
              }
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {filteredProperties.length > 0 ? (
      <div className="row">
 <div ref={tableRef}>
          <Table striped bordered hover responsive className="table-sm align-middle">
  <thead className="sticky-top">
    <tr>
      <th>#</th>
      <th>Photo</th>
      <th>PPC ID</th>
      <th>Status</th>
      <th>Property Type</th>
      <th>Mode</th>
      <th>Price</th>
      <th>Ownership</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {filteredProperties.map((property, index) => (
      <tr key={index}>
        <td>{index + 1}</td>
        <td>
          <img
            src={
              property.photos && property.photos.length > 0
                ? `https://ppcpondy.com/PPC/${property.photos[0].replace(/\\/g, "/")}`
                : "https://d17r9yv50dox9q.cloudfront.net/car_gallery/default.jpg"
            }
            alt="Property"
            style={{ width: "100px", height: "70px", objectFit: "cover", borderRadius: "5px" }}
          />
        </td>
        <td   onClick={() =>
              navigate(`/dashboard/detail`, {
                state: {
                  ppcId: property.ppcId,
                  phoneNumber: property.phoneNumber,
                },
              })
            }>{property.ppcId}</td>
        <td>{property.status || 'N/A'}</td>
        <td>{property.propertyType || 'N/A'}</td>
        <td>{property.propertyMode || 'N/A'}</td>
        <td>{property.price || 'N/A'}</td>
        <td>{property.ownership || 'N/A'}</td>
        <td>
   
          <FaEdit
            size={18}
            style={{ cursor: 'pointer' }}
            onClick={() =>
              navigate(`/dashboard/edit-property`, {
                state: {
                  ppcId: property.ppcId,
                  phoneNumber: property.phoneNumber,
                },
              })
            }
          />
        </td>
      </tr>
    ))}
  </tbody>
</Table>
</div>
        </div>
      ) : (
        <p>No properties found.</p>
      )}
    </div>
  );
};

export default SearchProperty;





