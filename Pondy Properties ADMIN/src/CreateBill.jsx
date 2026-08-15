

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation , useNavigate } from 'react-router-dom';
import { useSelector } from "react-redux";
import moment from 'moment';


const CreateBill = () => {
  const [billData, setBillData] = useState({
    adminOffice: '',
    adminName: '',
    billNo: '',
    billDate: '',
    ppId: '',
    ownerPhone: '',
    paymentType: '',
    planName: '',
    billAmount: '',
    validity: '',
    noOfAds: '',
    featuredAmount: '',
    featuredValidity: '',
    featuredMaxAds: '',
    discount: 0,
    netAmount: '',
  });



  const [paymentTypes, setPaymentTypes] = useState([]);
  const [plans, setPlans] = useState([]);



  useEffect(() => {
    const fetchDefaultBillData = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-default-bill-data`);
        if (res.data.success) {
          setBillData(prev => ({
            ...prev,
            ...res.data.data
          }));
        }
      } catch (error) {
        console.error('Error fetching default bill data:', error);
      }
    };
  
    fetchDefaultBillData();
  }, []);

  useEffect(() => {
    fetchPaymentTypes();
    fetchPlans();
  }, []);



  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);
  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");

  const fileName = "CreateBill"; // for dashboard view

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
        console.error("Error recording dashboard view:", err);
      }
    };

    if (adminName && adminRole) {
      recordDashboardView();
    }
  }, [adminName, adminRole]);
  
  const location = useLocation();
  const { ppcId ,phoneNumber, bulkMode, items: bulkItems, bulkCount} = location.state || {};
  

  useEffect(() => {
    if (adminName) {
      setBillData((prev) => ({
        ...prev,
        adminName,
      }));
    }
  }, [adminName]);
  

  useEffect(() => {
    setBillData(prev => ({
      ...prev,
      ppId: ppcId,
      ownerPhone: phoneNumber
    }));
  }, [ppcId, phoneNumber]);
  

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch default bill values, payment types, and plans
  useEffect(() => {
    fetchDefaultBillData();
    fetchPaymentTypes();
    fetchPlans();
  }, []);

  const fetchDefaultBillData = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-default-bill-data`);
      if (res.data.success) {
        setBillData(prev => ({
          ...prev,
          ...res.data.data
        }));
      }
    } catch (error) {
      console.error('Error fetching default bill data:', error);
    }
  };

  const fetchPaymentTypes = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/payment-all`);
      setPaymentTypes(res.data);
    } catch (error) {
      console.error('Error fetching payment types:', error);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/plans`);
      setPlans(res.data);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBillData(prev => ({ ...prev, [name]: value }));
  };



  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ── Bulk mode: apply these bill details to every supplied property ──
    if (bulkMode) {
      const itemsToSend = Array.isArray(bulkItems) ? bulkItems : [];
      if (itemsToSend.length === 0) {
        alert("No properties to bill.");
        return;
      }
      const ok = window.confirm(
        `Create bills for ${itemsToSend.length} propert${itemsToSend.length === 1 ? "y" : "ies"} and move them to Active (Approved)?\n\nProperties that already have a bill will be skipped.`
      );
      if (!ok) return;
      setLoading(true);
      try {
        const res = await axios.post(`${process.env.REACT_APP_API_URL}/create-bill-bulk`, {
          items: itemsToSend,
          billData,
        });
        if (res.data?.success) {
          const { createdCount = 0, skippedCount = 0, fromBillNo, toBillNo } = res.data;
          const range = fromBillNo ? (toBillNo && toBillNo !== fromBillNo ? `${fromBillNo} – ${toBillNo}` : fromBillNo) : "";
          alert(`Bulk bill complete.\nCreated: ${createdCount}${range ? ` (${range})` : ""}\nSkipped (already billed): ${skippedCount}\nThese properties are now Active (Approved).`);
          setTimeout(() => navigate("/dashboard/approved-car"), 1500);
        } else {
          alert(res.data?.message || "Bulk bill failed.");
        }
      } catch (err) {
        alert("Failed to create bulk bills!\n" + (err.response?.data?.message || err.message));
        console.error("Bulk bill error:", err);
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/create-bill`, billData);
      if (res.data.success) {
        setMessage('Bill created successfully!');
          setTimeout(() => {
      navigate(-1);
    }, 3000);
        // Trigger download after successful creation
        downloadBill(billData);
  
        // Reset form
        setBillData({
          adminOffice: '',
          adminName: '',
          billNo: '',
          billDate: '',
          ppId: '',
          ownerPhone: '',
          paymentType: '',
          planName: '',
          billAmount: '',
          validity: '',
          noOfAds: '',
          featuredAmount: '',
          featuredValidity: '',
          featuredMaxAds: '',
          discount: 0,
          netAmount: '',
        });
        fetchDefaultBillData();
      } else {
        setMessage('Failed to create bill.');
      }
    } catch (error) {
      console.error('Error creating bill:', error);
      setMessage('Server Error while creating bill.');
    }
  
  // Clear the message after 3 seconds
  setTimeout(() => {
    setMessage('');
  }, 3000);

  setLoading(false);
  
};


  


  const downloadBill = (bill) => {
  const billContent = `
  PROPERTY PAYMENT BILL
  -------------------------------
  Bill No: ${bill.billNo || ''}          Bill Date: ${bill.billDate || ''}
  
  Field                Details
  ---------------------------------------
  Admin Office         ${bill.adminOffice || ''}
  Admin Name           ${bill.adminName || ''}
  PP ID                ${bill.ppId || ''}
  Owner Phone          ${bill.ownerPhone || ''}
  Payment Type         ${bill.paymentType || ''}
  Plan Name            ${bill.planName || ''}
  Bill Amount          ₹${bill.billAmount || '0'}
  Validity             ${bill.validity || '0'} days
  No of Ads            ${bill.noOfAds || '0'}
  Featured Amount      ₹${bill.featuredAmount || '0'}
  Featured Validity    ${bill.featuredValidity || '0'} days
  Featured Max Ads     ${bill.featuredMaxAds || '0'}
  Discount             ${bill.discount || '0'}%
  Net Amount           ₹${bill.netAmount || '0'}
  
  Thank you for your payment!
  `.trim(); // Clean extra top space
  
    const blob = new Blob([billContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
  
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bill.billNo || 'bill'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };


  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>Create Bill</h2>

      {message && <div style={{ marginBottom: '10px', color: 'green' }}>{message}</div>}

      <form onSubmit={handleSubmit}>
        {bulkMode && (
          <div style={{ marginBottom: '15px', padding: '12px 15px', background: '#fff8e1', border: '1px solid #f0ad4e', borderRadius: '6px', color: '#7a5b00', fontWeight: 'bold' }}>
            🧾 Bulk Bill — these details will be applied to {bulkCount ?? (bulkItems ? bulkItems.length : 0)} bulk-uploaded propert{(bulkCount ?? (bulkItems ? bulkItems.length : 0)) === 1 ? 'y' : 'ies'}. A unique bill number is generated per property; properties that already have a bill are skipped. Each billed property becomes Active (Approved).
          </div>
        )}

        <div className="form-group">
          <label>Admin Office</label>
          <input type="text" name="adminOffice" value={billData.adminOffice} onChange={handleChange} className="form-control" readOnly />
        </div>

     

<div className="form-group">
  <label>Admin Name</label>
  <input
    type="text"
    name="adminName"
    value={billData.adminName}
    onChange={handleChange}
    className="form-control"
    readOnly
  />
</div>


        <div className="form-group">
          <label>Bill No</label>
          <input type="text" name="billNo" value={billData.billNo} onChange={handleChange} className="form-control" readOnly />
        </div>

        <div className="form-group">
          <label>Bill Date</label>
        
       <input
  type="date"
  name="billDate"
  className="form-control"
  value={billData.billDate}
  onChange={handleChange}
  min={new Date().toISOString().split('T')[0]} // disables past dates
  required
/>

        </div>

        {bulkMode ? (
          <div className="form-group">
            <label>Bulk Upload Count</label>
            <input type="text" value={`${bulkCount ?? (bulkItems ? bulkItems.length : 0)} properties`} disabled className="form-control" />
            <small style={{ color: '#6c757d' }}>PP ID &amp; owner phone are taken from each selected property automatically.</small>
          </div>
        ) : (
          <>
            <div className="form-group">
              <label>PP ID</label>
              <input type="text" name="ppId" value={billData.ppId} onChange={handleChange} className="form-control" required />
            </div>

            <div className="form-group">
              <label>Owner Phone</label>
              <input type="text" name="ownerPhone" value={billData.ownerPhone} onChange={handleChange} className="form-control" required />
            </div>
          </>
        )}

        <div className="form-group">
          <label>Payment Type</label>
          <select
            name="paymentType"
            value={billData.paymentType}
            onChange={handleChange}
            className="form-control"
            required
          >
            <option value="">Select Payment Type</option>
            {paymentTypes.map((payment, index) => (
              <option key={index} value={payment.paymentType}>
                {payment.paymentType}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Plan Name</label>
          <select
            name="planName"
            value={billData.planName}
            onChange={handleChange}
            className="form-control"
            required
          >
            <option value="">Select Plan</option>
            {/* Admin-only "Free" plan for billing. Not part of the plans data,
                so it never appears in the user-side app. */}
            <option value="Free">Free</option>
            {plans
              .filter((plan) => plan?.name?.trim?.().toLowerCase() !== 'free')
              .map((plan, index) => (
                <option key={index} value={plan.name.trim()}>
                  {plan.name.trim()}
                </option>
              ))}
          </select>
        </div>


        <div className="form-group">
          <label>Bill Amount</label>
          <input type="number" name="billAmount" value={billData.billAmount} onChange={handleChange} className="form-control" required />
        </div>

        <div className="form-group">
          <label>Validity (Days)</label>
          <input type="number" name="validity" value={billData.validity} onChange={handleChange} className="form-control" required />
        </div>

        <div className="form-group">
          <label>No of Ads</label>
          <input type="number" name="noOfAds" value={billData.noOfAds} onChange={handleChange} className="form-control" required />
        </div>

        <div className="form-group">
          <label>Featured Amount</label>
          <input type="number" name="featuredAmount" value={billData.featuredAmount} onChange={handleChange} className="form-control" required />
        </div>

        <div className="form-group">
          <label>Featured Validity (Days)</label>
          <input type="number" name="featuredValidity" value={billData.featuredValidity} onChange={handleChange} className="form-control" required />
        </div>

        <div className="form-group">
          <label>Featured Max Ads</label>
          <input type="number" name="featuredMaxAds" value={billData.featuredMaxAds} onChange={handleChange} className="form-control" required />
        </div>

        <div className="form-group">
          <label>Discount (%)</label>
          <input type="number" name="discount" value={billData.discount} onChange={handleChange} className="form-control" />
        </div>

        <div className="form-group">
          <label>Net Amount</label>
          <input type="number" name="netAmount" value={billData.netAmount} onChange={handleChange} className="form-control" required />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? (bulkMode ? 'Creating Bills...' : 'Creating Bill...') : (bulkMode ? 'Create Bulk Bills' : 'Create Bill')}
        </button>
      </form>
    </div>
  );
};

export default CreateBill;

