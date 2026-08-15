import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './UserList.css';
import { FaEdit } from 'react-icons/fa';
import { MdDeleteForever } from 'react-icons/md';
import { Table } from 'react-bootstrap';
import PhoneCell from "../components/PhoneCell";

const UserForm = ({ user, existingUsers = [], onSave, onDelete }) => {
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        office: '',
        jobType: '',
        targetWeek: '',
        targetMonth: '',
        mobile: '',
        aadhaarNumber: '',
        userName: '',
        password: '',
        role: ''
    });

    // Inline validation error for the User Name field (duplicate detection).
    const [nameError, setNameError] = useState('');

    // State for dynamic roles
    const [dynamicRoles, setDynamicRoles] = useState([]);
    const [rolesLoading, setRolesLoading] = useState(true);

    // Update formData when user prop is passed (for update scenario)
    useEffect(() => {
        if (user) {
            setFormData(user);
        }
    }, [user]);

    // Fetch dynamic roles from API on component mount
    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/roll-all`);
                setDynamicRoles(res.data.map((r) => r.rollType));
            } catch (err) {
                console.error("Error fetching roles:", err);
            } finally {
                setRolesLoading(false);
            }
        };
        fetchRoles();
    }, []);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: value
        }));

        // Live duplicate-name check: case-insensitive match against the loaded
        // admin list. Skip the user's own current name when editing.
        if (name === 'name') {
            const trimmed = String(value || '').trim().toLowerCase();
            if (!trimmed) {
                setNameError('');
            } else {
                const editingId = user && user._id;
                const clash = (existingUsers || []).some(
                    (u) =>
                        u._id !== editingId &&
                        String(u.name || '').trim().toLowerCase() === trimmed
                );
                setNameError(clash ? 'This user name already exists' : '');
            }
        }
    };
 

     useEffect(() => {
    if (user && user._id) {
      axios.get(`${process.env.REACT_APP_API_URL}/admin/${user._id}`)
        .then(res => {
          const data = res.data;
          setFormData({
            ...data,
            password: data.plainPassword || ''
          });
        })
        .catch(err => console.error('Error fetching user:', err));
    }
  }, [user]);

 

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Final duplicate check before hitting the API (covers the case where the
    // user pasted a name without firing the change handler's match).
    const trimmed = String(formData.name || '').trim().toLowerCase();
    const editingId = user && user._id;
    const clash = (existingUsers || []).some(
      (u) =>
        u._id !== editingId &&
        String(u.name || '').trim().toLowerCase() === trimmed
    );
    if (clash) {
      setNameError('This user name already exists');
      return;
    }

    try {
      if (user && user._id) {
        await axios.post(`${process.env.REACT_APP_API_URL}/admin-updates/${user._id}`, formData);
        alert('User updated successfully!');
      } else {
        await axios.post(`${process.env.REACT_APP_API_URL}/admin-creates`, formData);
        alert('User created successfully!');
      }
      onSave();
    } catch (err) {
      alert('Error saving user');
      console.error(err);
    }
  };

    // Handle user deletion
    const handleDelete = async () => {
        try {
            if (user && window.confirm('Are you sure you want to delete this user?')) {
                await axios.delete(`${process.env.REACT_APP_API_URL}/admin-delete/${user._id}`);
                alert('User deleted successfully!');
                onDelete();
            }
        } catch (err) {
            alert('An error occurred while deleting!');
        }
    };

    return (
        <div>
            <ToastContainer />
            <h2>{user ? 'Update User' : 'Create User'}</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-row">
                    <div className="form-group">
                        <label>User Name: <span className='text-danger'><strong>*</strong></span></label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            style={nameError ? { borderColor: '#D9534F' } : undefined}
                        />
                        {nameError && (
                            <small style={{ color: '#D9534F', display: 'block', marginTop: '4px' }}>
                                {nameError}
                            </small>
                        )}
                    </div>
                    <div className="form-group">
                        <label>Address:</label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                        />
                    </div>    
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Job Type:</label>
                        <select
                            name="jobType"
                            value={formData.jobType}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Job Type</option>
                            <option value="Full-time">Full-time</option>
                            <option value="Part-time">Part-time</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Target Week:</label>
                        <input
                            type="text"
                            name="targetWeek"
                            value={formData.targetWeek}
                            onChange={handleChange}
                        />
                    </div>
                    </div>

                    <div className="form-row">
                    <div className="form-group">
                        <label>Office:</label>
                        <select
                            name="office"
                            value={formData.office}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Office</option>
                            <option value="AUROBINDO">AUROBINDO</option>
                            <option value="SAINT">SAINT</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Target Month:</label>
                        <input
                            type="text"
                            name="targetMonth"
                            value={formData.targetMonth}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                    
                                    <div className="form-row">
                    <div className="form-group">
                        <label>Aadhaar Number: <strong>(Apply 12 digits)</strong> </label>
                        <input
                            type="text"
                            name="aadhaarNumber"
                            value={formData.aadhaarNumber}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Name:</label>
                        <input
                            type="text"
                            name="userName"
                            value={formData.userName}
                            onChange={handleChange}
                        />
                    </div>
                    </div>

                    <div className="form-row">
                    <div className="form-group">
                        <label>Password: <strong>(Min length 6)</strong> <span className='text-danger'><strong>*</strong></span> </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Role: <span className='text-danger'><strong>*</strong></span></label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            required
                            disabled={rolesLoading}
                        >
                           <option value="">
                               {rolesLoading ? 'Loading roles...' : 'Select Roll'}
                           </option>
                            {dynamicRoles.map((role) => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>
                </div>
                   
                  
                      <div className="form-group">
                        <label>Mobile:</label>
                        <input
                            type="text"
                            name="mobile"
                            value={formData.mobile}
                            onChange={handleChange}
                        />
                    </div> 
                <div>
                    <button type="submit" disabled={!!nameError}>{user ? 'Update' : 'Create'} User</button>
                    {user && (
                        <button type="button" onClick={handleDelete}>
                            Delete
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};




const UserList = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);

    // Fetch all users on component mount
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/admin-all`);
                setUsers(response.data);
            } catch (err) {
                alert('Error fetching users!');
            }
        };
        fetchUsers();
    }, []);

    // Handle when user is saved or deleted
    const handleSave = () => {
        setSelectedUser(null);
        // Refetch users after save
        axios.get(`${process.env.REACT_APP_API_URL}/admin-all`).then(response => setUsers(response.data));
    };

    const handleDelete = () => {
        setSelectedUser(null);
        // Refetch users after deletion
        axios.get(`${process.env.REACT_APP_API_URL}/admin-all`).then(response => setUsers(response.data));
    };
  const tableRef = useRef();

  const handlePrint = () => {
    const printContent = tableRef.current.innerHTML;
    const printWindow = window.open("", "", "width=1200,height=800");
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Table</title>
          <style>
            table { border-collapse: collapse; width: 100%; font-size: 12px; }
            th, td { border: 1px solid #000; padding: 6px; text-align: left; }
            th { background: #f0f0f0; }
          </style>
        </head>
        <body>
          <h3>Filtered Users</h3>
          <table>${printContent}</table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };
    return (
        <div>
            <h1 style={{color:"rgb(47,116,127)"}} className='text-center mb-4'>User Management</h1>
            <UserForm user={selectedUser} existingUsers={users} onSave={handleSave} onDelete={handleDelete} />
            <h2>Staff Details</h2>
            <button className="btn btn-secondary mb-3" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
            <div ref={tableRef}>
            <Table striped bordered hover responsive className="table-sm align-middle">
            <thead className="sticky-top">
                    <tr>
                        <th>Sl</th>
                        <th>UserName</th>
                        {/* <th>Bycrpt Password</th> */}
                        <th>Admin Set Password</th>
                        <th>Role</th>
                        <th>Office</th>
                        <th>Mobile Number</th>
                        <th>Edit / Delete</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user, index) => (
                        <tr key={user._id}>
                            <td>{index + 1}</td>
                            <td>{user.name}</td>
                            {/* <td>{user.password}</td> */}
                            <td>{user.plainPassword}</td>
                            <td>{user.role}</td>
                            <td>{user.office}</td>
                            <td><PhoneCell phone={user.mobile} type="any" /></td>
                            <td>
                                <button  className='text-primary' onClick={() => setSelectedUser(user)}><FaEdit /></button>
                                <button  className='text-danger fs-5 ' onClick={async () => {
                                    if (window.confirm('Are you sure?')) {
                                        await axios.delete(`${process.env.REACT_APP_API_URL}/admin-delete/${user._id}`);
                                        toast.success('User deleted successfully!');
                                        setUsers(users.filter(u => u._id !== user._id));
                                    }
                                }}><MdDeleteForever /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
</div>
            {/* Toast container for showing toast messages */}
            <ToastContainer />
        </div>
    );
};

export default UserList;
