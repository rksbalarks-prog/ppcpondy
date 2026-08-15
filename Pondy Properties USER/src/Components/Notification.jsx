
 



import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft } from "react-icons/fa";
import logo from "../Assets/Sale Property-01.png";
import ConfirmationModal from "./ConfirmationModal";

const READ_NOTIFICATIONS_KEY = "readNotifications";

// Utility functions for localStorage
const getReadNotificationsFromStorage = () => {
  const stored = localStorage.getItem(READ_NOTIFICATIONS_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveReadNotificationToStorage = (id) => {
  const stored = getReadNotificationsFromStorage();
  if (!stored.includes(id)) {
    const updated = [...stored, id];
    localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(updated));
  }
};

const Notification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const storedPhoneNumber = location.state?.phoneNumber || localStorage.getItem("phoneNumber") || "";
  const [userPhoneNumber] = useState(storedPhoneNumber);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [modalShow, setModalShow] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });

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

  
  // Fetch notifications by userPhoneNumber
  const fetchNotifications = async (phoneNumber) => {
    if (!phoneNumber) {
      setError("No phone number found.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/notifications/${phoneNumber}`);
      setNotifications(response.data.notifications);
    } catch (err) {
      setError("Error fetching notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications on mount if phone number is available
  useEffect(() => {
    if (userPhoneNumber) {
      fetchNotifications(userPhoneNumber);
    }
  }, [userPhoneNumber]);


  
useEffect(() => {
  if (message) {
    const timer = setTimeout(() => setMessage(""), 5000); // Auto-close after 3 seconds
    return () => clearTimeout(timer); // Cleanup timer
  }
}, [message]);

  const handlePageNavigation = () => {
    navigate("/mobileviews");
  };

  const fetchAllNotifications = async (phoneNumber) => {
    if (!phoneNumber) {
      setError("No phone number found.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-user-notifications`, {
        params: { phoneNumber },
      });

      let allNotifications = res.data.notifications || [];

      const uniqueMap = new Map();
      allNotifications.forEach((n) => {
        const key = `${n.ppcId}_${n.message}`;
        if (!uniqueMap.has(key)) uniqueMap.set(key, n);
      });

      allNotifications = Array.from(uniqueMap.values());
      allNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const readIds = getReadNotificationsFromStorage();

      const updated = allNotifications.map((n) => ({
        ...n,
        isRead: n.isRead || readIds.includes(n._id),
      }));

      setNotifications(updated);
    } catch (err) {
      setError("Error fetching notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userPhoneNumber) {
      if (showUnreadOnly) {
        // fetchUnreadNotifications(userPhoneNumber);
      } else {
        fetchAllNotifications(userPhoneNumber);
      }
    }
  }, [userPhoneNumber, showUnreadOnly]);



  const handleSingleNotificationClick = async (notificationId, ppcId, message) => {
    try {
      if (!userPhoneNumber) {
        setMessage({ text: "User phone number is missing", type: "error" });
        return;
      }
  
      await axios.put(
        `${process.env.REACT_APP_API_URL}/mark-single-notification-read/${notificationId}`
      );
  
      saveReadNotificationToStorage(notificationId);
  
      setNotifications((prevNotifications) =>
        prevNotifications.map((n) =>
          n._id === notificationId ? { ...n, isRead: true } : n
        )
      );
  
      const lowerMessage = message?.toLowerCase() || "";
  
      if (lowerMessage.includes("matches your property")) {
        navigate(`/matched-buyer/${userPhoneNumber}`);
      } else if (lowerMessage.includes("buyer") && lowerMessage.includes("assistance")) {
        navigate("/buyer-list");
      } else if (ppcId?.startsWith("plan-")) {
        navigate(`/details/${ppcId}`);
      } else if (ppcId) {
        navigate(`/details/${ppcId}`);
      }
  
    } catch (error) {
      setMessage({ text: "Failed to open notification", type: "error" });
    }
  };
  


  const handleDeleteNotification = (createdAt) => {
    setPendingDeleteId(createdAt); // now storing timestamp
    setModalShow(true);
  };
  

  const confirmDelete = async () => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/delete-notification-by-time`,
        {
          data: { createdAt: pendingDeleteId }, // send as body
        }
      );
  
      setNotifications((prev) =>
        prev.filter((n) => n.createdAt !== pendingDeleteId)
      );
      setMessage({ text: "Notification deleted successfully", type: "success" });
    } catch (error) {
      setMessage({ text: "Failed to delete notification", type: "error" });
    } finally {
      setModalShow(false);
      setPendingDeleteId(null);
    }
  };
  

const cancelDelete = () => {
  setModalShow(false);
  setPendingDeleteId(null); // Optional cleanup
};

  return (
    <div className="container d-flex align-items-center justify-content-center p-0">
      <div className="d-flex flex-column align-items-center justify-content-center m-0" 
        style={{ maxWidth: '500px', margin: 'auto', width: '100%' }}>
    


      {/* Header */}
      <div
        className="d-flex align-items-center justify-content-start w-100"
           style={{
        background: "#EFEFEF",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        opacity: isScrolling ? 0 : 1,
        pointerEvents: isScrolling ? "none" : "auto",
        transition: "opacity 0.3s ease-in-out",
      }}
      >
      <button
           onClick={() => navigate(-1)}
           className="pe-5"
           style={{
             backgroundColor: '#f0f0f0',
             border: 'none',
             padding: '10px 20px',
             cursor: 'pointer',
             transition: 'all 0.3s ease-in-out',
             display: 'flex',
             alignItems: 'center',
           }}
           onMouseEnter={(e) => {
             e.currentTarget.style.backgroundColor = '#f0f4f5'; // Change background
             e.currentTarget.querySelector('svg').style.color = '#00B987'; // Change icon color
           }}
           onMouseLeave={(e) => {
             e.currentTarget.style.backgroundColor = '#f0f0f0';
             e.currentTarget.querySelector('svg').style.color = '#30747F';
           }}
         >
           <FaArrowLeft style={{ color: '#30747F', transition: 'color 0.3s ease-in-out' , background:"transparent"}} />
       </button>
        <h3 className="m-0 ms-3" style={{ fontSize: "20px" }}>
          Notifications
        </h3>
      </div>
      <div className="row g-2 w-100">

<div className="d-flex mb-3 pt-1" style={{ gap: "0", width: "100%" }}>
  <button
    style={{
      backgroundColor: !showUnreadOnly ? '#F9FAFC' : 'transparent',
      color: 'black',
      border: !showUnreadOnly ? 'none' : '1px solid #ccc',
      boxShadow: !showUnreadOnly ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
      flex: 1
    }}
    className="btn"
onClick={() => {
  setShowUnreadOnly(false);
  fetchAllNotifications(userPhoneNumber); // Force re-fetch
}}
  >
    Show All Notifications
  </button>

  <button
    style={{
      backgroundColor: showUnreadOnly ? '#F9FAFC' : 'transparent',
      color: 'black',
      border: showUnreadOnly ? 'none' : '1px solid #ccc',
      boxShadow: showUnreadOnly ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
      flex: 1
    }}
    className="btn"
 onClick={() => fetchNotifications(userPhoneNumber)}   >
Admin  </button>

</div>



{message.text && (
  <div style={{
    padding: "10px",
    backgroundColor: message.type === "success" ? "#d4edda" : "#f8d7da",
    color: message.type === "success" ? "#155724" : "#721c24",
    border: `1px solid ${message.type === "success" ? "#c3e6cb" : "#f5c6cb"}`,
    borderRadius: "5px",
    marginBottom: "15px"
  }}>
    {message.text}
  </div>
)}


<ConfirmationModal
  show={modalShow}
  message="Are you sure you want to delete this notification?"
  onConfirm={confirmDelete}
  onCancel={cancelDelete}
/>

      {/* Phone number */}
      {userPhoneNumber ? (
        <p className="text-lg font-medium mb-4">
          Notifications for: <strong>{userPhoneNumber}</strong>
        </p>
      ) : (
        <p className="text-danger">
          No phone number found. Please log in again.
        </p>
      )}
      {error && <p className="text-danger">{error}</p>}

      {/* Notification list */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="container">
          {notifications.length > 0 ? (
            <div className="row">
              {notifications.map((notification) => (


<div
  key={notification._id}
  className="mb-3"
  onClick={() => handleSingleNotificationClick(notification._id, notification.ppcId,notification.message)}

  style={{
    cursor: "pointer",
    borderRadius: "10px",
    position: "relative", // Make this relative to position the close button inside
  }}
>
  <div
    className={`card ${notification.isRead ? "shadow-sm border" : ""}`}
    style={{
      backgroundColor: notification.isRead ? "#F9FAFC" : "#ffffff",
      borderRadius: "10px",
      position: "relative", // Needed for positioning the delete button
    }}
  >
    <div className="card-body d-flex flex-row align-items-center">
      {/* Image */}
      <div className="me-3">
        <img
          src={logo}
          alt="Notification"
          className="rounded-circle"
          style={{ width: "50px", height: "50px" }}
        />
      </div>

      {/* Content */}
      <div className="d-flex flex-grow-1 justify-content-between align-items-start">
        <div>
          {notification.ppcId && (
            <h6 className="mb-1 text-primary">PPC ID: {notification.ppcId}</h6>
          )}
          {notification.type && (
            <p className="mb-1 text-dark">Type: {notification.type}</p>
          )}
          <p className="mb-1 text-secondary">{notification.message}</p>
          <p className="text-muted small mb-1">
            {new Date(notification.createdAt).toLocaleString()}
          </p>
          <h6 className="mb-1 text-primary">
            {notification.isRead ? "🔵 Read" : "🔴 Unread"}
          </h6>
        </div>
      </div>

      {/* X icon */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteNotification(notification.createdAt);

        }}
        className="position-absolute top-0 end-0 m-2 p-1 bg-light border-0 rounded-circle shadow-sm"
        title="Delete notification"
        style={{
          width: "28px",
          height: "28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
          lineHeight: "1",
          color: "#555",
        }}
      >
        &times;
      </button>
    </div>
  </div>


                  </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-4 border shadow-sm">
              <p className="mb-0">No notifications found.</p>
            </div>
          )}
        </div>
      )}
          </div>



    </div>
    </div>
  );
};
export default Notification;


