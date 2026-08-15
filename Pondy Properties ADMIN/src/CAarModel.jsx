

import axios from "axios";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useSelector } from "react-redux";

export default function Plan() {

  
            
  const adminName = useSelector((state) => state.admin.name);
  

  // ✅ Record view on mount
useEffect(() => {
 const recordDashboardView = async () => {
   try {
     await axios.post(`${process.env.REACT_APP_API_URL}/record-view`, {
       userName: adminName,
       viewedFile: "PropertyMode",
       viewTime: moment().format("YYYY-MM-DD HH:mm:ss"), // optional, backend already handles it


     });
   } catch (err) {
   }
 };

 if (adminName) {
   recordDashboardView();
 }
}, [adminName]);
    
    const [plans, setPlans] = useState([
        {
          id: 1,
          planName: "Basic Plan",
          planAmount: "$10",
          planValidity: "1 Month",
          noOfCar: "1",
          featuredValidity: "1 Week",
          createDate: "2024-12-20",
          status: "Active",
        },
        {
          id: 2,
          planName: "Standard Plan",
          planAmount: "$25",
          planValidity: "3 Months",
          noOfCar: "3",
          featuredValidity: "2 Weeks",
          createDate: "2024-11-15",
          status: "Inactive",
        },
        {
          id: 3,
          planName: "Premium Plan",
          planAmount: "$50",
          planValidity: "6 Months",
          noOfCar: "5",
          featuredValidity: "1 Month",
          createDate: "2024-10-10",
          status: "Active",
        },
      ]);
    
      const toggleStatus = (id) => {
        setPlans((prevPlans) =>
          prevPlans.map((plan) =>
            plan.id === id
              ? { ...plan, status: plan.status === "Active" ? "Inactive" : "Active" }
              : plan
          )
        );
      };
    
      const handleEdit = (id) => {
        alert(`Edit Plan ID: ${id}`);
      };
    
      const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this plan?")) {
          setPlans((prevPlans) => prevPlans.filter((plan) => plan.id !== id));
        }
      };
  return (
    <>
     <div className="container mt-4">
      <form>
        <div className="row">
          {/* First Column */}
          <div className="col-md-4">
            <div className="mb-3">
              <label htmlFor="planName" className="form-label">
                Plan Name:
              </label>
              <input
                type="text"
                className="form-control"
                id="planName"
                placeholder="Enter Plan Name"
              />
            </div>
            <div className="mb-3">
              <label htmlFor="planAmount" className="form-label">
                Plan Amount:
              </label>
              <input
                type="number"
                className="form-control"
                id="planAmount"
                placeholder="Enter Plan Amount"
              />
            </div>
            <div className="mb-3">
              <label htmlFor="planValidity" className="form-label">
                Plan Validity:
              </label>
              <input
                type="text"
                className="form-control"
                id="planValidity"
                placeholder="Enter Plan Validity"
              />
            </div>
          </div>

          {/* Second Column */}
          <div className="col-md-4">
            <div className="mb-3">
              <label htmlFor="numOfCars" className="form-label">
                No of Car:
              </label>
              <input
                type="number"
                className="form-control"
                id="numOfCars"
                placeholder="Enter Number of Cars"
              />
            </div>
            <div className="mb-3">
              <label htmlFor="featuredValidity" className="form-label">
                Featured Validity:
              </label>
              <input
                type="text"
                className="form-control"
                id="featuredValidity"
                placeholder="Enter Featured Validity"
              />
            </div>
          </div>

          {/* Third Column */}
          <div className="col-md-4">
            <div className="mb-3">
              <label htmlFor="featuredMaxCar" className="form-label">
                Featured Max Car:
              </label>
              <input
                type="number"
                className="form-control"
                id="featuredMaxCar"
                placeholder="Enter Featured Max Car"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="d-flex justify-content-end mt-3">
          <button type="button" className="btn btn-primary me-2">
            Create Plan
          </button>
          <button type="button" className="btn btn-success">
            Update Plan
          </button>
        </div>
      </form>
    </div>
   <table className="table table-bordered">
      <thead>
        <tr>
          <th scope="col">Sl</th>
          <th scope="col">Plan Name</th>
          <th scope="col">Plan Amount</th>
          <th scope="col">Plan Validity</th>
          <th scope="col">No Of Car</th>
          <th scope="col">Featured Validity</th>
          <th scope="col">Create Date</th>
          <th scope="col">Edit / Delete</th>
          <th scope="col">Status</th>
        </tr>
      </thead>
      <tbody>
        {plans.map((plan, index) => (
          <tr key={plan.id}>
            <th scope="row">{index + 1}</th>
            <td>{plan.planName}</td>
            <td>{plan.planAmount}</td>
            <td>{plan.planValidity}</td>
            <td>{plan.noOfCar}</td>
            <td>{plan.featuredValidity}</td>
            <td>{plan.createDate}</td>
            <td>
              <button
                className="btn btn-sm btn-primary me-2"
                onClick={() => handleEdit(plan.id)}
              >
                <FaEdit />
              </button>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => handleDelete(plan.id)}
              >
                <FaTrash />
              </button>
            </td>
            <td>
              <button
                className={`btn btn-sm ${
                  plan.status === "Active" ? "btn-success" : "btn-secondary"
                }`}
                onClick={() => toggleStatus(plan.id)}
              >
                {plan.status}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </>
  )
}
