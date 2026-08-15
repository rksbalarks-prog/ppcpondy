











import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import moment from "moment";
import { useSelector } from "react-redux";
import { Table } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
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
import minprice from "./Assets/Price Mini-01.png";
import maxprice from "./Assets/Price maxi-01.png";

const SearchedData = ({ setFormData, setEditId }) => {
  const [buyerRequests, setBuyerRequests] = useState([]); // Original data
  const [filteredRequests, setFilteredRequests] = useState([]); // Filtered data
  const [searchBAId, setSearchBAId] = useState(""); // Search filter
  const [startDate, setStartDate] = useState(""); // Start date filter
  const [endDate, setEndDate] = useState(""); // End date filter
  const navigate = useNavigate();
  const [advancedFilters, setAdvancedFilters] = useState({
    propertyMode: '', propertyType: '', minPrice: '', maxPrice: '', propertyAge: '', bankLoan: '',
    negotiation: '', length: '', breadth: '', totalArea: '', ownership: '', bedrooms: '',
    kitchen: '', kitchenType: '', balconies: '', floorNo: '', areaUnit: '', propertyApproved: '',
    facing: '', salesMode: '', salesType: '', furnished: '', lift: '', attachedBathrooms: '',
    western: '', numberOfFloors: '', carParking: '', city: '' , status:''
  });
  useEffect(() => {
    fetchBuyerRequests();
  }, []);
  const [showStatusOptions, setShowStatusOptions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const statusOptions = ["active", "pending", "delete", "incomplete", "complete", "contact"];
  const [baCountMap, setBaCountMap] = useState({});



  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  const closeStatusOptions = () => {
    setShowStatusOptions(false);
    setSearchQuery('');
  };



  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all buyer assistance entries
        const requestsRes = await axios.get(`${process.env.REACT_APP_API_URL}/fetch-buyerAssistance`);
        const sortedRequests = requestsRes.data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setBuyerRequests(sortedRequests);
        setFilteredRequests(sortedRequests);
  
        // Fetch counts per user
        const countRes = await axios.get(`${process.env.REACT_APP_API_URL}/buyer-assistance-count-by-user`);
        const countMap = {};
        countRes.data.data.forEach(item => {
          countMap[item.phoneNumber] = item.adsCount;
        });
        setBaCountMap(countMap);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);

  

  const handleStatusSelect = (value) => {
    setAdvancedFilters((prev) => ({ ...prev, status: value }));
    closeStatusOptions();
  };

  const filterOptions = (options) =>
    options.filter((option) => option.toLowerCase().includes(searchQuery.toLowerCase()));

    const [dataList, setDataList] = useState({});
  // Fetch All Buyer Assistance Requests
  const fetchBuyerRequests = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/fetch-buyerAssistance`);
      // Sort data by createdAt (latest date first)
      const sortedData = response.data.data.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA; // Sort in descending order (latest date first)
      });
      setBuyerRequests(sortedData); // Save original sorted data
      setFilteredRequests(sortedData); // Initialize filtered data with sorted data
    } catch (error) {
    }
  };
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

  const filteredProperties = filteredRequests.filter((property) => {
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
              minPrice:"minPrice",
              maxPrice:"maxPrice",
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
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    // Filter logic based on user input
    const filtered = buyerRequests.filter((request) => {
      const isBaIdMatch = searchBAId ? String(request.ba_id).includes(searchBAId) : true;
      const isStartDateMatch = startDate ? new Date(request.createdAt) >= new Date(startDate) : true;
      const isEndDateMatch = endDate ? new Date(request.createdAt) <= new Date(endDate) : true;
      return isBaIdMatch && isStartDateMatch && isEndDateMatch;
    });
    setFilteredRequests(filtered); // Update the filtered data
  };


  const handleStatusToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === "baPending" ? "baActive" : "baPending";
  
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/update-buyerAssistance-status/${id}`,
        { newStatus }
      );
      alert(response.data.message);
      fetchBuyerRequests(); // Refresh the list of buyer requests after the update
    } catch (error) {
      alert("Failed to update the status.");
    }
  };
  
  

  // Edit an Existing Request
  const handleEdit = async (id) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/fetch-buyerAssistance/${id}`);
      setFormData(response.data.data);
      setEditId(id);
    } catch (error) {
    }
  };

  // Delete a Request
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this request?")) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/delete-buyerAssistance/${id}`);
      alert("Request deleted successfully!");
      fetchBuyerRequests(); // Refresh list
    } catch (error) {
      alert("Failed to delete the request.");
    }
  };

  // Helper function to format the date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };



  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);
  
  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");
  
  
   const [allowedRoles, setAllowedRoles] = useState([]);
       const [loading, setLoading] = useState(true);
   
   const fileName = "Search Data"; // current file
   
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
    <> 
     <div className="d-flex justify-content-between align-items-center mb-3">

     </div>
    <div className="d-flex justify-content-between align-items-center mb-3">
    <h4>Manage Searched Data
    </h4>    <button className="btn btn-secondary" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
     </div>


        <div className="mb-4 three-column-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
          }}>
        
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
              <div className="form-group ">
                <label style={{ width: '100%'}}>
            <label>minPrice  </label>
                  <div style={{ display: "flex", alignItems: "center"}}>
                    <div style={{ flex: "1" }}>
                      <select
                        name="minPrice"
                        value={advancedFilters.minPrice || ""}
                        onChange={handleAdvancedFilterChange}
                        className="form-control"
                        style={{ display: "none" }} // Hide the default <select> dropdown
                      >
                        <option value="">Select minPrice</option>
                        {dataList.minPrice?.map((option, index) => (
                          <option key={index} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
            
                      <button
                        className="m-0"
                        type="button"
                        onClick={() => toggleDropdown("minPrice")}
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
                        <img src={minprice} alt="" /> 
                        </span>
                        {advancedFilters.minPrice || "Select minPrice"}
                      </button>
            
                      {renderDropdown("minPrice")}
                    </div>
                  </div>
                </label>
              </div>


              <div className="form-group ">
                <label style={{ width: '100%'}}>
            <label>maxPrice </label>
                  <div style={{ display: "flex", alignItems: "center"}}>
                    <div style={{ flex: "1" }}>
                      <select
                        name="maxPrice"
                        value={advancedFilters.maxPrice || ""}
                        onChange={handleAdvancedFilterChange}
                        className="form-control"
                        style={{ display: "none" }} // Hide the default <select> dropdown
                      >
                        <option value="">Select maxPrice</option>
                        {dataList.maxPrice?.map((option, index) => (
                          <option key={index} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
            
                      <button
                        className="m-0"
                        type="button"
                        onClick={() => toggleDropdown("maxPrice")}
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
                        <img src={maxprice} alt="" />
                        </span>
                        {advancedFilters.maxPrice || "Select maxPrice"}
                      </button>
            
                      {renderDropdown("maxPrice")}
                    </div>
                  </div>
                </label>
              </div>

            </div>
    <div ref={tableRef}>
    <Table striped bordered hover responsive className="table-sm align-middle">
    <thead className="sticky-top">
          <tr>
            <th>ID</th>
            <th>Created Date</th>
            <th>Country Code</th>
            <th>Mobile Number</th>
            <th>Rental Assistance Created	</th>
            <th>Price Min</th>
            <th>Price Max</th>
            <th>Property Mode</th>
            <th>Property Type</th>
            <th>Buyer Assistance No.Of Ads</th>
            {/* <th>KM Min</th>
            <th>KM Max</th> */}
          </tr>
        </thead>
        <tbody>
           {filteredProperties.length > 0 ? (
                 filteredProperties.map((request, index) => (
                   <tr key={index}>
                     <td >{request.ba_id}</td>
                     <td>{formatDate(request.createdAt)}</td>
                     <td>91+</td>

                     <td >{request.phoneNumber}</td>
                     <td>{formatDate(request.createdAt)}</td>
                     <td>{request.minPrice}</td>
                     <td>{request.maxPrice}</td>
                     <td>{request.propertyMode}</td>
                     <td>{request.propertyType}</td>
                     <td>{baCountMap[request.phoneNumber] || 0}</td>

             
                   </tr>
                 ))
               ) : (
                 <tr>
                   <td colSpan="19" className="text-center">No Requests Found</td>
                 </tr>
               )}
             </tbody>
           </Table>
    </div>
    </>
  );
};

export default SearchedData;
