import { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { GoCheckCircleFill } from "react-icons/go";

export default function MyPlanGetDatas() {
  const location = useLocation();
  const navigate = useNavigate();
  const storedPhoneNumber = location.state?.phoneNumber || localStorage.getItem("phoneNumber") || "";

  const [phoneNumber, setPhoneNumber] = useState(storedPhoneNumber);
  const [plans, setPlans] = useState([]);
  const [allPlans, setAllPlans] = useState([]);
  const [error, setError] = useState("");
  const [nextPlan, setNextPlan] = useState(null);
  const [usedCars, setUsedCars] = useState(0);
  const [remainingCars, setRemainingCars] = useState(0);
  const [planLimitMessage, setPlanLimitMessage] = useState("");
  const [planData, setPlanData] = useState(null); // ✅ state to hold full data

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
  const handleUpgradeClick = () => {
    navigate("/add-plan");
  };

  const handleBackNavigation = () => {
    navigate("/mobileviews");
  };
   useEffect(() => {
      const recordDashboardView = async () => {
        try {
          await axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
            phoneNumber: phoneNumber,
            viewedFile: "My Plan Get Datas",
            viewTime: new Date().toISOString(),
          });
        } catch (err) {
        }
      };
    
      if (phoneNumber) {
        recordDashboardView();
      }
    }, [phoneNumber]);
  useEffect(() => {
    const fetchPlans = async () => {
      if (!phoneNumber) return;

      try {
        const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/plans-with-payment-datas-get/${phoneNumber}`);
        if (data.success) {
          setPlans(data.plans);
          setUsedCars(data.usedCars);
          setRemainingCars(data.remainingCars);
          setPlanLimitMessage(data.planLimitMessage || "");
          setPlanData(data); // ✅ assigning full response to planData
          setError("");
        } else {
          setPlans([]);
          setUsedCars(0);
          setRemainingCars(0);
          setPlanLimitMessage("");
          setPlanData(null);
          setError(data.message || "No plans found.");
        }
      } catch (err) {
        setError("Error fetching your plans.");
        setPlans([]);
        setUsedCars(0);
        setRemainingCars(0);
        setPlanLimitMessage("");
        setPlanData(null);
      }
    };

    const fetchAllPlans = async () => {
      try {
        const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/plans`);
        setAllPlans(data);
      } catch {
        setError("Error fetching available plans.");
      }
    };

    fetchPlans();
    fetchAllPlans();
  }, [phoneNumber]);

  useEffect(() => {
    if (plans.length > 0 && allPlans.length > 0) {
      const currentPlan = plans[0];
      const currentIndex = allPlans.findIndex(p => p.name === currentPlan.name);
      const next = allPlans[currentIndex + 1];
      if (next) setNextPlan(next);
    }
  }, [plans, allPlans]);

  return (
    <div className="container d-flex align-items-center justify-content-center p-0">
      <div
        className="d-flex flex-column align-items-center justify-content-center m-0"
        style={{ maxWidth: "500px", margin: "auto", width: "100%", fontFamily: "Inter, sans-serif" }}
      >
        <div className="d-flex align-items-center w-100" 
           style={{
        background: "#EFEFEF",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        opacity: isScrolling ? 0 : 1,
        pointerEvents: isScrolling ? "none" : "auto",
        transition: "opacity 0.3s ease-in-out",
      }}>
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
          <h3 className="m-0" style={{ fontSize: "20px" }}>
            My Plan
          </h3>
        </div>

        {planData && (
          <>
            <div style={{ margin: "20px 0", width: "100%", textAlign: "center" }}>
              <h2>Plan Details for: {planData.phoneNumber}</h2>
              <p>Total Properties Posted: {planData.totalProperties}</p>
              <p>Plan Limit (No. of Properties Allowed): {planData.planLimit}</p>
              <p>Used Properties Count: {planData.usedPropertiesCount}</p>
              <p>Properties without Plan: {planData.noPlanPropertiesCount}</p>
            </div>

   

            <h3 style={{ marginTop: 20, textAlign: "center" }}>Your Plans</h3>
            {planData.plans.length > 0 ? (
              planData.plans.map((plan, idx) => (
                <div
                  key={idx}
                  style={{
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    padding: "15px",
                    marginBottom: "15px",
                    background: "#fafafa",
                  }}
                >
                  <h4>
                    {plan.name?.charAt(0).toUpperCase() + plan.name?.slice(1)}{" "}
                    <GoCheckCircleFill style={{ color: "green", verticalAlign: "middle" }} />
                  </h4>
                  <p>Number of Cars Allowed: <strong>{plan.numOfCars}</strong></p>
                  <p>Activated On: {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }) : "N/A"}</p>
                  <p>Expiry Date: {plan.expireDate ? new Date(plan.expireDate).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }) : "N/A"}</p>
                </div>
              ))
            ) : (
              <p>No active plans found.</p>
            )}

            <h3 style={{ marginTop: 20, textAlign: "center" }}>Properties Under Plan</h3>
            {planData.propertiesUnderPlan.length > 0 ? (
              <ul>
                {planData.propertiesUnderPlan.map((prop, idx) => (
                  <li key={idx}>PPC ID: {prop.ppcId}, Plan: {prop.planName}</li>
                ))}
              </ul>
            ) : (
              <p>No properties under plan.</p>
            )}

            <h3 style={{ marginTop: 20, textAlign: "center" }}>Properties Without Plan</h3>
            {planData.propertiesWithoutPlan.length > 0 ? (
              <ul>
                {planData.propertiesWithoutPlan.map((prop, idx) => (
                  <li key={idx}>PPC ID: {prop.ppcId}, Plan: {prop.planName}</li>
                ))}
              </ul>
            ) : (
              <p>No properties without plan.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
























