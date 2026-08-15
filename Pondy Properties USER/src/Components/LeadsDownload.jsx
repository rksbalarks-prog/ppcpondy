import React, { useEffect, useState } from "react";
import axios from "axios";

const LeadsDownload = ({phoneNumber}) => {
  const [formData, setFormData] = useState({
    rentId: "",
    fromDate: "",
    endDate: "",
    businessSupport: {
      receivedInterest: { unread: false, read: false, all: false },
      matchedTenants: { unread: false, read: false, all: false },
      tenantsContacted: { unread: false, read: false, all: false },
      tenantsShortlisted: { unread: false, read: false, all: false },
      tenantsViewed: { unread: false, read: false, all: false },
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (category, field) => {
    setFormData((prevData) => ({
      ...prevData,
      businessSupport: {
        ...prevData.businessSupport,
        [category]: { ...prevData.businessSupport[category], [field]: !prevData.businessSupport[category][field] },
      },
    }));
  };
   useEffect(() => {
        const recordDashboardView = async () => {
          try {
            await axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
              phoneNumber: phoneNumber,
              viewedFile: "Lead Download",
              viewTime: new Date().toISOString(),
            });
          } catch (err) {
          }
        };
      
        if (phoneNumber) {
          recordDashboardView();
        }
      }, [phoneNumber]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/download-leads`, formData);
      alert("Leads downloaded successfully!");
    } catch (error) {
      alert("Failed to download leads.");
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-center">Download Leads</h2>

      <label className="block mt-3">Rent ID</label>
      <input type="text" name="rentId" value={formData.rentId} onChange={handleChange} className="w-full border p-2 rounded" placeholder="Enter Rent ID" />

      <label className="block mt-3">From Date</label>
      <input type="date" name="fromDate" value={formData.fromDate} onChange={handleChange} className="w-full border p-2 rounded" />

      <label className="block mt-3">End Date</label>
      <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full border p-2 rounded" />

      <table className="w-full mt-4 border-collapse border">
        <thead>
          <tr>
            <th className="border p-2">Business Support</th>
            <th className="border p-2">Unread</th>
            <th className="border p-2">Read</th>
            <th className="border p-2">All</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(formData.businessSupport).map((category) => (
            <tr key={category}>
              <td className="border p-2">{category.replace(/([A-Z])/g, " $1")}</td>
              <td className="border p-2 text-center">
                <input type="checkbox" onChange={() => handleCheckboxChange(category, "unread")} checked={formData.businessSupport[category].unread} />
              </td>
              <td className="border p-2 text-center">
                <input type="checkbox" onChange={() => handleCheckboxChange(category, "read")} checked={formData.businessSupport[category].read} />
              </td>
              <td className="border p-2 text-center">
                <input type="checkbox" onChange={() => handleCheckboxChange(category, "all")} checked={formData.businessSupport[category].all} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={handleSubmit} className="mt-4 bg-purple-600 text-white p-2 rounded w-full">
        Download
      </button>
    </div>
  );
};

export default LeadsDownload;
