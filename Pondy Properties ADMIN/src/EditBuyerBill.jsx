

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

const EditBuyerBill = () => {
  const { ba_id } = useParams(); // ✅ Get ppcId from URL
  const [billData, setBillData] = useState({
    adminOffice: '',
    adminName: '',
    billNo: '',
    billDate: '',
    ba_id: '',
    ownerPhone: '',
    paymentType: '',
    planName: '',
    billAmount: '',
    validity: '',
    noOfAds: '',
    featuredAmount: '',
    featuredValidity: '',
    featuredMaxAds: '',
    discount: '',
    netAmount: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [plans, setPlans] = useState([]);

  // Get admin name from Redux or localStorage
  const reduxAdminName = useSelector((state) => state.admin?.name);
  const adminName = reduxAdminName || localStorage.getItem("adminName") || "Unknown";

  // Fetch bill data on mount
  useEffect(() => {
    const fetchBill = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/buyer-get-bill/${ba_id}`);
        if (res.data.success) {
          setBillData(res.data.data);
        } else {
          setMessage('Bill not found.');
        }
      } catch (err) {
        setMessage('Error loading bill data.');
      }
    };

    const fetchPaymentTypes = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/payment-all`);
        if (res.data && Array.isArray(res.data)) {
          setPaymentTypes(res.data);
        } else {
        }
      } catch (error) {
      }
    };

    
  const fetchPlans = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/plans-buyer`);
      setPlans(res.data);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

    fetchBill();
    fetchPaymentTypes();
    fetchPlans();
  }, [ba_id]);

  const handleChange = (e) => {
    setBillData({ ...billData, [e.target.name]: e.target.value });
  };
const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Include adminName in the request body so backend can track who edited
      const updateData = {
        ...billData,
        adminName: adminName
      };

      const res = await axios.put(`${process.env.REACT_APP_API_URL}/buyer-update-bill/${ba_id}`, updateData);
      if (res.data.success) {
        setMessage('✅ Bill updated successfully!');
        // Refresh bill data to show updated values
        const refreshRes = await axios.get(`${process.env.REACT_APP_API_URL}/buyer-get-bill/${ba_id}`);
        if (refreshRes.data.success) {
          setBillData(refreshRes.data.data);
        }
      } else {
        setMessage('❌ Failed to update bill.');
      }
    } catch (err) {
      setMessage(`❌ Server error: ${err.response?.data?.message || err.message}`);
      console.error('Update error:', err);
    }
    setLoading(false);
    setTimeout(() => {
      navigate(-1);
    }, 2000);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>Edit Buyer Bill</h2>

      {message && <div style={{ color: 'green', marginBottom: '10px' }}>{message}</div>}

      <form onSubmit={handleSubmit}>
        {[
          { label: 'Admin Office', name: 'adminOffice', readOnly: true },
          { label: 'Admin Name', name: 'adminName', readOnly: true },
          { label: 'Bill No', name: 'billNo', readOnly: true },
          { label: 'Bill Date', name: 'billDate', readOnly: true },
          { label: 'Ba_Id', name: 'ba_id', required: true },
          { label: 'Owner Phone', name: 'ownerPhone', required: true },
          { label: 'Bill Amount', name: 'billAmount', required: true },
          { label: 'Validity (Days)', name: 'validity', required: true },
          { label: 'No of Ads', name: 'noOfAds', required: true },
          { label: 'Featured Amount', name: 'featuredAmount', required: true },
          { label: 'Featured Validity (Days)', name: 'featuredValidity', required: true },
          { label: 'Featured Max Ads', name: 'featuredMaxAds', required: true },
          { label: 'Discount (%)', name: 'discount' },
          { label: 'Net Amount', name: 'netAmount', required: true },
        ].map(({ label, name, readOnly, required }) => (
          <div className="form-group" key={name}>
            <label>{label}</label>
            <input
              type="text"
              name={name}
              value={billData[name]}
              onChange={handleChange}
              className="form-control"
              readOnly={readOnly}
              required={required}
            />
          </div>
        ))}

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
            {paymentTypes.map((payment, idx) => (
              <option key={idx} value={payment.paymentType}>
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
    .filter((plan) => plan?.planName?.trim?.().toLowerCase() !== 'free')
    .map((plan, index) => {
      const name = plan?.planName?.trim?.(); // <- using plan.planName
      return (
        <option key={index} value={name || ''}>
          {name || 'Unnamed Plan'}
        </option>
      );
    })}
</select>
</div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Updating Bill...' : 'Update Bill'}
        </button>
      </form>
    </div>
  );
};

export default EditBuyerBill;
