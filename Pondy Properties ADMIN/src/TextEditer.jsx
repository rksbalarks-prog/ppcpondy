







import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { useSelector } from "react-redux";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const TextEditor = () => {
    const [type, setType] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [allTexts, setAllTexts] = useState([]); // Store all text entries

    // ✅ Fetch all text entries on component mount
    useEffect(() => {
        fetchAllTexts();
    }, []);

    // ✅ Fetch existing text when type changes
    useEffect(() => {
        if (type) {
            fetchText();
        }
    }, [type]);
 
      
    // ✅ Fetch all saved text entries
    const fetchAllTexts = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/get-all-texts`);
            setAllTexts(response.data);
        } catch (error) {
            setAllTexts([]);
        }
    };

    // ✅ Fetch text by type
    const fetchText = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/get-text/${type}`);
            setContent(response.data.content || "");
        } catch (error) {
            setContent("");
        } finally {
            setLoading(false);
        }
    };

    // ✅ Save new text
    const handleSave = async () => {
        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/save-text`, {
                type,
                content: JSON.stringify(content),
            });
            alert("Text saved successfully!");
            fetchAllTexts(); // Refresh text list
        } catch (error) {
            alert("Failed to save text.");
        }
    };

    // ✅ Save or update text
    const handleSaveOrUpdate = async () => {
        if (!type || !content.trim()) {
            alert("Type and content are required.");
            return;
        }

        try {
            setLoading(true);
            await axios.put(`${process.env.REACT_APP_API_URL}/update-text/${type}`, {
                content: JSON.stringify(content),
            });
            alert("Text updated successfully!");
            fetchAllTexts(); // Refresh text list
        } catch (error) {
            alert("Failed to save/update text.");
        } finally {
            setLoading(false);
        }
    };

    // ✅ Delete text
    const handleDelete = async () => {
        if (!type) {
            alert("Type is required for deletion.");
            return;
        }

        if (!window.confirm("Are you sure you want to delete this text?")) return;

        try {
            setLoading(true);
            await axios.delete(`${process.env.REACT_APP_API_URL}/delete-text/${type}`);
            alert("Text deleted successfully.");
            setContent(""); // Clear editor
            fetchAllTexts(); // Refresh text list
        } catch (error) {
            alert("Failed to delete text.");
        } finally {
            setLoading(false);
        }
    };

    

  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);
  
  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");
  
  
   const [allowedRoles, setAllowedRoles] = useState([]);
    
   const fileName = "Text Editer"; // current file
   
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
        <div style={containerStyle}>
            <h2 style={{ textAlign: "center" }}>Text Editor</h2>

            {/* ✅ Dropdown to Select Saved Text Types */}
            <select
                onChange={(e) => setType(e.target.value)}
                value={type}
                style={dropdownStyle}
            >
                <option value="">Select Type</option>
                {allTexts.map((text) => (
                    <option key={text._id} value={text.type}>
                        {text.type}
                    </option>
                ))}
            </select>

            <input 
                type="text" 
                placeholder="Enter type (e.g., contact-us, faq, terms)" 
                value={type} 
                onChange={(e) => setType(e.target.value)} 
                style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
            />

            <ReactQuill value={content} onChange={setContent} style={{ height: "200px", marginBottom: "10px" }} />

            <div className="mt-5" style={{ display: "flex", justifyContent: "space-between" }}>
                <button onClick={handleSave} disabled={loading} style={buttonStyle}>
                    Save
                </button>

                <button onClick={handleSaveOrUpdate} disabled={loading} style={buttonStyle}>
                    Update
                </button>

                <button onClick={handleDelete} disabled={loading} style={{ ...buttonStyle, backgroundColor: "red" }}>
                    {loading ? "Deleting..." : "Delete"}
                </button>
            </div>

 {/* ✅ Display All Saved Text Entries */}
 <div style={{ marginTop: "20px", padding: "10px", borderTop: "2px solid #ddd" }}>
                <h3>All Saved Texts</h3>
                {allTexts.length === 0 ? (
                    <p>No texts found.</p>
                ) : (
                    <ul style={listStyle}>
                        {allTexts.map((text) => (
                            <li key={text._id} style={listItemStyle}>
                                <strong>{text.type}</strong>:{" "}
                                <span dangerouslySetInnerHTML={{ __html: text.content }} />
                            </li>
                        ))}
                    </ul>
                )}
            </div>

        </div>
    );
};

// ✅ Styles
const containerStyle = {
    maxWidth: "600px",
    margin: "auto",
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "8px",
};

const buttonStyle = {
    padding: "10px 20px",
    fontSize: "16px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    backgroundColor: "#007BFF",
    color: "white",
};

const dropdownStyle = {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "4px",
    border: "1px solid #ccc",
};

const listStyle = {
    listStyle: "none",
    padding: 0,
};

const listItemStyle = {
    padding: "10px",
    marginBottom: "5px",
    backgroundColor: "#f9f9f9",
    borderRadius: "4px",
    border: "1px solid #ddd",
};

export default TextEditor;


