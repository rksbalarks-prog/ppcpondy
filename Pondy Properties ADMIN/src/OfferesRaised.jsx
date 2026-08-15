

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Table, Container, Button, Modal, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import { MdDeleteForever, MdUndo } from "react-icons/md";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";
import PhoneCell from "./components/PhoneCell";


const OfferesRaised = () => {
  const [offers, setOffers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [updatedPrice, setUpdatedPrice] = useState("");
  const [message, setMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupAction, setPopupAction] = useState(null);
  const navigate = useNavigate();


useEffect(() => {
  if (message) {
    const timer = setTimeout(() => setMessage(""), 5000); // Auto-close after 3 seconds
    return () => clearTimeout(timer); // Cleanup timer
  }
}, [message]);
  
  // New Offer Form State
  const [newOffer, setNewOffer] = useState({
    ppcId: "",
    phoneNumber: "",
    postedUserPhoneNumber: "",
    originalPrice: "",
    price: "",
    status: "pending",
  });

  // Fetch Offers
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/all-offers`);
        setOffers(response.data.offers);
      } catch (error) {
        setMessage("Failed to fetch offers.");
      }
    };
    fetchOffers();
  }, []);

  // Handle Input Change in Form
  const handleInputChange = (e) => {
    setNewOffer({ ...newOffer, [e.target.name]: e.target.value });
  };

  // Submit New Offer
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/offer`, newOffer);
      setOffers([...offers, response.data.offer]);
      setMessage("Offer added successfully!");
      setNewOffer({ ppcId: "", phoneNumber: "", postedUserPhoneNumber: "", originalPrice: "", price: "", status: "pending" });
    } catch (error) {
      setMessage("Failed to add the offer.");
    }
  };
    const [currentPage, setCurrentPage] = useState(1);
  const offersPerPage = 5; // change as needed

  // Calculate indexes for slicing
  const indexOfLastOffer = currentPage * offersPerPage;
  const indexOfFirstOffer = indexOfLastOffer - offersPerPage;
  const currentOffers = offers.slice(indexOfFirstOffer, indexOfLastOffer);

  // Calculate total pages
  const totalPages = Math.ceil(offers.length / offersPerPage);

  // Change page handler
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Update Offer Price
  const handleEdit = (offer) => {
    setSelectedOffer(offer);
    setUpdatedPrice(offer.price);
    setShowModal(true);
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
  const handleUpdate = async () => {
    if (!updatedPrice) {
      setMessage("Please enter a valid price.");
      return;
    }
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/update-offer/${selectedOffer._id}`, {
        price: updatedPrice,
      });
      setOffers((prevOffers) =>
        prevOffers.map((offer) =>
          offer._id === selectedOffer._id ? { ...offer, price: updatedPrice } : offer
        )
      );
      setShowModal(false);
      setMessage("Offer updated successfully!");
    } catch (error) {
      setMessage("Failed to update the offer.");
    }
  };

  // Update Offer Status
  const handleUpdateStatus = async (offer, newStatus) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/update-offer/${offer._id}`, { status: newStatus });
      setOffers((prevOffers) =>
        prevOffers.map((o) => (o._id === offer._id ? { ...o, status: newStatus } : o))
      );
      setMessage(`Offer updated to ${newStatus.toUpperCase()}!`);
    } catch (error) {
      setMessage(`Failed to update status to ${newStatus}.`);
    }
  };

const handleDelete = async (id) => {
  if (window.confirm(`Are you sure you want to delete this offer?`)) {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/delete-offer/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        // Optional: include admin ID if needed
        body: JSON.stringify({ deletedBy: 'adminObjectIdIfAvailable' }),
      });
      const data = await response.json();
      alert(data.message);

      // Update state
      setOffers((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, isDeleted: true } : item
        )
      );
    } catch (error) {
      alert('Failed to delete the offer.');
    }
  }
};

