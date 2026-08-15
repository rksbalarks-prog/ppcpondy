 
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { GoCheckCircleFill } from "react-icons/go";
import NoData from "../Assets/OOOPS-No-Data-Found.png";

const MyBuyerPlan = () => {
  const storedPhoneNumber = localStorage.getItem("phoneNumber") || "";
  const [phoneNumber] = useState(storedPhoneNumber);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [selectedPaymentData, setSelectedPaymentData] = useState(null);

  const fetchPlans = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/get-buyer-plan-by-phone-buyer/${phoneNumber}`
      );
      
      // Process the data to ensure all required fields are present
      const processedPlans = res.data.data.map(plan => {
        // Use plan.planInfo.planId as the primary plan ID, fallback to paymentData._id if needed
        const planId = plan.planInfo?.planId || plan.paymentData?._id || `temp-${Math.random().toString(36).substr(2, 9)}`;
        
        return {
          ...plan,
          _id: planId,
          ba_id: plan.ba_id || 0,
          paymentData: {
            ...plan.paymentData,
            _id: plan.paymentData?._id || planId,
            planName: plan.paymentData?.planName || plan.planInfo?.planName || "Unknown Plan",
            amount: plan.paymentData?.amount || plan.planInfo?.planAmount || "0",
            payustatususer: plan.paymentData?.payustatususer || "unknown"
          }
        };
      });
      
      setPlans(processedPlans || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch buyer plans.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (phoneNumber) {
      fetchPlans();
    } else {
      setError("Phone number not found in localStorage.");
      setLoading(false);
    }
  }, [phoneNumber]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString("en-GB").replace(/\//g, ".");
    } catch {
      return "N/A";
    }
  };

  const handleBackNavigation = () => {
    navigate("/mobileviews");
  };

  const openConfirmationPopup = (plan) => {
    // Validate all required fields before proceeding
    const validationErrors = [];
    
    if (!plan._id) {
      validationErrors.push("Plan ID is missing");
    }
    
    if (!plan.ba_id) {
      validationErrors.push("Buyer Assistance ID is missing");
    }
    
    if (!plan.paymentData?.amount) {
      validationErrors.push("Amount is missing");
    }
    
    if (!plan.paymentData?.planName) {
      validationErrors.push("Plan name is missing");
    }

    if (validationErrors.length > 0) {
      setMessage(validationErrors.join(", "));
      return;
    }

    setSelectedPaymentData({
      planId: plan._id,
      baId: plan.ba_id,
      amount: plan.paymentData.amount,
      planName: plan.paymentData.planName
    });
    setShowPopup(true);
    setMessage(""); // Clear any previous messages
  };

  const confirmPayment = () => {
    if (!selectedPaymentData) return;
    
    navigate("/payu-form-buyer", {
      state: {
        ...selectedPaymentData,
        phoneNumber: phoneNumber
      }
    });
    setShowPopup(false);
  };

  const cancelPopup = () => {
    setShowPopup(false);
    setSelectedPaymentData(null);
  };

  const styles = {
    card: {
      backgroundColor: "#fff",
      borderRadius: "10px",
      padding: "15px",
      margin: "10px 0",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      width: "100%",
      maxWidth: "450px"
    },
    checkmark: {
      color: "#28a745",
      fontSize: "20px"
    },
    planDetail: {
      margin: "5px 0",
      fontSize: "14px"
    }
  };

  return (
    <div
      className="container d-flex align-items-center justify-content-center p-0"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div
        className="d-flex flex-column align-items-center justify-content-center m-0"
        style={{ maxWidth: "450px", margin: "auto", width: "100%" }}
      >
        <div className="d-flex align-items-center w-100 p-2" style={{ background: "#EFEFEF" }}>
          <button
            onClick={handleBackNavigation}
            className="pe-5"
            style={{
              backgroundColor: "#f0f0f0",
              border: "none",
              padding: "10px 20px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <FaArrowLeft style={{ color: "#30747F" }} />
          </button>
          <h3 className="m-0" style={{ fontSize: "16px" }}>
            My Buyer Assistant Plan
          </h3>
        </div>

        {loading ? (
          <div
            className="text-center my-4"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <span className="spinner-border text-primary" role="status" />
            <p className="mt-2">Loading plans...</p>
          </div>
        ) : error ? (
          <div
            className="text-center my-4"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <p style={{ color: "red" }}>{error}</p>
          </div>
        ) : plans.length === 0 ? (
          <div
            className="text-center my-4"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <img src={NoData} alt="" width={100} />
            <p>No plans found.</p>
          </div>
        ) : (
          <>
            <h2
              className="mb-2"
              style={{ textAlign: 'center', color: '#009BC5', fontSize: '20px' }}
            >
              Current Plans
            </h2>

            {message && (
              <div className="alert alert-warning" style={{ width: '100%', textAlign: 'center' }}>
                {message}
              </div>
            )}

            {plans.map((plan, index) => (
              <div key={index} style={styles.card}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <h4 style={{ color: "#007bff", fontWeight: 600 }}>
                    {plan.paymentData?.planName || "No Plan Name"}
                  </h4>
                  <span style={styles.checkmark}>
                    <GoCheckCircleFill />
                  </span>
                </div>

                <p style={styles.planDetail}>
                  <strong>Plan ID:</strong> {plan._id || "N/A"}
                </p>
                <p style={styles.planDetail}>
                  <strong>Ba_Id:</strong> {plan.ba_id || "N/A"}
                </p>
                <p style={styles.planDetail}>
                  <strong>Status:</strong> {plan.paymentData?.payustatususer || "N/A"}
                </p>
                <p style={styles.planDetail}>
                  <strong>Amount:</strong> ₹{plan.paymentData?.amount || "N/A"}
                </p>
                <p style={styles.planDetail}>
                  <strong>Payment Date:</strong> {formatDate(plan.paymentData?.payUdate)}
                </p>
                <p style={styles.planDetail}>
                  <strong>Expiry Date:</strong> {formatDate(plan.paymentData?.expireDate)}
                </p>

                {plan.paymentData?.payustatususer !== "paid" && (
                  <button
                    onClick={() => openConfirmationPopup(plan)}
                    style={{
                      backgroundColor: "#007bff",
                      color: "white",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: 5,
                      cursor: "pointer",
                      marginTop: 10,
                    }}
                  >
                    {plan.paymentData?.status === "pending" ? "Continue to Pay" : "Pay Now"}
                  </button>
                )}

                {plan.paymentData?.payustatususer === "paid" && (
                  <p style={{ color: "green", fontWeight: "bold" }}>
                    {plan.paymentData?.expiryMessage || "Paid"}
                  </p>
                )}
              </div>
            ))}

            {showPopup && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 9999,
                }}
              >
                <div
                  style={{
                    backgroundColor: 'white',
                    padding: 20,
                    borderRadius: 10,
                    width: '90%',
                    maxWidth: 300,
                    textAlign: 'center',
                  }}
                >
                  <p style={{ fontWeight: 500, marginBottom: 20 }}>
                    Are you sure you want to continue to pay?
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                    <button
                      onClick={confirmPayment}
                      style={{
                        background: '#0B57CF',
                        cursor: 'pointer',
                        border: 'none',
                        color: '#fff',
                        borderRadius: '10px',
                        padding: '5px 12px',
                      }}
                    >
                      Yes
                    </button>
                    <button
                      onClick={cancelPopup}
                      style={{
                        background: '#EAEAF6',
                        cursor: 'pointer',
                        border: 'none',
                        color: '#0B57CF',
                        borderRadius: '10px',
                        padding: '5px 12px',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyBuyerPlan;