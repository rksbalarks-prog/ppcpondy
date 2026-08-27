import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import moment from 'moment';
import { Routes, Route, Router } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from "./Navbar";
import LoginReport from "./LoginReport";
import AdminReport from "./AdminReport";
import PPCStaffReport from "./PPCStaffReport";
import Plan from "./Plan";
import Statistics from "./Statistics";
import AdminNotification from "./AdminNotification";
import PushNotifications from "./PushNotifications";
import AddCar from "./AddCar";
import AdminLog from "./AdminLog";
import AgentCar from "./AgentCar";
import AllCar from "./AllCar";
import ApprovedCar from "./ApprovedCar";
import Area from "./Places/Area";
import AssistPayLater from "./AssistPayLater";
import AssistPayU from "./AssistPayU";
import AssistSubscriber from "./AssistSubscriber";
import BaFreeBills from "./BaFreeBills";
import BaLoanLead from "./BaLoanLead";
import BuyerListInterestTriede from "./BuyerListInterestTriede";
import BuyerListInterest from "./BuyerListInteres";
import BuyersAssistant from "./BuyersAssistant";
import BuyersContacted from "./BuyersContacted";
import BuyersFollowUps from "./BuyersFollowUps";
import BuyersShortlized from "./BuyersShortlized";
import BuyersStatics from "./BuyersStatics";
import CallBackForm from "./CallBackForm";
import CarFollowUps from "./CarFollowUps";
import CarMake from "./CarMake";
import CarStatics from "./CarStatics";
import DownloadHistory from "./DownloadHistory";
import DownloadTracker from "./DownloadTracker";
import City from "./Places/City";
import CustomerCar from "./CustomerCar";
import DailyUsage from "./DailyUsage";
import DealerCar from "./DealerCar";
import Details from "./Details";
import District from "./Places/District";
import DownloadLeads from "./DownloadLeads";
import ExpireCar from "./ExpireCar";
import ExpiredAssistant from "./ExpiredAssistant";
import RemovedBuyerAssistance from "./RemovedBuyerAssistance";
import FreeBills from "./FreeBills";
import FreeCar from "./FreeCar";
import FreeUserLead from "./FreeUserLead";
import Help from "./Help";
import HelpLoanLead from "./HelpLoanLead";
import InsuranceLead from "./InsuranceLead";
import LastViewedCar from "./LastViewedCar";
import Limits from "./Limits";
import MatchedBuyer from "./MatchedBuyer";
import MobileViewLead from "./MobileViewLead";
import MyAccount from "./MyAccount";
import NewCarLead from "./NewCarLead";
import OfferesRaised from "./OfferesRaised";
import PaidBills from "./PaidBills";
import PaidCar from "./PaidCar";
import PayLater from "./PayLater";
import PaymentType from "./PaymentType";
import PayUMoney from "./PayUMoney";
import PendingCar from "./PendingCar";
import PhotoRequest from "./PhotoRequest";
import PreApprovedCar from "./PreApprovedCar";
import PricingInfo from "./PricingInfo";
import PricingInfoDetail from "./PricingInfoDetail";
import BuyerBudgetDetail from "./BuyerBudgetDetail";
import Profile from "./Profile";
import PucBanner from "./PucBanner";
import PucCar from "./PucCar";
import PucNumber from "./PucNumber";
import DetailDailyReport from "./DetailPropertyDailyReport";
import RemovedCar from "./RemovedCar";
import ReportedCar from "./ReportedCar";
import SearchCar from "./SearchCar";
import SearchedData from "./SearchedData";
import State from "./Places/State";
import Subscriber from "./Subscriber";
import TransferAssistant from "./TransferAssistant";
import TRansferFollowUps from "./TRansferFollowUps";
import TucBanner from "./TucBanner";
import UsageStatics from "./UsageStatics";
import UserRolls from "./UserRolls";
import UsersLog from "./UsersLog";
import Roll from "./Roll";
import CarModel from "./CarModel";
import UserList from "./Users/UserList";
import OfficeList from "./Office/OfficeList";
import BuyerPlan from "./BuyerPlans/BuyerPlan";
import PendingAssistant from "./PendingAssistant";
import BaPaidBill from "./BaPaidBill";
import AddPlan from './PricingPlan/AddPlan';
import EditProperty from './EditProperty';
import Detail from './Detail';
import AdminSetForm from './DataAddAdmin/AdminSetForm';
import InterestTables from './Detail/InterestTables';
import AddPropertyList from './AddPropertyList';
import BulkUploadProperty from './BulkUploadProperty';
import AdExpressImport from './AdExpressImport';
import FavoriteTable from './Detail/FavoriteTables';
import FavoriteTables from './Detail/FavoriteTables';
import NeedHelpLeadTable from './HelpLoanLead';
import ContactTables from './Detail/ContactTables';
import SoldOutTables from './Detail/SoldOutTables';
import ReportPropertyTables from './Detail/ReportPropertyTables';
import NeedHelpTables from './Detail/NeedHelpTables';
import FavoriteRemoved from './Detail/ShortListRemovedTable';
import GetBuyerAssistance from './GetBuyerAssistance';
import TextEditor from './TextEditer';
import MatchedPropertyTable from './Detail/MatchedPropertyTable';
import MatchedList from './Detail/MatchedList';
import FeaturedProperty from './FeaturedProperty';
import ViewedProperties from './Detail/ViewedProperty';
import NotificationForm from './NotificationSend';
import ProfileTable from './GetUserProfile';
import GetUserCalledList from './GetUserCalledList';
import AddProps from './AddProps';
import axios from 'axios';
import DeletedProperties from './DeletedProperties';
import PyProperty from './Detail/PyProperty';
import UserViewsTable from './AdminViewsTable';
import CreateFollowUp from './CreateFollowUp';
import FollowUpGetTable from './FollowUpGetTable';
import DeveloperProperty from './DeveloperProperty'; 
import CreateBill from './CreateBill';
import GetBillDatas from './GetBillDatas';
import AddBuyerAssistance from './AddBuyerAssistance';
import ViewBuyerAssistance from './ViewBuyerAssistance';
import EditBill from './EditBill';
import PostedByProperty from './PostedByProperty';
import PromotorProperty from './PromotorProperty';
import BuyerAssistanceActive from './BuyerAssistanceActive';
import SetPPCID from './SetPPCID';
import EditBuyerAssistance from './EditBuyerAssistance';
import AddressTable from './AddressTable';
import CreateBuyerFollowUp from './CreateBuyerFollowUp';
import FollowUpBuyerGetTable from './FollowUpBuyerGetTable';
import GetAllPropertyStatics from './GetAllPropertyStatics';
import GetAllBuyerStatics from './GetAllBuyerStatics';
import GetAllUsageStatics from './GetAllUsageStatics';
import WithOutPropertyUser from './WithOutPropertyUser';
import AllViewsDatas from './AllViewsDatas';
import WithOutUserStatics from './WithOutStatics';
import WithoutProperty30DaysUser from './Without30days';
import WithUsersTable from './WithAllUser';
import LoginDirectVerifyUser from './LoginDirectVerifyUser';
import UploadImages from './UpLoadImagesGroom';
import UpLoadImagesGroom from './UpLoadImagesGroom';
import UpLoadImagesBride from './UploadImagesBride';
import DirectLogoutUsers from './DirectLogoutUsers';
import RemovePlanPhoneNumber from './RemovePlanPhoneNumber';
import PaymentPaidFailed from './PayuDatas/PaymentPaidFailed';
import PaymentPaidSuccess from './PayuDatas/PaymentPaidSuccess';
import PaymentPaidPayNow from './PayuDatas/PaymentPaidPayNow';
import PaymentPaidPayLater from './PayuDatas/PaymentPaidPayLater';
import PayuBuyerPaid from './PayuBuyerPayments/PayuBuyerPaid';
import PayuBuyerPayFailed from './PayuBuyerPayments/PayuBuyerPayFailed';
import CustomerDirectPaid from './PayuDirectPayments/CustomerDirectPaid';
import CustomerDirectFailed from './PayuDirectPayments/CustomerDirectFailed';
import PayuBuyerPaynow from './PayuBuyerPayments/PayuBuyerPaynow';
import PayuBuyerPaylater from './PayuBuyerPayments/PayuBuyerPaylater';
import AllBillsTable from './AllBills';
import CreateBuyerBill from './CreateBuyerBill';
import EditBuyerBill from './EditBuyerBill';
import AllBuyerBills from './AllBuyerBills';
import GroomImageClickTable from './UserClickGroomImages';
import BrideImageClickTable from './UserClickBrideImages';
import LoginUserDatas from './LoginUsersDatas';
import LoginSeparateUser from './LoginSeparateUser';
import SetOnDemandPrice from './ApplyOnDemand';
import AddressRequestsTable from './AllAddressRequests';
import BuyerAssistViewsTable from './BuyerListUserViewed';
import PropertyStatusTable from './ShowAllProperties';
import ContactUseage from './ContactUsage';
import PPCIdStatics from './PPCIdStatics';
import CalledListDatas from './Detail/CalledListDatas';
import AdminPropertyMessages from './SetPropertyMessage';
import SalePropertyViewsUser from './SalePropertyViewsUser';
import UpLoadImagesAds from './UploadAdsImage';
import UpLoadDetailAds from './UploadDetailAds';
import CallExperienceList from './GetCalledExpirence';
import SummaryDashboard from './Subscriber';
import PropertyPaymentDailyReport from './PropertyPaymentDailyReport';
import PointsPlans from './PointsPricing/PointsPlans';
import PointsUsers from './PointsPricing/PointsUsers';
import PointsTransactions from './PointsPricing/PointsTransactions';
import PointsPayLater from './PointsPricing/PointsPayLater';
import PointsPayU from './PointsPricing/PointsPayU';
import PointsSettings from './PointsPricing/PointsSettings';
import PointsRefundRequests from './PointsPricing/PointsRefundRequests';
import OtpNumbers from './OtpNumbers';
import { FollowupProvider } from './contexts/FollowupContext';

