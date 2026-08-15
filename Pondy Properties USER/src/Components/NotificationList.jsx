import React, { useEffect, useState } from "react";
import axios from "axios";
import socket, { registerUser, listenForNotifications } from "../socket";
import { useParams } from "react-router-dom";

const NotificationList = () => {
  const [notifications, setNotifications] = useState([]);
    const { phoneNumber } = useParams();
  

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/notifications/${phoneNumber}`)
      .then(response => setNotifications(response.data))
.catch(() => {});
  }, [phoneNumber]);

  useEffect(() => {
    registerUser(phoneNumber);
    
    listenForNotifications((notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    return () => socket.off("newNotification");
  }, [phoneNumber]);

  return (
    <div className="notification-container">
      <h3>Notifications</h3>
      {notifications.length === 0 ? (
        <p>No new notifications.</p>
      ) : (
        <ul>
          {notifications.map((notif) => (
            <li key={notif._id} style={{ background: notif.isRead ? "#ddd" : "#fff" }}>
              📢 {notif.message} ({notif.type})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationList;
