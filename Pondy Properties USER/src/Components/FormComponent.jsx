// FormComponent.js
import React, { useState , useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCity, FaIdCard, FaRegBuilding, FaRupeeSign , FaTimes} from 'react-icons/fa';
import { MdApproval } from 'react-icons/md';
import axios from "axios";
import { PiMapPinAreaLight } from "react-icons/pi";
import { HiOutlineBuildingLibrary } from 'react-icons/hi2';
import { LuBedDouble, LuBuilding } from 'react-icons/lu';
import { GrSteps } from 'react-icons/gr';

const dataList = {
  propertyMode: ['Buy', 'Rent', 'Lease'],
};

const FormComponent = () => {
  const [hovered, setHovered] = useState(false);

  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    let scrollTimeout;

    const handleScroll = () => {
      setIsScrolling(true);

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 150); // Adjust the delay as needed
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      clearTimeout(scrollTimeout);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  const buttonStyle = {
    marginTop: "20px",
    background: hovered ? "#5da19d" : "#6EB7B2", // Darker on hover
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "background 0.3s ease",
  };
  const [filters, setFilters] = useState({
    id: '',
    minPrice: '',
    maxPrice: '',
    propertyMode: '',
    city: '',
    propertyType: '',
    floorNo: '',
    state: '',
    area: '',
    bedrooms: '',

  });
  
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleClear = () => {
    setFilters({
      id: "",
      minPrice: "",
      maxPrice: "",
      propertyMode: "",
      city: "",
      propertyType: "",
      floorNo: "",
      state: "",
      area: "",
      bedrooms: "",
    });
  };

  const toggleDropdown = (field) => {
    setDropdownState((prev) => ({
      ...prev,
      activeDropdown: prev.activeDropdown === field ? null : field,
      filterText: '',
    }));
  };
  const handleDropdownFilterChange = (e) => {
    setDropdownState((prev) => ({
      ...prev,
      filterText: e.target.value,
    }));
  };
  
    const [dropdownState, setDropdownState] = useState({
      activeDropdown: null,
      filterText: "",
      position: { top: 0, left: 0 },
    });
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
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
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
              <input className='m-0'
                type="text"
                placeholder="Filter options..."
                value={dropdownState.filterText}
                onChange={handleDropdownFilterChange}
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
                    setFilters((prevState) => ({
                      ...prevState,
                      [field]: option,
                    }));
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

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/Buyer-List-Filter', { state: { filters } });
  };

  const handlePageNavigation = () => {
    navigate(-1); // Redirect to the desired path
  };
  return (
    <div className="container d-flex align-items-center justify-content-center p-0">
          <div className="d-flex flex-column align-items-center justify-content-center m-0" style={{ maxWidth: '500px', margin: 'auto', width: '100%' ,fontFamily: 'Inter, sans-serif'}}>

      <div className="row g-2 w-100">
        <div className="d-flex align-items-center justify-content-start w-100"      style={{
        background: "#EFEFEF",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        opacity: isScrolling ? 0 : 1,
        pointerEvents: isScrolling ? "none" : "auto",
        transition: "opacity 0.3s ease-in-out",
      }}>
          <button className="pe-5" onClick={handlePageNavigation}><FaArrowLeft color="#30747F"/> 
        </button> <h3 className="m-0 ms-3" style={{fontSize:"20px"}}>Buyer Assistance Sesrch  </h3> </div>
           
    <form onSubmit={handleSubmit} 
  className="p-3"  >
      {/* ID */}
      <div className="form-group  mb-3">
        {/* <label>ID</label> */}
        <div className="input-card" style={inputCardStyle}>
          <FaIdCard style={iconStyle} />
          <input className='m-0'
            type="text"
            name="id"
            value={filters.id}
            onChange={handleFilterChange}
            placeholder="ID"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Min Price */}
      <div className="form-group  mb-3">
        {/* <label>Min Price</label> */}
        <div className="input-card" style={inputCardStyle}>
          <FaRupeeSign style={iconStyle} />
          <input className='m-0'
            type="number"
            name="minPrice"
            value={filters.minPrice}
            onChange={handleFilterChange}
            placeholder="Min Price"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Max Price */}
      <div className="form-group  mb-3">
        {/* <label>Max Price</label> */}
        <div className="input-card" style={inputCardStyle}>
          <FaRupeeSign style={iconStyle} />
          <input className='m-0'
            type="number"
            name="maxPrice"
            value={filters.maxPrice}
            onChange={handleFilterChange}
            placeholder="Max Price"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Property Mode */}
      <div className="form-group m-0" style={{ position: 'relative' }}>
        {/* <label>Property Mode</label> */}
        <button
          type="button"
  onClick={() =>
    setDropdownState((prev) => ({
      ...prev,
      activeDropdown: prev.activeDropdown === 'propertyMode' ? null : 'propertyMode',
      filterText: '',
    }))}          style={{
            cursor: 'pointer',
            border: '1px solid #2F747F',
            padding: '10px',
            background: '#fff',
            borderRadius: '5px',
            width: '100%',
            textAlign: 'left',
            color: '#2F747F',
          }}
        >
          <LuBuilding  style={{ marginRight: '10px' }} />
          {filters.propertyMode || 'Select Property Mode'}
        </button>
        {renderDropdown('propertyMode')}
      </div>
      {/* Property Type */}

      <div className="form-group m-0" style={{ position: 'relative' }}>
        {/* <label>Property Type</label> */}
        <button
          type="button"
  onClick={() =>
    setDropdownState((prev) => ({
      ...prev,
      activeDropdown: prev.activeDropdown === 'propertyType' ? null : 'propertyType',
      filterText: '',
    }))}          style={{
            cursor: 'pointer',
            border: '1px solid #2F747F',
            padding: '10px',
            background: '#fff',
            borderRadius: '5px',
            width: '100%',
            textAlign: 'left',
            color: '#2F747F',
          }}
        >
          <FaRegBuilding  style={{ marginRight: '10px' }} />
          {filters.propertyType || 'Select Property Type'}
        </button>
        {renderDropdown('propertyType')}
      </div>

      {/* bedrooms*/}


      <div className="form-group m-0" style={{ position: 'relative' }}>
        {/* <label>Bedrooms</label> */}
        <button
          type="button"
  onClick={() =>
    setDropdownState((prev) => ({
      ...prev,
      activeDropdown: prev.activeDropdown === 'bedrooms' ? null : 'bedrooms',
      filterText: '',
    }))}          style={{
            cursor: 'pointer',
            border: '1px solid #2F747F',
            padding: '10px',
            background: '#fff',
            borderRadius: '5px',
            width: '100%',
            textAlign: 'left',
            color: '#2F747F',
          }}
        >
          <LuBedDouble  style={{ marginRight: '10px' }} />
          {filters.bedrooms || 'Select bedrooms'}
        </button>
        {renderDropdown('bedrooms')}
      </div>
      {/* floorNo*/}

      <div className="form-group m-0" style={{ position: 'relative' }}>
        {/* <label>FloorNo</label> */}
        <button
          type="button"
  onClick={() =>
    setDropdownState((prev) => ({
      ...prev,
      activeDropdown: prev.activeDropdown === 'floorNo' ? null : 'floorNo',
      filterText: '',
    }))}          style={{
            cursor: 'pointer',
            border: '1px solid #2F747F',
            padding: '10px',
            background: '#fff',
            borderRadius: '5px',
            width: '100%',
            textAlign: 'left',
            color: '#2F747F',
          }}
        >
          <GrSteps  style={{ marginRight: '10px' }} />
          {filters.floorNo || 'Select floorNo'}
        </button>
        {renderDropdown('floorNo')}
      </div>
      {/* State */}

      <div className="form-group  mb-3 mt-2">
        {/* <label>State</label> */}
        <div className="input-card" style={inputCardStyle}>
          <HiOutlineBuildingLibrary  style={iconStyle} />
          <input className='m-0'
            type="text"
            name="state"
            value={filters.state}
            onChange={handleFilterChange}
            placeholder="state"
            style={inputStyle}
          />
        </div>
      </div>
      {/* City */}
      <div className="form-group mb-3">
        {/* <label>City</label> */}
        <div className="input-card" style={inputCardStyle}>
          <FaCity  style={iconStyle} />
          <input className='m-0'
            type="text"
            name="city"
            value={filters.city}
            onChange={handleFilterChange}
            placeholder="City"
            style={inputStyle}
          />
        </div>
      </div>

      {/* area */}
      <div className="form-group mb-2">
        {/* <label>Area</label> */}
        <div className="input-card" style={inputCardStyle}>
          <PiMapPinAreaLight  style={iconStyle} />
          <input className='m-0'
            type="text"
            name="area"
            value={filters.area}
            onChange={handleFilterChange}
            placeholder="area"
            style={inputStyle}
          />
        </div>
      </div>
      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button
          type="button"
          onClick={handleClear}
          style={{
            ...buttonStyle,
            marginTop: 0,
            background: "#9ca3af",
            flex: "0 0 auto",
          }}
        >
          CLEAR
        </button>
        <button
          type="submit"
          style={{ ...buttonStyle, marginTop: 0, flex: 1 }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          SEARCH BUYER LIST
        </button>
      </div>
    </form>
    </div></div></div>
  );
};

const inputCardStyle = {
  display: 'flex',
  alignItems: 'center',
  border: '1px solid #2F747F',
  background: '#fff',
  padding: '4px',
  borderRadius: '5px',

};

const inputStyle = {
  flex: 1,
  padding: '8px',
  fontSize: '14px',
  border: 'none',
  outline: 'none',
};

const iconStyle = {
  color: '#2F747F',
  marginLeft: '10px',
};

export default FormComponent;