const handleUndoDelete = async (id) => {
  if (window.confirm(`Are you sure you want to undo delete for this offer?`)) {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/undo-delete-offer/${id}`, {
        method: 'PUT',
      });
      const data = await response.json();
      alert(data.message);

      // Update state
      setOffers((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, isDeleted: false } : item
        )
      );
    } catch (error) {
      alert('Failed to undo delete.');
    }
  }
};
const handleDownloadPDF = () => {
  const doc = new jsPDF();
  doc.text("Offers Raised Report", 14, 15);
  autoTable(doc, {
    startY: 20,
    head: [["PPC ID", "Offer Phone", "Posted Phone", "Original Price", "Offer Price", "Status", "Created At"]],
    body: offers.map((offer) => [
      offer.ppcId,
      offer.phoneNumber,
      offer.postedUserPhoneNumber,
      offer.originalPrice,
      offer.price,
      offer.status,
      new Date(offer.createdAt).toLocaleString(),
    ]),
  });
  doc.save("offers_report.pdf");
};

const handleDownloadExcel = () => {
  const worksheetData = offers.map((offer) => ({
    "PPC ID": offer.ppcId,
    "Offer Phone": offer.phoneNumber,
    "Posted Phone": offer.postedUserPhoneNumber,
    "Original Price": offer.originalPrice,
    "Offer Price": offer.price,
    "Status": offer.status,
    "Created At": new Date(offer.createdAt).toLocaleString(),
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Offers");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(blob, "offers.xlsx");
};


  return (
    <Container>


      <h2 className="mt-4">Offer Form</h2>

      {/* New Offer Form */}
      <Form     style={{ 
  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', 
  padding: '20px', 
  backgroundColor: '#fff' 
}} onSubmit={handleSubmit}  className="d-flex flex-row gap-2 align-items-center flex-nowrap">
        <Form.Group className="mb-2">
          <Form.Label>PPC ID</Form.Label>
          <Form.Control type="text" name="ppcId" placeholder="Enter Property PPCID" value={newOffer.ppcId} onChange={handleInputChange} required />
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>Offer Request Phone</Form.Label>
          <Form.Control type="text" name="phoneNumber" placeholder="Enter Offer Request User Phonenumber" value={newOffer.phoneNumber} onChange={handleInputChange} required />
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>Posted User Phone</Form.Label>
          <Form.Control type="text" name="postedUserPhoneNumber" placeholder="Enter Property Posted User PhoneNumber" value={newOffer.postedUserPhoneNumber} onChange={handleInputChange} required />
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>Original Price</Form.Label>
          <Form.Control type="number" placeholder="Enter Property Original Price" name="originalPrice" value={newOffer.originalPrice} onChange={handleInputChange} required />
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>Offer Price</Form.Label>
          <Form.Control type="number" name="price" placeholder="Enter Property Offer Price" value={newOffer.price} onChange={handleInputChange} required />
        </Form.Group>

        <Button type="submit" variant="primary">Submit Offer</Button>
      </Form>

      <div className="mb-3 d-flex gap-2">
  <Button variant="outline-primary" onClick={handleDownloadPDF}>Download PDF</Button>
  <Button variant="outline-success" onClick={handleDownloadExcel}>Download Excel</Button>
             <button className="btn btn-secondary " style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button></div>


      {/* Offers Table */}
      <h2>All Offers</h2>
      <div ref={tableRef}>
      <Table striped bordered hover responsive className="mt-3">
        <thead>
          <tr>
            <th>PPC ID</th>
            <th>Offer Request Phone</th>
            <th>Posted User Phone</th>
            <th>Original Price</th>
            <th>Offered Price</th>
            <th>Status</th>
            <th>Actions</th>
            <th>CreatedAt</th>
            <th>Edit</th>
            <th>Delete / Undo</th>
           </tr>
        </thead>
        <tbody>
          {currentOffers.map((offer) => (
            <tr key={offer._id}>
              <td style={{cursor: "pointer"}}
                      onClick={() =>
                              navigate(`/dashboard/detail`, {
                                state: { ppcId: offer.ppcId, phoneNumber: offer.phoneNumber },
                              })
                            }>{offer.ppcId}</td>
              <td><PhoneCell phone={offer.phoneNumber} type="any" /></td>
              <td><PhoneCell phone={offer.postedUserPhoneNumber} type="any" /></td>
              <td>{offer.originalPrice}</td>
              <td>{offer.price}</td>
              <td>{offer.status}</td>
            
                       
<td>
  {offer.status === "pending" && (
    <>
      <Button
        variant="success"
        size="sm"
        className="me-2"
        onClick={() => handleUpdateStatus(offer, "accept")}
      >
        Accept
      </Button>
      <Button
        variant="danger"
        size="sm"
        onClick={() => handleUpdateStatus(offer, "reject")}
      >
        Reject
      </Button>
    </>
  )}

  {offer.status === "accept" && (
    <>
      <Button
        variant="warning"
        size="sm"
        className="me-2"
        onClick={() => handleUpdateStatus(offer, "pending")}
      >
        Pending
      </Button>
      <Button
        variant="danger"
        size="sm"
        onClick={() => handleUpdateStatus(offer, "reject")}
      >
        Reject
      </Button>
    </>
  )}

  {offer.status === "reject" && (
    <>
      <Button
        variant="secondary"
        size="sm"
        className="me-2"
        onClick={() => handleUpdateStatus(offer, "pending")}
      >
        Pending
      </Button>
      <Button
        variant="success"
        size="sm"
        onClick={() => handleUpdateStatus(offer, "accept")}
      >
        Accept
      </Button>
    </>
  )}
</td>


                <td>{new Date(offer.createdAt).toLocaleString()}</td>
                <td>
                  <Button
                    variant="primary"
                    size="sm"
                    className="me-2"
                    onClick={() => handleEdit(offer)}
                  >
                    Edit
                  </Button>
                 
                </td>


<td>
  {offer.isDeleted ? (
    <button
      className="btn btn-success btn-sm"
      onClick={() => handleUndoDelete(offer._id)}
      title="Undo Delete"
    >
      <MdUndo size={24} />
    </button>
  ) : (
    <button
      className="btn btn-danger btn-sm"
      onClick={() => handleDelete(offer._id)}
      title="Delete"
    >
      <MdDeleteForever size={24} />
    </button>
  )}
</td>
 
            </tr>
          ))}
        </tbody>
      </Table>
      </div>
    <div style={{ marginTop: "10px" }}>
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i + 1}
            onClick={() => paginate(i + 1)}
            style={{
              margin: "0 5px",
              backgroundColor: currentPage === i + 1 ? "#007bff" : "#fff",
              color: currentPage === i + 1 ? "#fff" : "#000",
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>
      {/* Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Offer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Updated Price</Form.Label>
              <Form.Control type="number" value={updatedPrice} onChange={(e) => setUpdatedPrice(e.target.value)} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleUpdate}>Update</Button>
        </Modal.Footer>
      </Modal>
      <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      {message && <p style={{ color: "green", fontWeight: "bold" }}>{message}</p>}
      {showPopup && (
        <div style={{ 
          position: "fixed", 
          top: "60%", 
          left: "60%", 
          transform: "translate(-50%, -50%)", 
          backgroundColor: "white", 
          padding: "20px", 
          boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
          borderRadius: "10px", 
          textAlign: "center" 
        }}>
          <p style={{ marginBottom: "10px" }}>Are you sure you want to proceed?</p>
          <button 
            onClick={() => { popupAction(); }} 
            style={{ marginRight: "10px", padding: "5px 10px", backgroundColor: "green", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>
            Yes
          </button>
          <button 
            onClick={() => setShowPopup(false)} 
            style={{ padding: "5px 10px", backgroundColor: "red", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>
            No
          </button>
        </div>
      )}
    </div>

    </Container>
  );
};

export default OfferesRaised;
