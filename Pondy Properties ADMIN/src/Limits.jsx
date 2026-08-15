import React, { useEffect, useState } from "react";
import axios from "axios";

const Limits = () => {
  const [plans, setPlans] = useState([]);
  const [editPlanName, setEditPlanName] = useState(null);
  const [editLimitValue, setEditLimitValue] = useState("");

  const [freeUsersLimit, setFreeUsersLimit] = useState("");
  const [paidUsersLimit, setPaidUsersLimit] = useState("");

  // Fetch plans from backend (only not soft deleted)
  const fetchPlans = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-all-plan-limits`);
      setPlans(res.data.plans);
    } catch (err) {
      alert("Failed to load plan limits.");
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // Submit or update limit for a plan
  const submitLimit = async (planName, limitValue, clearInputCallback) => {
    if (!limitValue || Number(limitValue) <= 0) {
      alert("Please enter a valid positive number.");
      return;
    }

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/set-plan-limit`, {
        planName,
        planViewLimitPerDay: Number(limitValue),
      });
      alert(response.data.message);
      fetchPlans();
      clearInputCallback && clearInputCallback("");
      setEditPlanName(null);
      setEditLimitValue("");
    } catch (error) {
      alert("Failed to set limit: " + (error.response?.data?.message || error.message));
    }
  };

  // Permanently delete a plan
  const handlePermanentDelete = async (planName) => {
    if (window.confirm("Are you sure you want to permanently delete this plan?")) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/delete-plan-limit/${planName}`);
        alert("Permanently deleted.");
        fetchPlans();
      } catch {
        alert("Failed to permanently delete.");
      }
    }
  };

  return (
    <div className="container mt-4">
      {/* FREE Users Limit Form */}
      <div className="mb-4">
        <h1 className="h3">Set Daily Limit to FREE Users</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitLimit("FREE", freeUsersLimit, setFreeUsersLimit);
          }}
        >
          <input
            type="number"
            className="form-control mb-2"
            placeholder="Free User Limit"
            value={freeUsersLimit}
            onChange={(e) => setFreeUsersLimit(e.target.value)}
            min="1"
          />
          <button type="submit" className="btn btn-primary">
            Submit
          </button>
        </form>
      </div>

      {/* PAID Users Limit Form */}
      <div className="mb-4">
        <h1 className="h3">Set Daily Limit to PAID Users</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitLimit("PAID", paidUsersLimit, setPaidUsersLimit);
          }}
        >
          <input
            type="number"
            className="form-control mb-2"
            placeholder="Paid User Limit"
            value={paidUsersLimit}
            onChange={(e) => setPaidUsersLimit(e.target.value)}
            min="1"
          />
          <button type="submit" className="btn btn-primary">
            Submit
          </button>
        </form>
      </div>

      {/* Plans Table */}
      <h2 className="mb-4">All Plan Limits</h2>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>S.No</th>
            <th>Plan Name</th>
            <th>Daily View Limit</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {plans.length === 0 && (
            <tr>
              <td colSpan="3" className="text-center">
                No plans found.
              </td>
            </tr>
          )}

          {plans.map((plan,idx) => (
            <tr key={plan._id}>
              <td>{idx+1}</td>
              <td>{plan.planName}</td>
              <td>
                {editPlanName === plan.planName ? (
                  <input
                    type="number"
                    value={editLimitValue}
                    onChange={(e) => setEditLimitValue(e.target.value)}
                    className="form-control"
                    min="1"
                  />
                ) : (
                  plan.planViewLimitPerDay
                )}
              </td>
              <td>
                {editPlanName === plan.planName ? (
                  <>
                    <button
                      className="btn btn-success btn-sm me-2"
                      onClick={() => submitLimit(plan.planName, editLimitValue)}
                    >
                      Save
                    </button>
                    <button
                      className="btn btn-secondary btn-sm me-2"
                      onClick={() => {
                        setEditPlanName(null);
                        setEditLimitValue("");
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn btn-primary btn-sm me-2"
                      onClick={() => {
                        setEditPlanName(plan.planName);
                        setEditLimitValue(plan.planViewLimitPerDay);
                      }}
                      disabled={plan.isDeleted}
                    >
                      Edit
                    </button>

                   
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handlePermanentDelete(plan.planName)}
                    >
                      Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Limits;


 