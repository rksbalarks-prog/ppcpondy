 

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';

const AdminPropertyMessages = () => {
  const reduxAdminName = useSelector((state) => state.admin.name);
  const adminName = reduxAdminName || localStorage.getItem("adminName") || 'Admin';

  const [ppcId, setPpcId] = useState('');
  const [enumMessage, setEnumMessage] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isEditMode, setIsEditMode] = useState(false); // ✅ Edit mode toggle

  const enumOptions = [
    '', 'Sold Out', 'Waiting', 'Available', 'Coming Soon', 'Under Process', 'Blocked', 'Other'
  ];

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-property-messages`);
      setMessages(res.data.data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);
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
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ppcId || (!enumMessage && !customMessage)) {
      setMessageText('Please provide PPC ID and either enum or custom message.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ppcId,
        setBy: adminName,
      };
      if (enumMessage) payload.enumMessage = enumMessage;
      if (customMessage) payload.customMessage = customMessage;

      if (isEditMode) {
        // ✅ Update API
        const res = await axios.put(`${process.env.REACT_APP_API_URL}/admin/property-message/${ppcId}`, payload);
        setMessageText(res.data.message);
      } else {
        // ✅ Create API
        const res = await axios.post(`${process.env.REACT_APP_API_URL}/admin/property-message`, payload);
        setMessageText(res.data.message);
      }

      fetchMessages();
      setPpcId('');
      setEnumMessage('');
      setCustomMessage('');
      setIsEditMode(false);
    } catch (err) {
      setMessageText(err.response?.data?.message || 'Error submitting');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (msg) => {
    setPpcId(msg.ppcId);
    setEnumMessage(msg.enumMessage || '');
    setCustomMessage(msg.customMessage || '');
    setIsEditMode(true);
    setMessageText('');
  };

  const handleDelete = async (ppcIdToDelete) => {
    if (!window.confirm(`Are you sure you want to delete message for PPC ID ${ppcIdToDelete}?`)) return;

    try {
      const res = await axios.delete(`${process.env.REACT_APP_API_URL}/admin/property-message/${ppcIdToDelete}`);
      setMessageText(res.data.message);
      fetchMessages();
    } catch (err) {
      setMessageText(err.response?.data?.message || 'Error deleting');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: 'auto' }}>
      <h2>{isEditMode ? 'Edit' : 'Post'} Property Message</h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label>PPC ID: </label>
          <input
            type="number"
            value={ppcId}
            onChange={(e) => setPpcId(e.target.value)}
            required
            disabled={isEditMode} // prevent changing ppcId in edit mode
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Enum Message: </label>
          <select value={enumMessage} onChange={(e) => setEnumMessage(e.target.value)}>
            {enumOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt || '-- Select --'}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Custom Message: </label>
          <input
            type="text"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Type a message if not using dropdown"
            style={{ width: '100%' }}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : isEditMode ? 'Update Message' : 'Post Message'}
        </button>
        {isEditMode && (
          <button
            type="button"
            onClick={() => {
              setIsEditMode(false);
              setPpcId('');
              setEnumMessage('');
              setCustomMessage('');
              setMessageText('');
            }}
            style={{ marginLeft: '10px' }}
          >
            Cancel
          </button>
        )}
      </form>
             <button className="btn btn-secondary mb-3" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button>
      {messageText && <p style={{ color: 'green' }}>{messageText}</p>}

      <h3>All Posted Messages</h3>
     <div ref={tableRef}>
      <table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%', textAlign: 'left' }}>
        <thead>
          <tr>
            <th>PPC ID</th>
            <th>Message</th>
            <th>Type</th>
            <th>Set By</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {messages.map((msg) => (
            <tr key={msg._id}>
              <td>{msg.ppcId}</td>
              <td>{msg.enumMessage || msg.customMessage}</td>
              <td>{msg.enumMessage ? 'Enum' : 'Custom'}</td>
              <td>{msg.setBy}</td>
              <td>{new Date(msg.setAt).toLocaleString()}</td>
              <td>
                <button onClick={() => handleEdit(msg)}>Edit</button>
                <button onClick={() => handleDelete(msg.ppcId)} style={{ marginLeft: '8px', color: 'red' }}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>  
    </div>
  );
};

export default AdminPropertyMessages;
