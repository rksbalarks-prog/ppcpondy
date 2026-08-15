import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";


const AddressTable = () => {
  const [data, setData] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [ppcIdFilter, setPpcIdFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [locationFilter, setLocationFilter] = useState('All');

  const navigate = useNavigate();




  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/fetch-address-datas`);

        // Sort properties by updatedAt first (newest first), then by createdAt
        const sortedProperties = response.data.users.sort((a, b) => {
          const updatedAtComparison = new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
          if (updatedAtComparison !== 0) return updatedAtComparison;

          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });

        setData(sortedProperties);
      } catch (error) {
      }
    };

    fetchData();
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
  const filteredData = data.filter((item) => {
  const matchesSearch = Object.values(item).some((value) =>
    value?.toString().toLowerCase().includes(searchText.toLowerCase())
  );

  const matchesPpcId = ppcIdFilter
    ? item.ppcId?.toString() === ppcIdFilter
    : true;

  const createdAt = item.createdAt ? new Date(item.createdAt) : null;
  const from = startDate ? new Date(startDate) : null;
  const to = endDate ? new Date(endDate) : null;

  const matchesDate =
    (!from || (createdAt && createdAt >= from)) &&
    (!to || (createdAt && createdAt <= to));

  // ✅ Location filter: Yes = has coordinates, No = no coordinates
  const matchesLocation = locationFilter === 'Yes'
    ? item.locationCoordinates && item.locationCoordinates.length > 0
    : locationFilter === 'No'
    ? !item.locationCoordinates || item.locationCoordinates.length === 0
    : true; // 'All' or unset

  return matchesSearch && matchesPpcId && matchesDate && matchesLocation;
});

  const handleDelete = async (ppcId) => {
    if (window.confirm(`Are you sure you want to delete PPC ID: ${ppcId}?`)) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/delete-free-property/${ppcId}`, {
          method: 'PUT',
        });
        const data = await response.json();
        alert(data.message);
        // Optionally refresh data here
      } catch (error) {
        alert('Failed to delete the property.');
      }
    }
  };
  
  const handleUndoDelete = async (ppcId) => {
    if (window.confirm(`Are you sure you want to undo delete for PPC ID: ${ppcId}?`)) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/undo-delete-free-property/${ppcId}`, {
          method: 'PUT',
        });
        const data = await response.json();
        alert(data.message);
        // Optionally refresh data here
      } catch (error) {
        alert('Failed to undo delete.');
      }
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Property Address Data Table</h2>

      {/* Filters */}
      <div     style={{ 
  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', 
  padding: '20px', 
  backgroundColor: '#fff' 
}} className="d-flex flex-row gap-2 align-items-center flex-nowrap"
>
        <input
          type="text"
          placeholder="Search all fields"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Search by PPC ID"
          value={ppcIdFilter}
          onChange={(e) => setPpcIdFilter(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="date"
          placeholder="Start Date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="date"
          placeholder="End Date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="p-2 border rounded"

        />
        <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
  <option value="All">All</option>
  <option value="Yes">Yes (Has Location)</option>
  <option value="No">No (No Location)</option>
</select>

      </div>
             <button className="btn btn-secondary mb-3 mt-3" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
      {/* Table */}
      <div className="overflow-x-auto mt-3">
        <h3 className='text-primary mb-3'>  Fetch Address Table </h3>
     <div ref={tableRef}>   <table className="min-w-full bg-white border rounded">
          <thead className="sticky-top">
            <tr>
              <th>S.No</th>
                 <th className="sticky-col sticky-col-1">PPC ID</th>
              <th className="sticky-col sticky-col-2">Phone Number</th>
                      <th className="p-2 border">Property Mode</th>
              <th className="p-2 border">Property Type</th>
              <th className="p-2 border">Price</th>
              <th className="p-2 border">State</th>
              <th className="p-2 border">City</th>
              <th className="p-2 border">District</th>
              <th className="p-2 border">Area</th>
              <th className="p-2 border">Street</th>
              <th className="p-2 border">Nagar</th>
               <th className="p-2 border">Rental Property Address</th>
              <th className="p-2 border">PinCode</th>
              <th className="p-2 border">Latitude,Longitude</th>
              <th className="p-2 border">Owner Name</th>
      
               <th className="p-2 border">Plan Name</th>
<th className="p-2 border">Plan Created</th>
<th className="p-2 border">Created</th>
<th className="p-2 border">Updated</th>
 
<th className="p-2 border">Actions</th>


            </tr>
          </thead>
          <tbody>
            {filteredData.map((item,index) => (
              <tr key={item._id} className="text-center">
                <td>{index+1}</td>
                <td     onClick={() =>
                              navigate(`/dashboard/detail`, {
                                state: { ppcId: item.ppcId, phoneNumber: item.phoneNumber },
                              })
                            }         style={{
        cursor: "pointer",
      }}className="sticky-col sticky-col-1 ">{item.ppcId}</td>
                <td className="sticky-col sticky-col-2 ">{item.phoneNumber}</td>
                    <td className="p-2 border">{item.propertyMode}</td>
                <td className="p-2 border">{item.propertyType}</td>
                <td className="p-2 border">{item.price}</td>
                <td className="p-2 border">{item.state}</td>
                <td className="p-2 border">{item.city}</td>
                <td className="p-2 border">{item.district}</td>
                <td className="p-2 border">{item.area}</td>
                <td className="p-2 border">{item.streetName}</td>
                <td className="p-2 border">{item.nagar}</td>
                 <td className="p-2 border">{item.rentalPropertyAddress}</td>
                <td className="p-2 border">{item.pinCode}</td>
                <td className="p-2 border">{item.locationCoordinates}</td>
                
                <td className="p-2 border">{item.ownerName}</td>
             

                <td className="p-2 border">{item.planName || 'Free'}</td>
<td className="p-2 border">{item.planCreatedAt ? new Date(item.planCreatedAt).toLocaleDateString() : 'N/A'}</td>
<td className="p-2 border">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}</td>
<td className="p-2 border">{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'N/A'}</td>
  
    <td>
                  
                        </td>

    <td>
  {item.isDeleted ? (
    <button
      className="btn btn-success btn-sm"
      onClick={() => handleUndoDelete(item.ppcId)}
    >
      Undo
    </button>
  ) : (
    <button
      className="btn btn-danger btn-sm"
      onClick={() => handleDelete(item.ppcId)}
    >
      Delete
    </button>
  )}
</td>
              </tr>
            ))}
          </tbody>
        </table>
</div> 
        {filteredData.length === 0 && (
          <div className="text-center p-4 text-gray-500">No data found.</div>
        )}
      </div>
    </div>
  );
};

export default AddressTable;
