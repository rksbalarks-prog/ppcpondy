

import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { useSelector } from "react-redux";import "bootstrap/dist/css/bootstrap.min.css";
import'./App.css'
const PropertyForm = () => {
  const [userType, setUserType] = useState("owner"); // Owner, Agent, or Builder
  const [propertyType, setPropertyType] = useState("");
  const [photos, setPhotos] = useState([]);
  const [videoPreview, setVideoPreview] = useState(null);
            
  const adminName = useSelector((state) => state.admin.name);
  

  // ✅ Record view on mount
useEffect(() => {
 const recordDashboardView = async () => {
   try {
     await axios.post(`${process.env.REACT_APP_API_URL}/record-view`, {
       userName: adminName,
       viewedFile: "Property Form",
       viewTime: moment().format("YYYY-MM-DD HH:mm:ss"), // optional, backend already handles it


     });
   } catch (err) {
   }
 };

 if (adminName) {
   recordDashboardView();
 }
}, [adminName]);
    
  const handleVideoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setVideoPreview(URL.createObjectURL(file));
    }
  };
  const removeVideo = () => {
    setVideoPreview(null);
  };

  const handleUserTypeChange = (e) => {
    setUserType(e.target.value);
  };

  const handlePropertyTypeChange = (e) => {
    setPropertyType(e.target.value);
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (photos.length + files.length <= 15) {
      setPhotos([...photos, ...files]);
    } else {
      alert("Maximum 15 photos can be uploaded.");
    }
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Collect and handle form data here
  };

  const renderPropertyFeatures = () => {
    if (
      [
        "Flat/ Apartment",
        "Residential House",
        "Villa",
        "Builder Floor Apartment",
        "Penthouse",
        "Studio Apartment",
        "Commercial Office Space",
        "Office in IT Park/ SEZ",
        "Commercial Shop",
        "Commercial Showroom",
        "Commercial Land",
        "Warehouse/ Godown",
        "Industrial Land",
        "Industrial Building",
        "Industrial Shed",
        "Agricultural Land",
        "Farm House",
      ].includes(propertyType)
    ) {
      return (
        <div className="row">

          <div htmlFor="propertyType" className="col-md-6 mb-3">
    <label for="propertyMode" className="form-label">Property Mode</label>
    <select class="form-select  rounded-0" required>
        <option value="">Select Property Mode</option>
        <option value="Residential">Residential</option>
        <option value="Commercial">Commercial</option>
        <option value="Agricultural">Agricultural</option>
        <option value="Rent">Rent</option>
        <option value="Other">Other</option>
    </select>
</div>
<div htmlFor="maintancePer" className="col-md-6 mb-3">
    <label for="Maintenance Period" className="form-label">Maintenance Period</label>
    <select class="form-select  rounded-0" required>
        <option value="">Select Maintenance Period</option>
        <option value="Monthly">Monthly</option>
    <option value="Yearly">Yearly</option>
    <option value="Quarterly">Quarterly</option>
    <option value="One-Time">One-Time</option>
    </select>
</div>


 <div htmlFor="propertyType" className="col-md-6 mb-3">
 <label for="price">Price:</label>
<input className="form-control  rounded-0" type="number" name="price" required />

</div>          

<div htmlFor="propertyType" className="col-md-6 mb-3">
<label for="propertyType">Property Age:</label>
<select className="form-control rounded-0" id="propertyAge" name="propertyAge" required>
  <option value="">Select Property Age</option>
  <option value="Newly Build">Newly Build</option>
  <option value="2 Years">2 Years</option>
  <option value="3 Years">3 Years</option>
  <option value="4 Years">4 Years</option>
  <option value="5 Years">5 Years</option>
  <option value="6 Years">6 Years</option>
  <option value="7 Years">7 Years</option>
  <option value="8 Years">8 Years</option>
  <option value="9 Years">9 Years</option>
  <option value="10 Years">10 Years</option>
  <option value="11 Years">11 Years</option>
  <option value="12 Years">12 Years</option>
  <option value="13 Years">13 Years</option>
  <option value="14 Years">14 Years</option>
  <option value="15 Years">15 Years</option>
  <option value="16 Years">16 Years</option>
  <option value="17 Years">17 Years</option>
  <option value="18 Years">18 Years</option>
  <option value="19 Years">19 Years</option>
  <option value="20 Years">20 Years</option>
  <option value="20+ Years">20+ Years</option>
</select>

</div>       
   <div htmlFor="ownership" className="col-md-6 mb-3">
   <label for="ownership"  className="form-label">Ownership:</label>
<select className="form-control rounded-0" name="ownership" required>
  <option value="">Select Ownership</option>
  <option value="single Owner">Single Owner</option>
  <option value="Multiple Owner">Multiple Owner</option>
  <option value="Power Of Attorney">Power Of Attorney</option>
</select>
</div>     

     <div htmlFor="negotiation" className="col-md-6 mb-3">
    <label for="negotiation" className="form-label">negotiation</label>
<select  className="form-select  rounded-0" name="negotiation" required>
<option value="">Select negotiation</option>
    <option value="Yes">Yes</option>
    <option value="no">No</option>
</select>
</div>     
<div htmlFor="Bank Loan" className="col-md-6 mb-3">
    <label for="Bank Loan" className="form-label">Bank Loan</label>
<select  className="form-select  rounded-0" name="Bank Loan" required>
<option value="">Bank Loan</option>
    <option value="Yes">Yes</option>
    <option value="no">No</option>
</select>
</div>      <div htmlFor="propertyType" className="col-md-6 mb-3">
<label for="bedrooms"  className="form-label">Bedrooms:</label>
<select className="form-control rounded-0" name="bedrooms" required>
  <option value="">Select Number of Bedrooms</option>
  <option value="No">No</option>
  <option value="1">1</option>
  <option value="2">2</option>
  <option value="3">3</option>
  <option value="4">4</option>
  <option value="5">5</option>
  <option value="6">6</option>
  <option value="7">7</option>
  <option value="8">8</option>
  <option value="9">9</option>
  <option value="10">10</option>
  <option value="11">11</option>
  <option value="12">12</option>
  <option value="13">13</option>
  <option value="14">14</option>
  <option value="15">15</option>
  <option value="16">16</option>
  <option value="17">17</option>
  <option value="18">18</option>
  <option value="19">19</option>
  <option value="20">20</option>
  <option value="20+">20+</option>
</select>

</div>          <div htmlFor="kitchen" className="col-md-6 mb-3">
    <label for="kitchen" className="form-label">kitchen</label>
    <select class="form-select  rounded-0" required>
        <option value="">Select kitchen</option>
        <option value="Yes">Yes</option>
        <option value="no">No</option>
    </select>
</div>         
      <div htmlFor="kitchenType" className="col-md-6 mb-3">
    <label for="kitchenType" className="form-label">kitchenType</label>
    <select className="form-select  rounded-0" required>
        <option value="">Select kitchenType</option>
        <option value="Modular">Modular</option>
        <option value="Normal">Normal</option>
       
    </select>
</div>          <div htmlFor="balconies" className="col-md-6 mb-3">
<label for="balconies"  className="form-label">Balconies:</label>
<select className="form-control rounded-0" name="balconies" required>
  <option value="">Select Number of Balconies</option>
  <option value="No">No</option>
  <option value="1 Balcony">1 Balcony</option>
  <option value="2 Balconies">2 Balconies</option>
  <option value="3 Balconies">3 Balconies</option>
  <option value="4 Balconies">4 Balconies</option>
  <option value="5 Balconies">5 Balconies</option>
  <option value="6 Balcony">6 Balcony</option>
  <option value="7 Balconies">7 Balconies</option>
  <option value="8 Balconies">8 Balconies</option>
  <option value="9 Balconies">9 Balconies</option>
  <option value="10 Balconies">10 Balconies</option>
  <option value="10+ Balconies">10+ Balconies</option>
</select>

</div>          <div htmlFor="floorNo" className="col-md-6 mb-3">
<label for="floorNo"  className="form-label">Floor Number:</label>
<select className="form-control rounded-0" name="floorNo" required>
  <option value="">Select Floor</option>
  <option value="Lower Basement">Lower Basement</option>
  <option value="Upper Basement">Upper Basement</option>
  <option value="Ground Floor">Ground Floor</option>
  <option value="Top Floor">Top Floor</option>
  <option value="1st Floor">1st Floor</option>
  <option value="2nd Floor">2nd Floor</option>
  <option value="3rd Floor">3rd Floor</option>
  <option value="4th Floor">4th Floor</option>
  <option value="5th Floor">5th Floor</option>
  <option value="6th Floor">6th Floor</option>
  <option value="7th Floor">7th Floor</option>
  <option value="8th Floor">8th Floor</option>
  <option value="9th Floor">9th Floor</option>
  <option value="10th Floor">10th Floor</option>
</select>

</div>          <div htmlFor="areaUnit" className="col-md-6 mb-3">
<label for="areaUnit"  className="form-label">Area Unit:</label>
<select className="form-control rounded-0" name="areaUnit" required>
  <option value="">Select Area Unit</option>
  <option value="sq.ft">sq.ft</option>
  <option value="sq.meter">sq.meter</option>
  <option value="cent">cent</option>
  <option value="Acre">Acre</option>
  <option value="Hectare">Hectare</option>
</select>

</div>        
  <div htmlFor="propertyApproved" class="col-md-6 mb-3">
    <label for="propertyApproved" class="form-label">propertyApproved</label>
    <select class="form-select  rounded-0" required>
        <option value="">Select propertyApproved</option>
        <option value="Yes">Yes</option>
        <option value="no">No</option>
       
    </select>
</div>       
   <div htmlFor="postedBy" className="col-md-6 mb-3">
    <label for="Posted by " className="form-label">Posted by </label>
    <select className="form-select  rounded-0" required>
        <option value="">SelectPosted by </option>
        <option value="Owner">Owner</option>
        <option value="Broker">Broker</option>
        <option value="Developer">Developer</option>
    
    </select>
</div>         
 <div htmlFor="facing" className="col-md-6 mb-3">
<label for="facing"  className="form-label">Facing Direction:</label>
<select className="form-select  rounded-0" name="facing" required>
  <option value="">Select Facing Direction</option>
  <option value="North">North</option>
  <option value="South">South</option>
  <option value="East">East</option>
  <option value="West">West</option>
  <option value="North-East">North-East</option>
  <option value="South-East">South-East</option>
  <option value="North-West">North-West</option>
  <option value="South-West">South-West</option>
  <option value="North-North-East">North-North-East</option>
  <option value="South-South-West">South-South-West</option>
  <option value="East-North-East">East-North-East</option>
  <option value="West-North-West">West-North-West</option>
</select>

</div>          
<div htmlFor="salesMode" className="col-md-6 mb-3">
    <label for="salesMode" className="form-label"> salesMode</label>
    <select className="form-select  rounded-0" required>
        <option value="">Select salesMode</option>
        <option value="Full Payment">Full Payment</option>
        <option value="Partial Paymaent">Partial Paymaent</option>
    </select>
</div>        
  <div htmlFor="salesType" className="col-md-6 mb-3">
    <label for="propertyMode" className="form-label">salesType</label>
    <select className="form-select  rounded-0" required>
        <option value="">Select salesType</option>
        <option value="Normal">Normal</option>
        <option value="Urgent">Urgent</option>
      
    </select>
</div>          <div htmlFor="furnished" className="col-md-6 mb-3">
<label for="furnished"  className="form-label">Furnishing Status:</label>
<select className="form-select  rounded-0" name="furnished" required>
  <option value="">Select Furnishing Status</option>
  <option value="Furnished">Furnished</option>
  <option value="Unfurnished">Unfurnished</option>
  <option value="Semi-Furnished">Semi-Furnished</option>
</select>

</div>       
   <div htmlFor="lift" className="col-md-6 mb-3">
    <label for="lift" className="form-label">lift</label>
    <select className="form-select  rounded-0" required>
        <option value="">Select lift</option>
        <option value="Yes">Yes</option>
        <option value="No">No</option>
        <option value="Closed">Closed</option>
     
    </select>
</div>        
  <div htmlFor="attachedBathrooms" className="col-md-6 mb-3">
  <label for="attachedBathrooms"  className="form-label">Attached Bathrooms:</label>
<select className="form-select  rounded-0" name="attachedBathrooms" required>
  <option value="">Select Number of Attached Bathrooms</option>
  <option value="No">No</option>
  <option value="1">1</option>
  <option value="2">2</option>
  <option value="3">3</option>
  <option value="4">4</option>
  <option value="5">5</option>
  <option value="6">6</option>
  <option value="7">7</option>
  <option value="8">8</option>
  <option value="9">9</option>
  <option value="10">10</option>
  <option value="10+">10+</option>
</select>

</div>     
     <div htmlFor="western" className="col-md-6 mb-3">
<label for="western"  className="form-label">western:</label>
<select className="form-select  rounded-0" name="western" required>
  <option value="">Select Number of western</option>
  <option value="No">No</option>
  <option value="1">1</option>
  <option value="2">2</option>
  <option value="3">3</option>
  <option value="4">4</option>
  <option value="5">5</option>
  <option value="6">6</option>
  <option value="7">7</option>
  <option value="8">8</option>
  <option value="9">9</option>
  <option value="10">10</option>
  <option value="10+">10+</option>
</select>

</div>        

 
       <div htmlFor="propertyType" className="col-md-6 mb-3">
<label for="numberOfFloors"  className="form-label">Number of Floors:</label>
<select className="form-select  rounded-0" name="numberOfFloors" required>
  <option value="">Select Number of Floors</option>
  <option value="UnderGround">UnderGround</option>
  <option value="GroundFloor">Ground Floor</option>
  <option value="1">1</option>
  <option value="2">2</option>
  <option value="3">3</option>
  <option value="4">4</option>
  <option value="5">5</option>
  <option value="6">6</option>
  <option value="7">7</option>
  <option value="8">8</option>
  <option value="9">9</option>
  <option value="10">10</option>
  <option value="11">11</option>
  <option value="12">12</option>
  <option value="13">13</option>
  <option value="14">14</option>
  <option value="15">15</option>
  <option value="16">16</option>
  <option value="17">17</option>
  <option value="18">18</option>
  <option value="19">19</option>
  <option value="20">20</option>
  <option value="20+">20+</option>
</select>

</div>    

<div htmlFor="carParking" className="col-md-6 mb-3">
    <label for="carParking" className="form-label">carParking</label>
    <select className="form-select  rounded-0" required>
        <option value="">Select carParking</option>
        <option value="Yes">Yes</option>
        <option value="No">No</option>
       
    </select>
</div>  



{/* pasttt */}
          <div className="col-md-6 mb-3">
            <label>length:</label>
            <input type="number" name="length" className="form-control rounded-0" required />
          </div>
          <div className="col-md-6 mb-3">
            <label>breadth:</label> 
            <input type="number" name="breadth" className="form-control rounded-0" />
          </div>
          <div className="col-md-6 mb-3">
            <label>Total Area:</label>
            <input type="number" name="totalArea" className="form-control rounded-0" />
          </div>
          <div className="col-md-6 mb-3">
            <label>rentalPropertyAddress:</label>
            <input type="text" name="rentalPropertyAddress" className="form-control rounded-0" />
          </div>
          <div className="col-md-6 mb-3">
            <label>country:</label>
            <input type="number" name="country" className="form-control rounded-0" required />
          </div>
          <div className="col-md-6 mb-3">
            <label>state:</label>
            <input type="text" name="state" className="form-control rounded-0" />
          </div>
   
          <div className="col-md-6 mb-3">
            <label>district:</label>
            <input type="text" name="district" className="form-control rounded-0" required />
          </div>
          <div className="col-md-6 mb-3">
            <label>area:</label>
            <input type="text" name="area" className="form-control rounded-0" required />
          </div> <div className="col-md-6 mb-3">
            <label>streetName:</label>
            <input type="text" name="streetName" className="form-control rounded-0" required />
          </div> <div className="col-md-6 mb-3">
            <label>doorNumber:</label>
            <input type="text" name="doorNumber" className="form-control rounded-0" required />
          </div> <div className="col-md-6 mb-3">
            <label>email:</label>
            <input type="email" name="email" className="form-control rounded-0" required />
          </div> <div className="col-md-6 mb-3">
            <label>alternatePhone:</label>
            <input type="tel" name="alternatePhone" className="form-control rounded-0" required />
          </div> <div className="col-md-6 mb-3">
            <label>bestTimeToCall:</label>
            <input type="text" name="bestTimeToCall" className="form-control rounded-0" required />
          </div> <div className="col-md-6 mb-3">
            <label>rentAmount:</label>
            <input type="tel" name="rentAmount" className="form-control rounded-0" required />
          </div> <div className="col-md-6 mb-3">
            <label>rentSecurityAmount:</label>
            <input type="tel" name="rentSecurityAmount" className="form-control rounded-0" required />
          </div> <div className="col-md-6 mb-3">
            <label>rentMaintenanceCharge:</label>
            <input type="tel" name="rentMaintenanceCharge" className="form-control rounded-0" required />
          </div> 
   
        </div>
      );
    }
    return null;



  };

  return (
    <div className="container-fluid" style={{backgroundColor: '#F0F8FF',}}>
    <div className="row">
      {/* Form Section */}
      <div className="col-md-7 col-12 d-flex justify-content-center align-items-center" style={{background:'#FFFFFF', boxShadow:'10px 10px 5px -11px rgba(0,0,0,0.75)'}}>
    <form onSubmit={handleSubmit} className="propertyform w-100" style={{ maxWidth: '500px' }}>
      <h1 className="text-start">Sell or Rent your Property</h1>
      <p>You are posting this property for <span style={{background:'#FFCC33', fontWeight:'bold'}}>FREE!</span> </p>

      {/* User Type Selection */}
      <h2 style={{fontSize:'18px', fontWeight:'bold'}}>Personal Details</h2>
      <div className="mb-3">
        <label className="form-label">User Type:</label>
        <div className="form-check form-check-inline mb-4">
          <input
            type="radio"
            value="owner"
            checked={userType === "owner"}
            onChange={handleUserTypeChange}
            className="form-check-input radioform"
          />
          <label className="form-check-label">Owner</label>
        </div>
        <div className="form-check form-check-inline mb-4">
          <input
            type="radio"
            value="agent"
            checked={userType === "agent"}
            onChange={handleUserTypeChange}
            className="form-check-input radioform"
          />
          <label className="form-check-label">Agent</label>
        </div>
        <div className="form-check form-check-inline mb-4">
          <input
            type="radio"
            value="builder"
            checked={userType === "builder"}
            onChange={handleUserTypeChange}
            className="form-check-input radioform"
          />
          <label className="form-check-label">Builder</label>
        </div>
      </div>
      {userType === "owner" && (
        <>
     <div className="mb-3">
        <label>Name</label>
        <input className="form-control rounded-0" type="text" name="city" required />

        <label>Number</label>
        <input className="form-control rounded-0" type="tel" name="location" required />
      </div>
        </>
      )}
      {/* Property holder details */}

      
      {/* Property Sale or Rent */}
      <div className="mb-3">
        <label className="form-label">Transaction:</label>
        <div className="form-check form-check-inline mb-4">
          <input
            type="radio"
            name="transaction"
            value="sale"
            className="form-check-input radioform"
          />
          <label className="form-check-label">Sale</label>
        </div>
        <div className="form-check form-check-inline mb-4">
          <input
            type="radio"
            name="transaction"
            value="rent"
            className="form-check-input radioform"
          />
          <label className="form-check-label">Rent</label>
        </div>
      </div>

      {/* Property Type Dropdown */}
      <div className="mb-3">
        <label htmlFor="propertyType" className="form-label ">Select Property Type</label>
        <select
          id="propertyType"
          value={propertyType}
          onChange={handlePropertyTypeChange}
          className="form-select rounded-0"
        >
          <option value="">Select Property Type</option>
          <optgroup label="ALL RESIDENTIAL">
            <option value="Flat/ Apartment">Flat/ Apartment</option>
            <option value="Residential House">Residential House</option>
            <option value="Villa">Villa</option>
            <option value="Builder Floor Apartment">Builder Floor Apartment</option>
            <option value="Residential Land/ Plot">Residential Land/ Plot</option>
            <option value="Penthouse">Penthouse</option>
            <option value="Studio Apartment">Studio Apartment</option>
          </optgroup>
          <optgroup label="ALL COMMERCIAL">
            <option value="Commercial Office Space">Commercial Office Space</option>
            <option value="Office in IT Park/ SEZ">Office in IT Park/ SEZ</option>
            <option value="Commercial Shop">Commercial Shop</option>
            <option value="Commercial Showroom">Commercial Showroom</option>
            <option value="Commercial Land">Commercial Land</option>
            <option value="Warehouse/ Godown">Warehouse/ Godown</option>
            <option value="Industrial Land">Industrial Land</option>
            <option value="Industrial Building">Industrial Building</option>
            <option value="Industrial Shed">Industrial Shed</option>
          </optgroup>
          <optgroup label="ALL AGRICULTURAL">
            <option value="Agricultural Land">Agricultural Land</option>
            <option value="Farm House">Farm House</option>
          </optgroup>
        </select>
      </div>

      <div className="mb-3">
        <label htmlFor="propertyType" className="form-label ">City</label>
        <select
          id="propertyType"
          className="form-select rounded-0"
        >
          <option value="">Select city</option>
          <optgroup label="City and Town">
          <option value="Ariyankuppam">Ariyankuppam</option>                                
      <option value="Ariyur">Ariyur</option>                                
      <option value="Bahour">Bahour</option>                                
      <option value="Ellapillaichavady">Ellapillaichavady</option>                                
      <option value="Embalam">Embalam</option>                                
      <option value="Gorimedu">Gorimedu</option>                                
      <option value="kaaterikuppam">kaaterikuppam</option>                                
      <option value="Kalapet">Kalapet</option>                                
      <option value="kannikoil">kannikoil</option>                                
      <option value="Karasur">Karasur</option>                                
      <option value="Karikalampakkam">Karikalampakkam</option>                                
      <option value="Kathirkamam">Kathirkamam</option>                                
      <option value="kirumampakkam">kirumampakkam</option>                                
      <option value="Kurumbapet">Kurumbapet</option>                                
      <option value="Lawspet">Lawspet</option>                                
      <option value="Madagadipet">Madagadipet</option>                                
      <option value="Madukarai">Madukarai</option>                                
      <option value="Manavely">Manavely</option>                                
      <option value="Mangalam">Mangalam</option>                                
      <option value="Mannadipet">Mannadipet</option>                                
      <option value="Mettupalayam">Mettupalayam</option>                                
      <option value="Moolakulam">Moolakulam</option>                                
      <option value="Mudaliarpet">Mudaliarpet</option>                                
      <option value="Murungapakkam">Murungapakkam</option>                                
      <option value="Muthialpet">Muthialpet</option>                                
      <option value="Muthirapalayam">Muthirapalayam</option>                                
      <option value="Nellithope">Nellithope</option>                                
      <option value="Netapakkam">Netapakkam</option>                                
      <option value="New Saram">New Saram</option>                                
      <option value="Odiampet">Odiampet</option>                                
      <option value="Old Saram">Old Saram</option>                                
      <option value="Orleanpet">Orleanpet</option>                                
      <option value="Ossudu">Ossudu</option>                                
      <option value="Ozhukarai">Ozhukarai</option>                                
      <option value="Pillaiyarkuppam">Pillaiyarkuppam</option>                                
      <option value="Pondicherry City">Pondicherry City</option>                                
      <option value="Pondicherry White Town">Pondicherry White Town</option>                                
      <option value="Rainbow nagar">Rainbow nagar</option>                                
      <option value="Sanyasikuppam">Sanyasikuppam</option>                                
      <option value="Sedarapet">Sedarapet</option>                                
      <option value="Sellipet">Sellipet</option>                                
      <option value="Thattanchavady">Thattanchavady</option>                                
      <option value="Thavalakuppam">Thavalakuppam</option>                                
      <option value="Thirubhuvanai">Thirubhuvanai</option>                                
      <option value="Thirukanchi">Thirukanchi</option>                                
      <option value="Tirukanur">Tirukanur</option>                                
      <option value="Thiruvandarkoil">Thiruvandarkoil</option>                                
      <option value="Thondamanatham">Thondamanatham</option>                                
      <option value="Uppalam">Uppalam</option>                                
      <option value="Uruvaiyar">Uruvaiyar</option>                                
      <option value="Vaadhanur">Vaadhanur</option>                                
      <option value="Velrampet">Velrampet</option>                                
      <option value="Villianur">Villianur</option>                                
      <option value="Manapet">Manapet</option>                                
      <option value="Kuruvinatham">Kuruvinatham</option>                                
      <option value="Karaiyambuthur">Karaiyambuthur</option>                                
      <option value="Seliamedu">Seliamedu</option>                                
      <option value="Chennai">Chennai</option>                                
      <option value="Coimbatore">Coimbatore</option>                                
      <option value="Madurai">Madurai</option>                                
      <option value="Tiruchirappalli">Tiruchirappalli</option>                                
      <option value="Salem">Salem</option>                                
      <option value="Tirunelveli">Tirunelveli</option>                                
      <option value="Tiruppur">Tiruppur</option>                                
      <option value="Vellore">Vellore</option>                                
      <option value="Erode">Erode</option>                                
      <option value="Thoothukkudi">Thoothukkudi</option>                                
      <option value="Dindigul">Dindigul</option>                                
      <option value="Thanjavur">Thanjavur</option>                                
      <option value="Ranipet">Ranipet</option>                                
      <option value="Sivakasi">Sivakasi</option>                                
      <option value="Karur">Karur</option>                                
      <option value="Udhagamandalam">Udhagamandalam</option>                                
      <option value="Hosur">Hosur</option>                                
      <option value="Nagercoil">Nagercoil</option>                                
      <option value="Kanchipuram">Kanchipuram</option>                                
      <option value="Kumarapalayam">Kumarapalayam</option>                                
      <option value="Karaikkudi">Karaikkudi</option>                                
      <option value="Neyveli">Neyveli</option>                                
      <option value="Cuddalore">Cuddalore</option>                                
      <option value="Kumbakonam">Kumbakonam</option>                                
      <option value="Tiruvannamalai">Tiruvannamalai</option>                                
      <option value="Pollachi">Pollachi</option>                                
      <option value="Rajapalayam">Rajapalayam</option>                                
      <option value="Gudiyatham">Gudiyatham</option>                                
      <option value="Pudukkottai">Pudukkottai</option>                                
      <option value="Vaniyambadi">Vaniyambadi</option>                                
      <option value="Ambur">Ambur</option>                                
      <option value="Nagapattinam">Nagapattinam</option>                                
      <option value="Villupuram">Villupuram</option>                                
      <option value="Tindivanam">Tindivanam</option>                                
      <option value="Chidambaram">Chidambaram</option>                                
      <option value="Gorimedu">Gorimedu</option>                                
      <option value="Venkata Nagar">Venkata Nagar</option>                                
      <option value="Vikravandi">Vikravandi</option>                                
      <option value="Others">Others</option>                                
      <option value="Karaikal">Karaikal</option>                                
      <option value="Virudhachalam">Virudhachalam</option>                                
      <option value="Kandamangalam">Kandamangalam</option>                                
      <option value="Reddiyarpalayam">Reddiyarpalayam</option>                                
      <option value="Mylapore">Mylapore</option>                                
      <option value="Kathirkamam">Kathirkamam</option>                                
      <option value="Kalmandapam">Kalmandapam</option>                                
      <option value="Kottakuppam">Kottakuppam</option>                                
      <option value="Vyasarpadi">Vyasarpadi</option>                                
      <option value="Thavalakuppam">Thavalakuppam</option>                                
      <option value="Tirukkanur">Tirukkanur</option>                                
      <option value="Vazhudavur">Vazhudavur</option>                                
      <option value="Tirunelvelli">Tirunelvelli</option>                                
      <option value="Auroville">Auroville</option>  
 
          </optgroup>
        </select>
      </div>
 



      {/* Conditional Fields for Property Features */}
      {renderPropertyFeatures()}

      {/* Photo Upload */}
      <div className="mb-3">
    
        <div className="text-center mb-3">
            <label htmlFor="photo-upload" className="btn rounded-0 photoupload" style={{background:'#73C2FB',color:'#ffffff', fontWeight:'bold'}}>
              <i className="bi bi-image me-2"></i>
              Upload Photos
            </label>
            <input
              id="photo-upload"
              type="file"
              multiple
              accept="image/*"
              className="form-control d-none"
              onChange={handlePhotoUpload}
            />
          </div>
    
  <div
  className="addpropertyphoto mb-3 p-3"
  style={{
    display: 'grid',
    gap: '10px',
    gridTemplateColumns: `repeat(${
      window.innerWidth > 1200
        ? 5
        : window.innerWidth > 992
        ? 3
        : window.innerWidth > 768
        ? 2
        : window.innerWidth > 576
        ? 2
        : 1
    }, 1fr)`,
  }}
>
  {photos.map((photo, index) => (
    <div key={index} style={{ textAlign: 'center' }}>
      <img
        src={URL.createObjectURL(photo)}
        alt="Uploaded"
        style={{ width: '80px', height: '80px', objectFit: 'cover' }}
      />
      <p style={{ color: 'red', cursor: 'pointer' }} onClick={() => removePhoto(index)}>
        Remove
      </p>
    </div>
  ))}
</div>


      </div>

      <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-6 col-sm-12">
          {/* Video Preview */}
          {videoPreview ? (
            <div className="mb-4 text-center">
              <video
                src={videoPreview}
                controls
                className="w-50 rounded mb-2"
                style={{ maxHeight: "400px" }}
              />
              <p
                style={{ color: 'red', cursor: 'pointer' }}
                onClick={removeVideo}
              >
                Remove Video
              </p>
            </div>
          ) : (
            // Upload Button when no video is previewed
            <div className="text-center">
              <label htmlFor="video-upload" className="btn rounded-0" style={{background:'#73C2FB',color:'#ffffff', fontWeight:'bold'}}>
                <i className="bi bi-camera-video me-2"></i>
                Upload Video
              </label>
              <input
                id="video-upload"
                type="file"
                accept="video/*"
                className="form-control d-none"
                onChange={handleVideoChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Submit Button */}
      <button className="apppropertybtn" type="submit">Submit</button>
    </form>
    </div>

{/* Empty Div with Black Background */}
<div className="col-md-5 d-none d-md-block" style={{ height: '100vh' }}></div>
</div>
</div>
  );
};

export default PropertyForm;

