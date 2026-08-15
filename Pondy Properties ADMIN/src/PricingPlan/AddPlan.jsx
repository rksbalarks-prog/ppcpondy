


import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './AddPlan.css';
import { FaEdit, FaPrint } from 'react-icons/fa';
import { MdDeleteForever } from 'react-icons/md';
import moment from 'moment';
import { useSelector } from 'react-redux';
import { Table } from 'react-bootstrap';

const AddPlan = () => {
    const [plans, setPlans] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        packageType: '',
        unlimitedAds: false,
        price: '',
        durationDays: '',
        numOfCars: '',
        featuredAds: '',
        featuredMaxCar: '',
        description: '',
        status: 'active',
    });
    const [editingPlanId, setEditingPlanId] = useState(null);

    
         
    const printRef = useRef();    
             
    const handlePrint = () => {
      const printContents = printRef.current.innerHTML;
      const originalContents = document.body.innerHTML;
      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload(); // reload to restore event bindings
  };


    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/plans`);
            setPlans(response.data);
        } catch (error) {
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const createOrUpdatePlan = async () => {
        try {
            if (editingPlanId) {
                await axios.put(`${process.env.REACT_APP_API_URL}/update-plan-data/${editingPlanId}`, formData);
            } else {
                await axios.post(`${process.env.REACT_APP_API_URL}/store-plan`, formData);
            }
            fetchPlans();
            resetForm();
        } catch (error) {
        }
    };

    const handleEdit = (plan) => {
        setFormData(plan);
        setEditingPlanId(plan._id);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${process.env.REACT_APP_API_URL}/delete-plan/${id}`);
            fetchPlans();
        } catch (error) {
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'hide' : 'active';
        try {
            await axios.put(`${process.env.REACT_APP_API_URL}/update-plan/${id}`, { status: newStatus });
            fetchPlans();
        } catch (error) {
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            packageType: '',
            unlimitedAds: false,
            price: '',
            durationDays: '',
            numOfCars: '',
            featuredAds: '',
            featuredMaxCar: '',
            description: '',
            status: 'active',
        });
        setEditingPlanId(null);
    };


    
    
      const reduxAdminName = useSelector((state) => state.admin.name);
      const reduxAdminRole = useSelector((state) => state.admin.role);
      
      const adminName = reduxAdminName || localStorage.getItem("adminName");
      const adminRole = reduxAdminRole || localStorage.getItem("adminRole");
       
       
    return (
        <div className="App">
            <h1 className='mb-5 text-center'>Plan Management</h1>
            <form>
                <div className="form-row">
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Plan Name"
                        required
                    />
                    <input
                        type="text"
                        name="packageType"
                        value={formData.packageType}
                        onChange={handleChange}
                        placeholder="Package Type"
                        required
                    />
                    <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="Price"
                        required
                    />
                     <input
                        type="number"
                        name="durationDays"
                        value={formData.durationDays}
                        onChange={handleChange}
                        placeholder="Duration Days"
                        required
                    />
                </div>

                <div className="form-row">
                    <input
                        type="number"
                        name="numOfCars"
                        value={formData.numOfCars}
                        onChange={handleChange}
                        placeholder="Number of Cars"
                        required
                    />
                    <input
                        type="number"
                        name="featuredAds"
                        value={formData.featuredAds}
                        onChange={handleChange}
                        placeholder="Featured Ads"
                        required
                    />
                     <input
                        type="number"
                        name="featuredMaxCar"
                        value={formData.featuredMaxCar}
                        onChange={handleChange}
                        placeholder="Featured Max Car"
                        required
                    />
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Description"
                    />
                </div>


<div className="form-row">
    <div className="status-container">
        <label>Status: </label>
        <select name="status" value={formData.status} onChange={handleChange}>
            <option value="active">Active</option>
            <option value="hide">Hide</option>
        </select>
    </div>

    <div className="checkbox-container ms-4">
        <label>
            Unlimited Ads:  </label>
            <input
                type="checkbox"
                name="unlimitedAds"
                checked={formData.unlimitedAds}
                onChange={handleChange}
            />
      
    </div>
</div>


                <span>
            <button style={{backgroundColor:"rgb(47,116,127)",color:"white"}} type="button" onClick={createOrUpdatePlan}>
                    {editingPlanId ? 'Update Plan' : 'Create Plan'}
                </button>
                <button type="button" className='ms-3' onClick={resetForm}>Reset Form</button>
                </span>
                 
            </form>

           
            <h2>Plan Details</h2>
                <p>
                                <button className='bg-success text-white' onClick={handlePrint} style={{ marginRight: '10px' }}>
                                    <FaPrint /> Print All
                                </button>
                                {/* <a href="#export">Export All to Excel</a> */}
                            </p>
                  
                        <div className="table-container" ref={printRef}>
              <Table striped bordered hover responsive className="table-sm align-middle">
                            <thead className="sticky-top">
                    <tr>
                        <th>Plan Name</th>
                        <th>Plan Amount</th>
                        <th>Plan Validity</th>
                        <th>Number of Cars</th>
                        <th>Featured Ads</th>
                        <th>Featured Max Car</th>
                        <th>Status</th>
                        <th>Change Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {plans.map((plan) => (
                        <tr key={plan._id}>
                            <td>{plan.name}</td>
                            <td>{plan.price}</td>
                            <td>{plan.durationDays}</td>
                            <td>{plan.numOfCars}</td>
                            <td>{plan.featuredAds}</td>
                            <td>{plan.featuredMaxCar}</td>
                            <td>{plan.status}</td>
                            <td> 
                            <button className="toggle ms-1 bg-success" onClick={() => toggleStatus(plan._id, plan.status)}>
                                    {plan.status === 'active' ? 'Hide' : 'Activate'}
                                </button>
                            </td>
                            <td>
                                <button className='text-primary ' onClick={() => handleEdit(plan)}> <FaEdit /> </button>
                                <button className='text-danger fs-5' onClick={() => handleDelete(plan._id)}><MdDeleteForever /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
            </div>
        </div>
    );
};

export default AddPlan;
