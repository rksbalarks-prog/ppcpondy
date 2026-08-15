 

import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import moment from 'moment';
import { useSelector } from 'react-redux';
import { Table, Nav } from 'react-bootstrap';

const AdminReport = () => {
  const [yesterdayData, setYesterdayData] = useState({
    viewedProperties: 0,
    offerRaised: 0,
    sendInterest: 0,
    photoRequest: 0,
    addressRequests: 0,
    calledList: 0,
  });

  const [notificationCounts, setNotificationCounts] = useState({
    sendInterest: 0,
    viewed: 0,
    favorite: 0,
  });

  const [yesterdayProperty, setYesterdayProperty] = useState({
    totalCreated: 0,
    freeProperty: 0,
    paidProperty: 0,
  });

  const [yesterdayLogin, setYesterdayLogin] = useState({
    totalLogin: 0,
    reported: 0,
    unreported: 0,
    owner: 0,
    tenant: 0,
    visitor: 0,
    paid: 0,
    free: 0,
    pending: 0,
  });

  const [paymentData, setPaymentData] = useState({
    payFailed: 0,
    payNow: 0,
    payLater: 0,
    paymentSuccess: 0,
    onlinePayment: 0,
    officeBill: 0,
    totalBill: 0,
  });

  const [followUpData, setFollowUpData] = useState({
    propertyFollowUp: 0,
    tenantFollowUp: 0,
    yesterdayCreated: 0,
    updatedFollowUp: 0,
    paymentFollowUp: 0,
  });

  const [followUpDetails, setFollowUpDetails] = useState({
    yesterdayCreatedList: [],
    updatedFollowUpList: [],
    paymentFollowUpList: [],
  });

  const [activeFollowUpDetail, setActiveFollowUpDetail] = useState(null);
  const [activeTab, setActiveTab] = useState('yesterdayAction');
  const followUpDetailRef = useRef(null);

  const [propertyCount, setPropertyCount] = useState({
    approved: 0,
    preApproved: 0,
    deleted: 0,
    expired: 0,
    pending: 0,
  });

  useEffect(() => {
    const fetchYesterdayData = async () => {
      try {
        const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

        const [viewedRes, offersRes, interestsRes, photoRes, addressRes, calledRes, notifRes, usersRes, propsRes, allPropsRes, paidRes, payFailedRes, payNowRes, payLaterRes, billsRes, followUpRes, followUpBuyerRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/all-viewed-properties`),
          axios.get(`${process.env.REACT_APP_API_URL}/all-offers`),
          axios.get(`${process.env.REACT_APP_API_URL}/buyer-assistance-interests`),
          axios.get(`${process.env.REACT_APP_API_URL}/all-photo-requests`),
          axios.get(`${process.env.REACT_APP_API_URL}/get-address-requests-all`),
          axios.get(`${process.env.REACT_APP_API_URL}/get-all-contact-sent-properties`),
          axios.get(`${process.env.REACT_APP_API_URL}/get-all-notifications`),
          axios.get(`${process.env.REACT_APP_API_URL}/user/alls`),
          axios.get(`${process.env.REACT_APP_API_URL}/fetch-active-users-datas-all`),
          axios.get(`${process.env.REACT_APP_API_URL}/fetch-alls-datas-all`),
          axios.get(`${process.env.REACT_APP_API_URL}/payments/paid`),
          axios.get(`${process.env.REACT_APP_API_URL}/payments/pay-failed`),
          axios.get(`${process.env.REACT_APP_API_URL}/payments/pay-now`),
          axios.get(`${process.env.REACT_APP_API_URL}/payments/pay-later`),
          axios.get(`${process.env.REACT_APP_API_URL}/bills/non-free-with-properties`),
          axios.get(`${process.env.REACT_APP_API_URL}/followup-list`),
          axios.get(`${process.env.REACT_APP_API_URL}/followup-list-buyer`),
        ]);

        const filterByYesterday = (items, dateField) =>
          items.filter(item => moment(item[dateField]).format('YYYY-MM-DD') === yesterday).length;

        setYesterdayData({
          viewedProperties: filterByYesterday(viewedRes.data.viewedProperties || [], 'viewedAt'),
          offerRaised: filterByYesterday(offersRes.data.offers || [], 'createdAt'),
          sendInterest: filterByYesterday(interestsRes.data.data || [], 'createdAt'),
          photoRequest: filterByYesterday(Array.isArray(photoRes.data) ? photoRes.data : [], 'createdAt'),
          addressRequests: filterByYesterday(addressRes.data.requests || [], 'createdAt'),
          calledList: filterByYesterday(calledRes.data.properties || [], 'createdAt'),
        });

        const notifications = notifRes.data.notifications || [];
        const yesterdayNotifications = notifications.filter(
          n => moment(n.createdAt).format('YYYY-MM-DD') === yesterday
        );
        setNotificationCounts({
          sendInterest: yesterdayNotifications.filter(n => n.type === 'send interest').length,
          viewed: yesterdayNotifications.filter(n => n.type === 'viewed').length,
          favorite: yesterdayNotifications.filter(n => n.type === 'favorite').length,
        });

        const allUsers = usersRes.data.data || [];
        const yesterdayUsers = allUsers.filter(
          u => moment(u.loginDate).format('YYYY-MM-DD') === yesterday
        );
        setYesterdayLogin({
          totalLogin: yesterdayUsers.length,
          reported: yesterdayUsers.filter(u => u.status === 'reported').length,
          unreported: yesterdayUsers.filter(u => u.status !== 'reported').length,
          owner: yesterdayUsers.filter(u => u.remarks === 'seller').length,
          tenant: yesterdayUsers.filter(u => u.remarks === 'buyer').length,
          visitor: yesterdayUsers.filter(u => u.remarks === 'visitor').length,
          paid: yesterdayUsers.filter(u => u.conversionStatus === 'paid').length,
          free: yesterdayUsers.filter(u => u.conversionStatus === 'free').length,
          pending: yesterdayUsers.filter(u => !u.conversionStatus || u.conversionStatus === 'pending').length,
        });

        const allProperties = propsRes.data.users || [];
        const yesterdayProperties = allProperties.filter(
          p => moment(p.createdAt).format('YYYY-MM-DD') === yesterday
        );
        setYesterdayProperty({
          totalCreated: yesterdayProperties.length,
          freeProperty: yesterdayProperties.filter(p => (p.planName || '').toLowerCase() === 'free').length,
          paidProperty: yesterdayProperties.filter(p => (p.planName || '') && (p.planName || '').toLowerCase() !== 'free').length,
        });

        const allPropsList = allPropsRes.data.users || [];
        setPropertyCount({
          approved: allPropsList.filter(p => p.status === 'active').length,
          preApproved: allPropsList.filter(p => p.status === 'complete').length,
          deleted: allPropsList.filter(p => p.status === 'delete').length,
          expired: allPropsList.filter(p => p.status === 'expired').length,
          pending: allPropsList.filter(p => p.status === 'pending').length,
        });

        const paidPayments = paidRes.data.payments || [];
        const failedPayments = payFailedRes.data.payments || payFailedRes.data.data || [];
        const payNowPayments = payNowRes.data.payments || payNowRes.data.data || [];
        const payLaterPayments = payLaterRes.data.payments || payLaterRes.data.data || [];
        const paidBills = billsRes.data.data || [];

        const officeBillCount = paidPayments.filter(p => String(p.txnid || '').startsWith('RP')).length;
        const onlinePaymentCount = paidPayments.length;

        setPaymentData({
          payFailed: failedPayments.length,
          payNow: payNowPayments.length,
          payLater: payLaterPayments.length,
          paymentSuccess: onlinePaymentCount,
          onlinePayment: onlinePaymentCount,
          officeBill: officeBillCount,
          totalBill: paidBills.length,
        });

        const propertyFollowUps = followUpRes.data.data || [];
        const tenantFollowUps = followUpBuyerRes.data.data || [];
        const allFollowUps = [...propertyFollowUps, ...tenantFollowUps];

        const yesterdayCreatedList = allFollowUps.filter(f => moment(f.createdAt).format('YYYY-MM-DD') === yesterday);
        const updatedFollowUpList = allFollowUps.filter(f => moment(f.followupDate).format('YYYY-MM-DD') === yesterday);
        const today = moment().format('YYYY-MM-DD');
        const paymentFollowUpList = allFollowUps.filter(f => f.followupType === 'Payment Followup' && moment(f.followupDate).format('YYYY-MM-DD') === today);

        setFollowUpData({
          propertyFollowUp: propertyFollowUps.length,
          tenantFollowUp: tenantFollowUps.length,
          yesterdayCreated: yesterdayCreatedList.length,
          updatedFollowUp: updatedFollowUpList.length,
          paymentFollowUp: paymentFollowUpList.length,
        });

        setFollowUpDetails({
          yesterdayCreatedList,
          updatedFollowUpList,
          paymentFollowUpList,
        });
      } catch (error) {
        console.error("Error fetching yesterday action data:", error);
      }
    };

    fetchYesterdayData();
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
          <h3>Yesterday Action Report</h3>
          <table>${printContent}</table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const reduxAdminName = useSelector((state) => state.admin.name);
  const reduxAdminRole = useSelector((state) => state.admin.role);
  const adminName = reduxAdminName || localStorage.getItem("adminName");
  const adminRole = reduxAdminRole || localStorage.getItem("adminRole");

  const [allowedRoles, setAllowedRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const fileName = "Admin Report";

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
      } catch (err) {
        console.error("Error recording view:", err);
      }
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
      } catch (err) {
        console.error("Error fetching role permissions:", err);
      } finally {
        setLoading(false);
      }
    };
    if (adminRole) fetchPermissions();
  }, [adminRole]);

  if (loading) return <p>Loading...</p>;

  if (!allowedRoles.includes(fileName)) {
    return (
      <div className="text-center text-danger fw-bold mt-4">
        Only admin is allowed to view this file.
      </div>
    );
  }

  const tabs = [
    { key: 'yesterdayAction', label: 'Yesterday Action' },
    { key: 'yesterdayProperty', label: "Yesterday's Property" },
    { key: 'yesterdayLogin', label: 'Yesterday Login' },
    { key: 'propertyCount', label: 'Property Count' },
    { key: 'payments', label: 'Payments' },
    { key: 'followUp', label: 'Follow Up' },
  ];

  const getFollowUpDayStatus = (followupDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const followUpDay = new Date(followupDate);
    followUpDay.setHours(0, 0, 0, 0);
    if (followUpDay.getTime() === today.getTime()) return 'Today';
    return followUpDay < today ? 'Past' : 'Future';
  };

  return (
    <div className="container-fluid px-2 px-md-4 mt-4">
      <h2>Pondy Properties | Admin</h2>
      <p>Welcome to your Dashboard, <strong>{adminName || "Admin"}</strong>!</p>

      <button className="btn btn-secondary mb-3" style={{ background: "tomato" }} onClick={handlePrint}>
        Print
      </button>

      <Nav variant="tabs" className="mb-3 flex-nowrap overflow-auto" style={{ whiteSpace: 'nowrap' }}>
        {tabs.map(tab => (
          <Nav.Item key={tab.key}>
            <Nav.Link
              active={activeTab === tab.key}
              onClick={() => { setActiveTab(tab.key); setActiveFollowUpDetail(null); }}
              style={{ cursor: 'pointer', fontSize: '0.85rem', padding: '8px 12px' }}
            >
              {tab.label}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>

      <div ref={tableRef} className="mt-2">
        {activeTab === 'yesterdayAction' && (
          <Table striped bordered hover responsive className="table-sm align-middle">
            <thead>
              <tr>
                <th>SL NO</th>
                <th>DESCRIPTION</th>
                <th>COUNT</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>1</td><td>Viewed Properties</td><td>{yesterdayData.viewedProperties}</td></tr>
              <tr><td>2</td><td>Offer Raised</td><td>{yesterdayData.offerRaised}</td></tr>
              <tr><td>3</td><td>Send Interest</td><td>{yesterdayData.sendInterest}</td></tr>
              <tr><td>4</td><td>Photo Request</td><td>{yesterdayData.photoRequest}</td></tr>
              <tr><td>5</td><td>Address Requests</td><td>{yesterdayData.addressRequests}</td></tr>
              <tr><td>6</td><td>Called List</td><td>{yesterdayData.calledList}</td></tr>
              <tr><td>7</td><td>Favorite List (Notification)</td><td>{notificationCounts.favorite}</td></tr>
            </tbody>
          </Table>
        )}

        {activeTab === 'yesterdayProperty' && (
          <Table striped bordered hover responsive className="table-sm align-middle">
            <thead>
              <tr>
                <th>SL NO</th>
                <th>DESCRIPTION</th>
                <th>COUNT</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>1</td><td>No. of Property Created</td><td>{yesterdayProperty.totalCreated}</td></tr>
              <tr><td>2</td><td>Free Property</td><td>{yesterdayProperty.freeProperty}</td></tr>
              <tr><td>3</td><td>Paid Property</td><td>{yesterdayProperty.paidProperty}</td></tr>
            </tbody>
          </Table>
        )}

        {activeTab === 'yesterdayLogin' && (
          <Table striped bordered hover responsive className="table-sm align-middle">
            <thead>
              <tr>
                <th>SL NO</th>
                <th>DESCRIPTION</th>
                <th>COUNT</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>1</td><td>Total Login</td><td>{yesterdayLogin.totalLogin}</td></tr>
              <tr><td>2</td><td>Reported</td><td>{yesterdayLogin.reported}</td></tr>
              <tr><td>3</td><td>Unreported</td><td>{yesterdayLogin.unreported}</td></tr>
              <tr><td>4</td><td>Owner</td><td>{yesterdayLogin.owner}</td></tr>
              <tr><td>5</td><td>Tenant</td><td>{yesterdayLogin.tenant}</td></tr>
              <tr><td>6</td><td>Visitor</td><td>{yesterdayLogin.visitor}</td></tr>
              <tr><td>7</td><td>Paid</td><td>{yesterdayLogin.paid}</td></tr>
              <tr><td>8</td><td>Free</td><td>{yesterdayLogin.free}</td></tr>
              <tr><td>9</td><td>Pending</td><td>{yesterdayLogin.pending}</td></tr>
            </tbody>
          </Table>
        )}

        {activeTab === 'propertyCount' && (
          <Table striped bordered hover responsive className="table-sm align-middle">
            <thead>
              <tr>
                <th>SL NO</th>
                <th>DESCRIPTION</th>
                <th>COUNT</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>1</td><td>Approved Property</td><td>{propertyCount.approved}</td></tr>
              <tr><td>2</td><td>Pre Approved Property</td><td>{propertyCount.preApproved}</td></tr>
              <tr><td>3</td><td>Deleted Property</td><td>{propertyCount.deleted}</td></tr>
              <tr><td>4</td><td>Expired Property</td><td>{propertyCount.expired}</td></tr>
              <tr><td>5</td><td>Pending Property</td><td>{propertyCount.pending}</td></tr>
            </tbody>
          </Table>
        )}

        {activeTab === 'payments' && (
          <Table striped bordered hover responsive className="table-sm align-middle">
            <thead>
              <tr>
                <th>SL NO</th>
                <th>DESCRIPTION</th>
                <th>COUNT</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>1</td><td>Payment Success</td><td>{paymentData.paymentSuccess}</td></tr>
              <tr><td>2</td><td>Pay Failed</td><td>{paymentData.payFailed}</td></tr>
              <tr><td>3</td><td>Pay Now</td><td>{paymentData.payNow}</td></tr>
              <tr><td>4</td><td>Pay Later</td><td>{paymentData.payLater}</td></tr>
              <tr><td>5</td><td>Online Payment</td><td>{paymentData.onlinePayment}</td></tr>
              <tr><td>6</td><td>Office Bill</td><td>{paymentData.officeBill}</td></tr>
              <tr><td>7</td><td>Total Bill</td><td>{paymentData.totalBill}</td></tr>
            </tbody>
          </Table>
        )}

        {activeTab === 'followUp' && (
          <>
            <Table striped bordered hover responsive className="table-sm align-middle">
              <thead>
                <tr>
                  <th>SL NO</th>
                  <th>DESCRIPTION</th>
                  <th>COUNT</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>Property Follow Up</td>
                  <td>{followUpData.propertyFollowUp}</td>
                  <td></td>
                </tr>
                <tr>
                  <td>2</td>
                  <td>Tenant Follow Up</td>
                  <td>{followUpData.tenantFollowUp}</td>
                  <td></td>
                </tr>
                <tr>
                  <td>3</td>
                  <td>Yesterday Created Follow Up</td>
                  <td>{followUpData.yesterdayCreated}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => {
                        const val = activeFollowUpDetail === 'yesterdayCreated' ? null : 'yesterdayCreated';
                        setActiveFollowUpDetail(val);
                        if (val) setTimeout(() => followUpDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
                      }}
                    >
                      {activeFollowUpDetail === 'yesterdayCreated' ? 'Hide' : 'Detail'}
                    </button>
                  </td>
                </tr>
                <tr>
                  <td>4</td>
                  <td>Updated Follow Up</td>
                  <td>{followUpData.updatedFollowUp}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => {
                        const val = activeFollowUpDetail === 'updated' ? null : 'updated';
                        setActiveFollowUpDetail(val);
                        if (val) setTimeout(() => followUpDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
                      }}
                    >
                      {activeFollowUpDetail === 'updated' ? 'Hide' : 'Detail'}
                    </button>
                  </td>
                </tr>
                <tr>
                  <td>5</td>
                  <td>Today Payment Follow Up</td>
                  <td>{followUpData.paymentFollowUp}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => {
                        const val = activeFollowUpDetail === 'payment' ? null : 'payment';
                        setActiveFollowUpDetail(val);
                        if (val) setTimeout(() => followUpDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
                      }}
                    >
                      {activeFollowUpDetail === 'payment' ? 'Hide' : 'Detail'}
                    </button>
                  </td>
                </tr>
              </tbody>
            </Table>

            {activeFollowUpDetail && (() => {
              const listMap = {
                yesterdayCreated: followUpDetails.yesterdayCreatedList,
                updated: followUpDetails.updatedFollowUpList,
                payment: followUpDetails.paymentFollowUpList,
              };
              const titleMap = {
                yesterdayCreated: 'Yesterday Created Follow Up Details',
                updated: 'Updated Follow Up Details',
                payment: 'Payment Follow Up Details',
              };
              const list = listMap[activeFollowUpDetail] || [];
              const isUpdated = activeFollowUpDetail === 'updated';

              return (
                <div ref={followUpDetailRef}>
                  <h5 className="mt-3">{titleMap[activeFollowUpDetail]}</h5>
                  <Table striped bordered hover responsive className="table-sm align-middle">
                    <thead>
                      <tr>
                        <th>S.No</th>
                        <th>PPC ID</th>
                        <th>Phone Number</th>
                        <th>Follow-Up Status</th>
                        <th>Follow-Up Type</th>
                        <th>Follow-Up Date</th>
                        <th>Follow-up Day</th>
                        <th>Admin Name</th>
                        <th>{isUpdated ? 'Updated At' : 'Created At'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.length > 0 ? list.map((item, index) => (
                        <tr key={item._id || index}>
                          <td>{index + 1}</td>
                          <td>{item.ppcId || 'N/A'}</td>
                          <td>{item.phoneNumber || '-'}</td>
                          <td>{item.followupStatus || '-'}</td>
                          <td>{item.followupType || '-'}</td>
                          <td>{item.followupDate ? moment(item.followupDate).format('DD-MM-YYYY') : '-'}</td>
                          <td>{item.followupDate ? getFollowUpDayStatus(item.followupDate) : '-'}</td>
                          <td>{item.adminName || '-'}</td>
                          <td>{isUpdated
                            ? (item.updatedAt ? moment(item.updatedAt).format('DD-MM-YYYY HH:mm') : '-')
                            : (item.createdAt ? moment(item.createdAt).format('DD-MM-YYYY HH:mm') : '-')
                          }</td>
                        </tr>
                      )) : (
                        <tr><td colSpan="9" className="text-center">No data found</td></tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminReport;
