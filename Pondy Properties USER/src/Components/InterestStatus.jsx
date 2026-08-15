import React, { useEffect, useState } from "react";
import axios from "axios";

const InterestStatus = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

    // Fetch the interest status data when the component mounts
    useEffect(() => {
      const fetchInterestStatus = async () => {
        try {
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/fetch-status-interest-all`);
          setUsers(response.data.users);
        } catch (error) {
          setError("Error fetching interest status data");
        } finally {
          setLoading(false);
        }
      };
    
      fetchInterestStatus();
    }, []);
    

    
  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }
  

  return (
    <div>
      <h3>Interest Status Users</h3>
      {users.length === 0 ? (
        <p>No users with interest status found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Phone Number</th>
              <th>Status</th>
              <th>PPC ID</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.phoneNumber}</td>
                <td>{user.status}</td>
                <td>{user.ppcId}</td> {/* Displaying the ppcId */}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default InterestStatus;
