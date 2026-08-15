






import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './BuyerPlan.css';
import { FaEdit, FaPrint } from 'react-icons/fa';
import { MdDeleteForever } from 'react-icons/md';
import moment from 'moment';
import { useSelector } from 'react-redux';
import { Table } from 'react-bootstrap';

const BuyerForm = ({ plan, onSave }) => {
  const [formData, setFormData] = useState({
    planName: '',
    planAmount: '',
    planValidity: '',
    numberOfAssistants: '',
    serviceType: '',
    status: 'active',
  });

  const [message,setMessage]=useState('');
  
  useEffect(() => {
    if (plan) {
      setFormData(plan);
    }
  }, [plan]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (plan) {
        await axios.put(`${process.env.REACT_APP_API_URL}/buyer-update-plans/${plan._id}`, formData);
       setMessage('Buyer Plan updated successfully!');
      } else {
        await axios.post(`${process.env.REACT_APP_API_URL}/buyer-plan-create`, formData);
        setMessage('Buyer Plan created successfully!');
      }
      onSave();
    } catch (error) {
      setMessage('Failed to save plan!');
    }
  };

 

const reduxAdminName = useSelector((state) => state.admin.name);
const reduxAdminRole = useSelector((state) => state.admin.role);

const adminName = reduxAdminName || localStorage.getItem("adminName");
const adminRole = reduxAdminRole || localStorage.getItem("adminRole");


 const [allowedRoles, setAllowedRoles] = useState([]);
 const [loading, setLoading] = useState(true);
 
 const fileName = "BuyerPlan"; // current file
 
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
     }
   };
 
   if (adminName && adminRole) {
     recordDashboardView();
   }
 }, [adminName, adminRole]);
 
 // Fetch role-based permissions
 useEffect(() => {
   const fetchPermissions = async () => {
     try {
       const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-role-permissions`);
       const rolePermissions = res.data.find((perm) => perm.role === adminRole);
       const viewed = rolePermissions?.viewedFiles?.map(f => f.trim()) || [];
       setAllowedRoles(viewed);
     } catch (err) {
     } finally {
       setLoading(false);
     }
   };
 
   if (adminRole) {
     fetchPermissions();
   }
 }, [adminRole]);
 

 if (loading) return <p>Loading...</p>;

 if (!allowedRoles.includes(fileName)) {
   return (
     <div className="text-center text-red-500 font-semibold text-lg mt-10">
       Only admin is allowed to view this file.
     </div>
   );
 }
 
 

  return (
    <div>
      <p>{message}</p>
      <h2 className='text-center mb-4'>
        {plan ? 'Update Plan' : 'Create Plan'}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Plan Name:</label>
            <input
              type="text"
              name="planName"
              value={formData.planName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Plan Amount:</label>
            <input
              type="text"
              name="planAmount"
              value={formData.planAmount}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Plan Validity:</label>
            <input
              type="text"
              name="planValidity"
              value={formData.planValidity}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Number of Assistants:</label>
            <input
              type="text"
              name="numberOfAssistants"
              value={formData.numberOfAssistants}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <div className="form-row w-50">
          <div className="form-group">
            <label>Service Type:</label>
            <input
              type="text"
              name="serviceType"
              value={formData.serviceType}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <button className='w-25' type="submit">
          {plan ? 'Update Plan' : 'Create Plan'}
        </button>
      </form>
    </div>
  );
};



const BuyerList = () => {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);

  
         
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
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/buyer-plans-all`);
      setPlans(response.data);
    } catch (error) {
      toast.error('Failed to fetch plans!');
    }
  };

  const handleDelete = async (id) => {
    try {
      if (window.confirm('Are you sure you want to delete this plan?')) {
        await axios.delete(`${process.env.REACT_APP_API_URL}/buyer-plans/${id}`);
        toast.success('Plan deleted successfully!');
        fetchPlans();
      }
    } catch (error) {
      toast.error('Failed to delete plan!');
    }
  };

  const handleSave = () => {
    setSelectedPlan(null);
    fetchPlans();
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'hide' : 'active';
      await axios.put(`${process.env.REACT_APP_API_URL}/buyer-plans/${id}/status`, { status: newStatus });
      toast.success(`Plan ${newStatus === 'active' ? 'activated' : 'hidden'} successfully!`);
      fetchPlans();
    } catch (error) {
      toast.error('Failed to update plan status!');
    }
  };

  return (
    <div>
      <BuyerForm plan={selectedPlan} onSave={handleSave} />
      <h3>Plan Details</h3>
           <p>
                          <button className='bg-primary text-white' onClick={handlePrint} style={{ marginRight: '10px' }}>
                              <FaPrint /> Print All
                          </button>
                          {/* <a href="#export">Export All to Excel</a> */}
                      </p>
            
                  <div className="table-container" ref={printRef}>
                  <Table striped bordered hover responsive className="table-sm align-middle">
                  <thead className="sticky-top">
          <tr>
            <th>SL</th>
            <th>Plan Name</th>
            <th>Amount</th>
            <th>Validity</th>
            <th>Number of Assistants</th>
             <th>Status</th>
            <th>Change Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((plan, index) => (
            <tr key={plan._id}>
              <td>{index + 1}</td>
              <td>{plan.planName}</td>
              <td>{plan.planAmount}</td>
              <td>{plan.planValidity}</td>
              <td>{plan.numberOfAssistants}</td>
               <td>{plan.status}</td>
              <td>
              <button className='toggle ms-1 bg-success' onClick={() => toggleStatus(plan._id, plan.status)}>
                  {plan.status === 'active' ? 'Hide' : 'Activate'}
                </button>
              </td>
              <td>      
                <button className='text-primary' onClick={() => setSelectedPlan(plan)}><FaEdit /></button>
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

export default BuyerList;

