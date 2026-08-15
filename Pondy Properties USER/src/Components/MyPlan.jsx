



import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { GoCheckCircleFill } from "react-icons/go";

const MyPlan = () => {
  const storedPhoneNumber = localStorage.getItem("phoneNumber") || "";
  const [phoneNumber] = useState(storedPhoneNumber);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
 

useEffect(() => {
  if (!phoneNumber) {
    setError('Phone number is missing');
    setLoading(false);
    return;
  }

  const fetchPlans = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/plans-by-phone/${phoneNumber}`);
      const plans = res.data.plans || [];

      if (plans.length > 0 && Array.isArray(plans[0].phoneNumbers)) {
        const sortedPhoneNumbers = plans[0].phoneNumbers.sort((a, b) => {
          const dateA = new Date(a.paymentData?.createdAt || 0);
          const dateB = new Date(b.paymentData?.createdAt || 0);
          return dateB - dateA; // Newest first
        });

        // Replace sorted data
        plans[0].phoneNumbers = sortedPhoneNumbers;
      }

      setPlans(plans);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  fetchPlans();
}, [phoneNumber]);


   useEffect(() => {
      const recordDashboardView = async () => {
        try {
          await axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
            phoneNumber: phoneNumber,
            viewedFile: "My Plan",
            viewTime: new Date().toISOString(),
          });
        } catch (err) {
        }
      };
    
      if (phoneNumber) {
        recordDashboardView();
      }
    }, [phoneNumber]);
 
 
    const handleContinueToPay = (planId, ppcId, amount, planName) => {
    navigate('/payu-form', {
      state: { planId, ppcId, amount, phoneNumber, planName },
    });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB').replace(/\//g, '.');
  };

  const calculateExpireDate = (payUdate, durationDays) => {
    if (!payUdate || !durationDays) return "N/A";
    const baseDate = new Date(payUdate);
    const expireDate = new Date(baseDate);
    expireDate.setDate(baseDate.getDate() + durationDays);
    return expireDate.toISOString().split("T")[0];
  };

 

  const getExpiryMessage = (payUdate, durationDays) => {
  if (!payUdate || !durationDays) return <span>N/A</span>;
  const expireDate = new Date(payUdate);
  expireDate.setDate(expireDate.getDate() + durationDays);
  const today = new Date();
  const isExpired = today > expireDate;

 
  return (
    <span style={{ color: isExpired ? "#FF0000" : "#28a745", fontWeight: "500" }}>
      {isExpired
        ? "Expired"
        : `Active until ${expireDate.toLocaleDateString('en-GB').replace(/\//g, '.')}`}
    </span>
  );
};

  const handleBackNavigation = () => {
    navigate("/mobileviews");
  };


  return (
    <div className="container d-flex align-items-center justify-content-center p-0">
      <div className="d-flex flex-column align-items-center justify-content-center m-0" style={{ maxWidth: '450px', margin: 'auto', width: '100%', fontFamily: 'Inter, sans-serif' }}>

        <div className="row g-2 w-100"></div>
   

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
                    My Plan
                  </h3>
                </div>

        <h2 className='mb-2' style={{ textAlign: "center", color: "#009BC5", fontSize: "20px" }}>Current Plans</h2>

        {message && <p className='m-0' style={{ textAlign: "center", color: "#28a745" }}>{message}</p>}

        {plans.map((plan) => (
          <div key={plan._id} style={styles.card}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <h4 style={{ color: "#007bff", fontWeight: 600 }}>{plan.name}</h4>
              <span style={styles.checkmark}><GoCheckCircleFill /></span>
            </div>

            <p className='mb-1' style={styles.planDetail}><strong>Duration:</strong> <span style={styles.newPrice}>{plan.durationDays}</span> days</p>
            <p className='mb-1' style={styles.planDetail}><strong>Activated on:</strong> {formatDate(plan.createdAt)}</p>
            <p className='mb-1' style={styles.planDetail}><strong>Featured Ads:</strong> {plan.featuredAds}</p>
            <p className='mb-1' style={styles.planDetail}><strong>Feature Property Limit:</strong> {plan.featuredMaxCar}</p>


            {(plan.phoneNumbers || [])
              .filter(p => p.number === phoneNumber)
              .map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 8,
                    padding: 16,
                    marginTop: 20,
                    boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px",
                  }}
                >
                  <p className='m-0' style={styles.planDetail}><strong>PPC ID:</strong> {p.ppcId}</p>

                  {p.paymentData ? (
                    <>
                      <p className='m-0' style={styles.infoRow}><strong>PayU Status:</strong> {p.paymentData.payustatususer}</p>
                      <p className='m-0' style={styles.infoRow}><strong>Amount:</strong> ₹{p.paymentData.amount}</p>
                      <p className='m-0' style={styles.infoRow}><strong>Txn ID:</strong> {p.paymentData.txnid}</p>
                      <p className='m-0' style={styles.infoRow}><strong>PayU Date:</strong> {formatDate(p.paymentData.payUdate)}</p>
                      <p className='m-0' style={styles.infoRow}><strong>Email:</strong> {p.paymentData.email || "N/A"}</p>
                      <p className='m-0' style={styles.infoRow}><strong>Expires At:</strong>
                       {/* {
                        p.paymentData.payustatususer === "paid"
                          ? calculateExpireDate(p.paymentData.payUdate, plan.durationDays)
                          : "N/A"
                      } */}

                      {p.paymentData.expireDate}
                      </p>
                      <p className='m-0 text-warning mb-2' > <strong> {p.paymentData.expiryMessage}</strong></p>


                      

                 

                      {p.paymentData.payustatususer === "paid"
  ? getExpiryMessage(p.paymentData.payUdate, plan.durationDays)
  : <span style={{ color: "#FF0000", fontWeight: 500 }}>Payment not completed</span>}


                      {p.paymentData.payustatususer !== "paid" && (
                        <button
                          onClick={() =>
                            handleContinueToPay(plan._id, p.ppcId, p.paymentData.amount, plan.name)
                          }
                          style={styles.upgradeButton}
                        >
                          {p.paymentData.status === "pending" ? "Continue to Pay" : "Pay Now"}
                        </button>
                      )}
                    </>
                  ) : (
                    <p className='m-0' style={{ color: "#999" }}>No payment data available.</p>
                  )}
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyPlan;


const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#F7F9FB',
    // minHeight: '100vh',
    fontFamily: 'Arial, sans-serif',
    width:"100%",
      overflowY: 'auto',   
        height: '100vh',  
   scrollbarWidth: 'none',              // Firefox
  msOverflowStyle: 'none',             // IE 10+
  WebkitOverflowScrolling: 'touch', 

  },
  card: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0, 123, 255, 0.3)'
  },
  planTitle: {
    fontSize: "15px",
    fontWeight: "bold",
    color: '#007BFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  checkmark: {
    color: 'green',
    fontSize: '18px'
  },
  planDetail: {
    fontSize: '14px',
    color: 'grey',
    margin: '5px 0'
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    borderBottom: '1px solid #eee',
    padding: '10px 0',
    fontSize: '14px',
  },
  infoRows: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  viewButton: {
    backgroundColor: '#fff',
    color: "#007BFF",
    border: '1px solid #007BFF',
    padding: '1px 8px',
    borderRadius: '5px',
    fontSize: '12px',
    marginLeft: '10px'
  },
  newPrice: {
    color: '#007BFF',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  upgradeButton: {
    width: '100%',
    backgroundColor: '#007BFF',
    color: 'white',
    padding: '12px',
    fontSize: '16px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  }

};




// *******************************************************************








