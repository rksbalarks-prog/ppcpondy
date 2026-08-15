import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const EditBill = () => {
  const { ppcId } = useParams(); // ✅ Get ppcId from URL
  const [billData, setBillData] = useState({
    adminOffice: "",
    adminName: "",
    billNo: "",
    billDate: "",
    ppId: "",
    ownerPhone: "",
    paymentType: "",
    planName: "",
    billAmount: "",
    validity: "",
    noOfAds: "",
    featuredAmount: "",
    featuredValidity: "",
    featuredMaxAds: "",
    discount: "",
    netAmount: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [plans, setPlans] = useState([]);

  // Fetch bill data on mount
  useEffect(() => {
    const fetchBill = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/get-bill/${ppcId}`,
        );
        if (res.data.success) {
          setBillData(res.data.data);
        } else {
          setMessage("Bill not found.");
        }
      } catch (err) {
        setMessage("Error loading bill data.");
      }
    };

    const fetchPaymentTypes = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/payment-all`,
        );
        if (res.data && Array.isArray(res.data)) {
          setPaymentTypes(res.data);
        } else {
        }
      } catch (error) {}
    };

    const fetchPlans = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/plans`);
        if (res.data && Array.isArray(res.data)) {
          setPlans(res.data);
        } else {
        }
      } catch (error) {}
    };

    fetchBill();
    fetchPaymentTypes();
    fetchPlans();
  }, [ppcId]);

  const handleChange = (e) => {
    setBillData({ ...billData, [e.target.name]: e.target.value });
  };
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/update-bill/${ppcId}`,
        billData,
      );
      if (res.data.success) {
        // Ensure the property is marked active so it appears in the Approved list
        try {
          await axios.put(
            `${process.env.REACT_APP_API_URL}/update-property-status`,
            {
              ppcId,
              status: "active",
            },
          );
        } catch (err) {
          console.error("Failed to update property status:", err);
        }

        setMessage(
          "Bill updated successfully! Redirecting to approved list...",
        );
        navigate("/dashboard/approved-car");
      } else {
        setMessage("Failed to update bill.");
      }
    } catch (err) {
      setMessage("Server error while updating bill.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h2>Edit Bill</h2>

      {message && (
        <div style={{ color: "green", marginBottom: "10px" }}>{message}</div>
      )}

      <form onSubmit={handleSubmit}>
        {[
          { label: "Admin Office", name: "adminOffice", readOnly: true },
          { label: "Admin Name", name: "adminName", readOnly: true },
          { label: "Bill No", name: "billNo", readOnly: true },
          { label: "Bill Date", name: "billDate", readOnly: true },
          { label: "PP ID", name: "ppId", readOnly: true, required: true },
          {
            label: "Owner Phone",
            name: "ownerPhone",
            readOnly: true,
            required: true,
          },
          { label: "Bill Amount", name: "billAmount", required: true },
          { label: "Validity (Days)", name: "validity", required: true },
          { label: "No of Ads", name: "noOfAds", required: true },
          { label: "Featured Amount", name: "featuredAmount", required: true },
          {
            label: "Featured Validity (Days)",
            name: "featuredValidity",
            required: true,
          },
          { label: "Featured Max Ads", name: "featuredMaxAds", required: true },
          { label: "Discount (%)", name: "discount" },
          { label: "Net Amount", name: "netAmount", required: true },
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
              .filter((plan) => plan?.name?.trim?.().toLowerCase() !== 'free')
              .map((plan, idx) => (
                <option key={idx} value={plan.name.trim()}>
                  {plan.name.trim()}
                </option>
              ))}
          </select>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Updating Bill..." : "Update Bill"}
        </button>
      </form>
    </div>
  );
};

export default EditBill;