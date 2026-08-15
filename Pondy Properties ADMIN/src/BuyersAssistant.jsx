import { useEffect, useState } from "react";
import axios from "axios";
import { Table, Container } from "react-bootstrap";
import moment from "moment";
import { useSelector } from "react-redux";
import PhoneCell from "./components/PhoneCell";

const BuyerAssistance = () => {
  const [buyerRequests, setBuyerRequests] = useState([]);

  
            
  const adminName = useSelector((state) => state.admin.name);
  

  // ✅ Record view on mount
useEffect(() => {
 const recordDashboardView = async () => {
   try {
     await axios.post(`${process.env.REACT_APP_API_URL}/record-view`, {
       userName: adminName,
       viewedFile: "Buyer Assistance",
       viewTime: moment().format("YYYY-MM-DD HH:mm:ss"), // optional, backend already handles it


     });
   } catch (err) {
   }
 };

 if (adminName) {
   recordDashboardView();
 }
}, [adminName]);
    

  useEffect(() => {
    const fetchBuyerAssistance = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/get-buyerAssistance`);
        setBuyerRequests(response.data.data);
      } catch (error) {
      }
    };

    fetchBuyerAssistance(); // Fetch data when component mounts
  }, []);

  return (
    <Container>
      <h2 className="mt-4">Buyer Assistance Requests</h2>
      <Table striped bordered hover responsive className="table-sm align-middle">
                    <thead className="sticky-top">
          <tr>
            <th>ID</th>
            <th>Phone Number</th>
             <th>City</th>
            <th>Area</th>
            <th>Min Price</th>
            <th>Max Price</th>
            <th>Area Unit</th>
            <th>Property Mode</th>
            <th>Payment Type</th>
            <th>Description</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          {buyerRequests.length > 0 ? (
            buyerRequests.map((request) => (
              <tr key={request._id}>
                 <td>{request.ba_id}</td>
                 <td><PhoneCell phone={request.phoneNumber} type="tenant" ba_id={request.ba_id} /></td>
                 <td>{request.city}</td>
                <td>{request.area}</td>
                <td>{request.minPrice}</td>
                <td>{request.maxPrice}</td>
                <td>{request.areaUnit}</td>
                <td>{request.propertyMode}</td>
                <td>{request.paymentType}</td>
                <td>{request.description}</td>
                <td>{new Date(request.createdAt).toLocaleString()}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="11" className="text-center">
                No Buyer Assistance Requests Found.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </Container>
  );
};

export default BuyerAssistance;