const routes = [
  { path: "/loginreport", element: <LoginReport /> }, 
  { path: "/adminreport", element: <AdminReport /> },
  { path: "/ppc-staff-report", element: <PPCStaffReport /> },
  { path: "/plan", element: <AddPlan /> },
  { path: "/buyerplan", element: <BuyerPlan /> },
  { path: "/statistics", element: <Statistics /> },
  { path: "/admin-notification", element: <AdminNotification /> },
  { path: "/push-notifications", element: <PushNotifications /> },
  { path: "/add-car", element: <AddCar /> },
  { path: "/adminlog", element: <AdminLog /> },
  { path: "/agent-car", element: <AgentCar /> },
  { path: "/all-car", element: <AllCar /> },
  { path: "/approved-car", element: <ApprovedCar /> },
  { path: "/assist-pay-later", element: <AssistPayLater /> },
  { path: "/assist-payu-money", element: <AssistPayU /> },
  { path: "/assist-subscriber", element: <AssistSubscriber /> },
  { path: "/ba-free-bills", element: <BaFreeBills /> },
  { path: "/property-loan-lead", element: <BaLoanLead /> },
  { path: "/buyerlist-interest", element: <BuyerListInterest /> },
  { path: "/buyers-assistant", element: <BuyersAssistant /> },
  { path: "/buyers-contacted", element: <BuyersContacted /> },
  { path: "/buyers-follow-ups", element: <BuyersFollowUps /> },
  { path: "/buyers-shortlisted", element: <BuyersShortlized /> },
  { path: "/buyers-statics", element: <BuyersStatics /> },
  { path: "/callback-form", element: <CallBackForm /> },
  { path: "/car-follow-ups", element: <CarFollowUps /> },
  { path: "/car-make", element: <CarMake /> },
  { path: "/carstatics", element: <CarStatics /> },
  { path: "/download-history", element: <DownloadHistory /> },
  { path: "/city", element: <City /> },
  { path: "/customer-car", element: <CustomerCar /> },
  { path: "/daily-usage", element: <DailyUsage /> },
  { path: "/dealer-car", element: <DealerCar /> },
  { path: "/details", element: <Details /> },
  { path: "/district", element: <District /> },
  { path: "/downloadleads", element: <DownloadLeads /> },
  { path: "/expire-car", element: <ExpireCar /> },
  { path: "/expired-assistant", element: <ExpiredAssistant /> },
  { path: "/removed-buyer-assistant", element: <RemovedBuyerAssistance /> },
  { path: "/free-bills", element: <FreeBills /> },
  { path: "/free-car", element: <FreeCar /> },
  { path: "/free-user-lead", element: <FreeUserLead /> },
  { path: "/help", element: <Help /> },
  { path: "/help-loan-lead", element: <HelpLoanLead /> },
  { path: "/ba-loan-lead", element: <InsuranceLead /> },
  { path: "/last-viewed-property", element: <LastViewedCar /> },
  { path: "/limits", element: <Limits /> },
  { path: "/matched-buyer", element: <MatchedBuyer /> },
  { path: "/mobile-view-lead", element: <MobileViewLead /> },
  { path: "/my-account", element: <MyAccount /> },
  { path: "/new-car-lead", element: <NewCarLead /> },
  { path: "/offers-raised", element: <OfferesRaised /> },
  { path: "/paid-bills", element: <PaidBills /> },
  { path: "/paid-car", element: <PaidCar /> },
  { path: "/pay-later", element: <PayLater /> },
  { path: "/paymenttype", element: <PaymentType /> },
  { path: "/pay-u-money", element: <PayUMoney /> },
  { path: "/pending-car", element: <PendingCar /> },
  { path: "/photo-request", element: <PhotoRequest /> },
  { path: "/profile", element: <Profile /> },
  { path: "/puc-banner", element: <PucBanner /> },
  { path: "/puc-car", element: <PucCar /> },
  { path: "/puc-number", element: <PucNumber /> },
  { path: "/detail-daily-report", element: <DetailDailyReport /> },
  { path: "/removed-car", element: <RemovedCar /> },
  { path: "/reported-cars", element: <ReportedCar /> },
  { path: "/searchcar", element: <SearchCar /> },
  { path: "/pricing-info", element: <PricingInfo /> },
  { path: "/pricing-info/:bucket", element: <PricingInfoDetail /> },
  { path: "/buyer-budget-info/:bucket", element: <BuyerBudgetDetail /> },
  { path: "/searched-data", element: <SearchedData /> },
  { path: "/subscriber", element: <Subscriber /> },
  { path: "/transfer-assistant", element: <TransferAssistant /> },
  { path: "/transfer-follow-ups", element: <TRansferFollowUps /> },
  { path: "/tuc-banner", element: <TucBanner /> },
  { path: "/usage-statics", element: <UsageStatics /> },
  { path: "/user-rolls", element: <UserRolls /> },
  { path: "/users", element: <UserList /> },
  { path: "/user-log", element: <UsersLog /> },
  { path: "/office", element: <OfficeList /> },
  { path: "/rolls", element: <Roll /> },
  { path: "/car-model", element: <CarModel /> },
  { path: "/pending-assistant", element: <PendingAssistant /> },
  { path: "/buyers-list-interest-tried", element: <BuyerListInterestTriede /> },
  { path: "/ba-paid-bills", element: <BaPaidBill /> },
  { path: "/preapproved-car", element: <PreApprovedCar /> },
  { path: "/area", element: <Area /> },
  { path: "/state", element: <State /> },
  { path: "/edit-property", element: <EditProperty /> },
  { path: "/detail", element: <Detail /> },
  { path: "/set-property", element: <AdminSetForm /> },
  { path: "/interest-table", element: <InterestTables /> },
  { path: "/favorite-table", element: <FavoriteTables /> },
  { path: "/needhelp-table", element: <NeedHelpTables /> },
  { path: "/contact-table", element: <ContactTables /> },
  { path: "/soldout-table", element: <SoldOutTables /> },
  { path: "/report-property-table", element: <ReportPropertyTables /> },
  { path: "/property-list", element: <AddPropertyList /> },
  { path: "/bulk-upload-property", element: <BulkUploadProperty /> },
  { path: "/adexpress-import", element: <AdExpressImport /> },
  { path: "/get-buyer-assistance", element: <GetBuyerAssistance /> },
  { path: "/text-editor", element: <TextEditor /> },
  { path: "/get-matched-properties", element: <MatchedPropertyTable /> },
  { path: "/matched-property-list", element: <MatchedList /> },
  { path: "/feature-property", element: <FeaturedProperty /> },
  { path: "/viewed-property", element: <ViewedProperties /> },
  { path: "/notification-send", element: <NotificationForm /> },
  { path: "/profile-table", element: <ProfileTable /> },
  { path: "/user-call-list", element: <GetUserCalledList /> },
  { path: "/add-props/:phoneNumber", element: <AddProps /> },
  { path: "/deleted-properties", element: <DeletedProperties /> },
  { path: "/py-properties", element: <PyProperty /> },
  { path: "/featured-properties", element: <FeaturedProperty /> },
  { path: "/admin-views", element: <UserViewsTable /> },
  { path: "/create-followup", element: <CreateFollowUp /> },
  { path: "/favorite-removed", element: <FavoriteRemoved /> },
  { path: "/developer-property", element: <DeveloperProperty /> },
  { path: "/followup-list", element: <FollowUpGetTable /> },
  { path: "/create-bill", element: <CreateBill /> },
  { path: "/bill-datas", element: <GetBillDatas /> },
  { path: "/add-buyer-assistance", element: <AddBuyerAssistance /> },
  { path: "/view-buyer-assistance", element: <ViewBuyerAssistance /> },
  { path: "/edit-bill/:ppcId", element: <EditBill /> },
  { path: "/postby-property", element: <PostedByProperty /> },
  { path: "/promotor-property", element: <PromotorProperty /> },
  { path: "/active-buyer-assistant", element: <BuyerAssistanceActive /> },
  { path: "/set-ppcid", element: <SetPPCID /> },
  { path: "/edit-buyer-assistance", element: <EditBuyerAssistance /> },
  { path: "/fetch-all-address", element: <AddressTable /> },
  { path: "/create-followup-buyer", element: <CreateBuyerFollowUp /> },
  { path: "/followup-list-buyer", element: <FollowUpBuyerGetTable /> },
  { path: "/all-property-statics", element: <GetAllPropertyStatics /> },
  { path: "/all-buyer-statics", element: <GetAllBuyerStatics /> },
  { path: "/all-usage-statics", element: <GetAllUsageStatics /> },
  { path: "/without-property-user", element: <WithOutPropertyUser /> },
    { path: "/all-views-datas", element: <AllViewsDatas /> },
  { path: "/without-all-statics", element: <WithOutUserStatics /> },
  { path: "/without-30-days-user", element: < WithoutProperty30DaysUser /> },
  { path: "/all-user-datas", element: < WithUsersTable /> },
    { path: "/login-direct-user", element: < LoginDirectVerifyUser /> },
    { path: "/upload-images-groom", element: < UpLoadImagesGroom /> },
        { path: "/upload-images-bride", element: < UpLoadImagesBride /> },
    { path: "/logout-direct-user", element: < DirectLogoutUsers /> },
    { path: "/remove-plan-phone", element: < RemovePlanPhoneNumber /> },
    { path: "/payment-failed", element: < PaymentPaidFailed /> },
        { path: "/payment-success", element: < PaymentPaidSuccess /> },
    { path: "/payment-paynow", element: < PaymentPaidPayNow /> },
    { path: "/payment-paylater", element: < PaymentPaidPayLater /> },

  { path: "/payment-failed-buyer", element: < PayuBuyerPayFailed /> },
        { path: "/payment-success-buyer", element: < PayuBuyerPaid /> },
        { path: "/customer-direct-paid", element: <CustomerDirectPaid /> },
        { path: "/customer-direct-failed", element: <CustomerDirectFailed /> },
    { path: "/payment-paynow-buyer", element: < PayuBuyerPaynow /> },
    { path: "/payment-paylater-buyer", element: < PayuBuyerPaylater /> },
    { path: "/all-bills", element: < AllBillsTable /> },
    { path: "/buyer-create-bill", element: < CreateBuyerBill /> },
    { path: "/edit-buyer-bill/:ba_id", element: < EditBuyerBill /> },
    { path: "/all-buyer-bills", element: < AllBuyerBills /> },
        { path: "/call-exprience", element: < CallExperienceList /> },


    { path: "/groom-click-datas", element: < GroomImageClickTable /> },
    { path: "/bride-click-datas", element: < BrideImageClickTable /> },
        { path: "/upload-images-ads", element: < UpLoadImagesAds /> },
                { path: "/upload-images-ads-detail", element: < UpLoadDetailAds /> },


        { path: "/login-user-datas", element: < LoginUserDatas /> },

                { path: "/separate-login-user", element: < LoginSeparateUser /> },
                { path: "/apply-on-demand", element: < SetOnDemandPrice /> },
                { path: "/get-all-address-request", element: < AddressRequestsTable /> },
                { path: "/get-all-buyerlist-viewed", element: < BuyerAssistViewsTable /> },
                { path: "/get-all-property-datas", element: < PropertyStatusTable /> },
                { path: "/contact-usage", element: < ContactUseage /> },
                { path: "/ppcid-statics", element: < PPCIdStatics /> },
                                { path: "/called-list-datas", element: < CalledListDatas /> },
                                { path: "/set-property-message", element: < AdminPropertyMessages /> },

                                { path: "/sale-property", element: < SalePropertyViewsUser /> },
                                { path: "/daily-report", element: < SummaryDashboard /> },
                                { path: "/payment-daily-report", element: < PropertyPaymentDailyReport /> },

  { path: "/points-plans",        element: <PointsPlans /> },
  { path: "/points-users",        element: <PointsUsers /> },
  { path: "/points-transactions", element: <PointsTransactions /> },
  { path: "/points-paylater",     element: <PointsPayLater /> },
  { path: "/points-payu",         element: <PointsPayU /> },
  { path: "/points-settings",     element: <PointsSettings /> },
  { path: "/points-refunds",      element: <PointsRefundRequests /> },

  { path: "/otp-numbers",         element: <OtpNumbers /> },

];


const Dashboard = () => {

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <FollowupProvider>
      <div className="p-2" style={{ background: "#F0F2F5" }}>
        <div className="dashboard-container">
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className="main-content" style={{ background: "#F0F2F5" }}>
            <Navbar toggleSidebar={toggleSidebar} />
            <DownloadTracker />

            <Routes>
              {routes.map((route, index) => (
                <Route key={index} path={route.path} element={route.element} />
              ))}
            </Routes>
          </div>
        </div>
      </div>
    </FollowupProvider>
  );
};

export default Dashboard;








