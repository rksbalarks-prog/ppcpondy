import React, { useEffect, useState } from "react";
import PhoneCell from "./components/PhoneCell";

function UsersViewContactData() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/get-users-viewall-contact-data-30days`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch");
        }
        return res.json();
      })
      .then((data) => {
        setUsers(data.users || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Unknown error");
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading data...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h2>User View & Contact Data (Last 30 Days)</h2>
      <table border="1" cellPadding="5" style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th>Phone Number</th>
            <th>Login Date</th>
            <th>Update Date</th>
            <th>Has Posted Property</th>
            <th>Views Today</th>
            <th>Views Remaining</th>
            <th>Contacts Today</th>
            <th>Contacts Remaining</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.phoneNumber}>
              <td><PhoneCell phone={user.phoneNumber} type="any" /></td>
              <td>{user.loginDate ? new Date(user.loginDate).toLocaleDateString() : "-"}</td>
              <td>{user.updateDate ? new Date(user.updateDate).toLocaleDateString() : "-"}</td>
              <td>{user.hasPostedProperty ? "Yes" : "No"}</td>
              <td>{user.viewsToday}</td>
              <td>{user.viewsRemaining}</td>
              <td>{user.contactsToday}</td>
              <td>{user.contactsRemaining}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UsersViewContactData;

 