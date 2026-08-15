



import React, { useState, useEffect } from "react";
import axios from "axios";
import ppclogo from './Assets/ppclogo.png';
import { useSelector } from 'react-redux';
import { Table } from "react-bootstrap";

const ProfileManager = () => {
  const [formData, setFormData] = useState({
    password: "",
    email: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [editId, setEditId] = useState(null);
  const adminName = useSelector((state) => state.admin.name); // Redux: admin name

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setProfileImage(e.target.files[0]);
  };

  const fetchProfiles = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/all-get-puc-profiles`);
      setProfiles(res.data.data);
    } catch (err) {
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", adminName); // Used for createdBy
    data.append("password", formData.password);
    data.append("email", formData.email);
    if (profileImage) {
      data.append("profileImage", profileImage);
    }

    try {
      if (editId) {
        await axios.put(`${process.env.REACT_APP_API_URL}/update-profile/${editId}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Profile updated successfully!");
      } else {
        await axios.post(`${process.env.REACT_APP_API_URL}/profile`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Profile created successfully!");
      }

      setFormData({ password: "", email: "" });
      setProfileImage(null);
      setEditId(null);
      fetchProfiles();
    } catch (err) {
      alert("Failed to save/update profile.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this profile?")) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/delete-profile/${id}`);
      alert("Profile deleted.");
      fetchProfiles();
    } catch (err) {
      alert("Failed to delete.");
    }
  };

  const handleEdit = (profile) => {
    setFormData({
      password: profile.password,
      email: profile.email,
    });
    setProfileImage(null);
    setEditId(profile._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
      <div style={{ textAlign: "center", marginBottom: "10px" }}>
        <h2>{editId ? "Update Profile" : "Create Profile"}</h2>
        <div>Welcome to your Dashboard, <strong>{adminName}</strong>!</div>
      </div>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <label>Profile Image:</label>
        <input type="file" onChange={handleFileChange} className="form-control" />

        <br />
        <label>Admin (Created By):</label>
        <input type="text" value={adminName} className="form-control" readOnly />

        <br />
        <label>Password:</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className="form-control"
        />

        <br />
        <label>Email:</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="form-control"
        />

        <br />
        <button type="submit" className="btn btn-primary">
          {editId ? "Update Profile" : "Create Profile"}
        </button>
      </form>

      <hr />

      <h3 style={{ marginTop: "40px" }}>All Profiles</h3>
    <Table striped bordered hover responsive className="table-sm align-middle">
                  <thead className="sticky-top">
          <tr>
            <th>PUC Number</th>
            <th>Created By</th>
            <th>Email</th>
            <th>Profile Image</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((profile) => (
            <tr key={profile._id}>
              <td>{profile.pucNumber}</td>
              <td>{profile.name}</td>
              <td>{profile.email}</td>
              <td>
                {profile.profileImage && (
                  <img
                    src={profile.profileImage}
                    alt="Profile"
                    width="50"
                    height="50"
                    style={{ objectFit: "cover" }}
                  />
                )}
              </td>
              <td>
                <button className="btn btn-warning btn-sm" onClick={() => handleEdit(profile)}>
                  Edit
                </button>{" "}
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(profile._id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default ProfileManager;
