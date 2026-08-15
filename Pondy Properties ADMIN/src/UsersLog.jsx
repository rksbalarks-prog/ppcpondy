 

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import moment from 'moment';
import { useSelector } from 'react-redux';
import * as XLSX from 'xlsx';
import { Table } from 'react-bootstrap';

const RecordViewsTable = () => {
  const [views, setViews] = useState([]);
  const [filteredViews, setFilteredViews] = useState([]);
  const [phoneFilter, setPhoneFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);

  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");
  const fileName = "Users Log";

  const [allowedRoles, setAllowedRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (reduxAdminName) localStorage.setItem("adminName", reduxAdminName);
    if (reduxAdminRole) localStorage.setItem("adminRole", reduxAdminRole);
  }, [reduxAdminName, reduxAdminRole]);

  useEffect(() => {
    const recordDashboardView = async () => {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/record-view`, {
          userName: adminName,
          role: adminRole,
          viewedFile: fileName,
          viewTime: moment().format("YYYY-MM-DD HH:mm:ss"),
        });
      } catch {}
    };

    if (adminName && adminRole) recordDashboardView();
  }, [adminName, adminRole]);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-role-permissions`);
        const rolePermissions = res.data.find((perm) => perm.role === adminRole);
        const viewed = rolePermissions?.viewedFiles?.map(f => f.trim()) || [];
        setAllowedRoles(viewed);
      } catch {} finally {
        setLoading(false);
      }
    };

    if (adminRole) fetchPermissions();
  }, [adminRole]);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/get-record-views-user`)
      .then(res => {
        setViews(res.data);
        setFilteredViews(res.data);
      })
      .catch(() => {});
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
  const handleFilter = () => {
    const filtered = views.filter(view => {
      const viewDate = new Date(view.viewTime);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      return (
        (!phoneFilter || view.phoneNumber?.includes(phoneFilter)) &&
        (!start || viewDate >= start) &&
        (!end || viewDate <= end)
      );
    });
    setFilteredViews(filtered);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setPhoneFilter('');
    setStartDate('');
    setEndDate('');
    setFilteredViews(views);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredViews.length / itemsPerPage);
  const paginatedViews = filteredViews.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleExportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredViews);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Views");
    XLSX.writeFile(workbook, "User_View_Records.xlsx");
  };


  if (!allowedRoles.includes(fileName)) {
    return (
      <div className="text-center text-red-500 font-semibold text-lg mt-10">
        Only admin is allowed to view this file.
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">User View Records</h2>

      {/* Filters */}
      <div className="d-flex flex-wrap gap-3 mb-4 p-3 rounded" style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.1)', background: '#fff' }}>
        <input
          type="text"
          placeholder="Search by phone number"
          value={phoneFilter}
          onChange={e => setPhoneFilter(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          className="border p-2 rounded"
        />
        <button style={{background:"blue"}} onClick={handleFilter} className="bg-blue-500 text-white px-4 py-2 rounded">Filter</button>
        <button style={{background:"orange"}} onClick={handleReset} className="bg-red-500 text-white px-4 py-2 rounded">Reset</button>
        <button style={{background:"green"}} onClick={handleExportToExcel} className="bg-yellow-500 text-white px-4 py-2 rounded">Download Excel</button>
              <button className="btn btn-secondary mb-3" style={{background:"tomato"}} onClick={handlePrint}>
  Print
</button></div>

      {/* Table */}
      <div className="overflow-x-auto">
        <div ref={tableRef}>
        <Table striped bordered hover responsive className="table-sm align-middle">
          <thead className="sticky-top">
            <tr>
              <th className="border px-4 py-2 text-left">S.No</th>
              <th className="border px-4 py-2 text-left">Phone Number</th>
              <th className="border px-4 py-2 text-left">Viewed File</th>
              <th className="border px-4 py-2 text-left">View Time</th>
            </tr>
          </thead>
          <tbody>
            {paginatedViews.map((view, index) => (
              <tr key={view._id}>
                <td className="border px-4 py-2">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                <td className="border px-4 py-2">{view.phoneNumber || "N/A"}</td>
                <td className="border px-4 py-2">{view.viewedFile || "N/A"}</td>
                <td className="border px-4 py-2">{moment(view.viewTime).format('YYYY-MM-DD hh:mm A')}</td>
              </tr>
            ))}
            {paginatedViews.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-3">No records found.</td>
              </tr>
            )}
          </tbody>
        </Table>
        </div>
      </div>

      {/* Pagination Controls */}
      {filteredViews.length > 0 && (
        <div className="d-flex justify-content-between align-items-center mt-4">
          <button onClick={handlePrevious} disabled={currentPage === 1} className="btn btn-outline-primary">Previous</button>
          <span>Page {currentPage} of {totalPages}</span>
          <button onClick={handleNext} disabled={currentPage === totalPages} className="btn btn-outline-primary">Next</button>
        </div>
      )}
    </div>
  );
};

export default RecordViewsTable;
