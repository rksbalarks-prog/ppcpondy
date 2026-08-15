 

import React, { useState, useEffect } from 'react';
import App from '../App'
import Nopage from './Nopage'
import Building from './Building'
import MobileViews from './MoblieViews'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
// Microsoft Clarity route tracker (renders nothing; no-op without an ID).
import ClarityTracker from './ClarityTracker'
import AssistantWidget from '../assistant/AssistantWidget'
import Login from './Login'
import AddProps from './AddProps'
import MyProperty from './MyProperty'
import EditForm from './EditForm'
import Details from './Details'
import PricingPlans from './PricingPlans'
import AddPlan from './AddPlan'
import About from './About'
import RefundPolicy from './RefundPolicy'
import PrivacyPolicy from './PrivacyPolicy'
import InterestStatus from './InterestStatus'
import NewProperty from './NewProperty'
import BusinessOpportunity from './BusinessOpportunity'
import OurSupport from './OurSupport'
import AboutMobile from './AboutMobile'
import RefundMobile from './RefundMobile'
import { PhoneNumberProvider } from '../context/PhoneNumberContext'; // Import the context provider
import MyProfile from './MyProfile'
// import CardsDemo from './Detail/InterestOwner'
import MyPlan from './MyPlan'
import ContactedPage from './ContactedPage'
import LeadsCenter from './LeadsCenter'
import MatchedBuyers from './MatchedBuyers'
import MyCalledList from './MyCalledList'
import MyInterestBuyers from './MyInterestBuyers'
import MyPhotoRequest from './MyPhotoRequest'
import MyOffers from './MyOffers'
import MyLastViewProperty from './MyLastViewProperty'
import MySentInterest from './MySentInterest'
import MyShortlistedProperty from './MyShortlistedProperty'
import ShortListedBuyers from './ShortListedBuyers'



import ViewedBuyers from './ViewedBuyers'
import BuyerLists from './BuyerLists'
import BuyerBudgetList from './BuyerBudgetList'
import Owner from './Owner'
import InterestBuyer from './Detail/InterestOwner'
import BuyerInterest from './Detail/BuyerInterest'
import NeedHelpOwner from './Detail/NeedHelpOwner'
import NeedHelpBuyer from './Detail/NeedHelpBuyer'
import ContactBuyer from './Detail/ContactBuyer'
import ContactOwner from './Detail/ContactOwner'
import ReportPropertyOwner from './Detail/ReportPropertyOwner'
import ReportPropertyBuyer from './Detail/ReportPropertyBuyer'
import SoldOutOwner from './Detail/SoldOutOwner'
import SoldOutBuyer from './Detail/SoldOutBuyer'
import FavoriteOwner from './Detail/FavoriteOwner'
import FavoriteBuyer from './Detail/FavoriteBuyer'
import InterestOwner from './Detail/InterestOwner'
import AddProperty from './AddProperty'
import MyProperties from './MyProperties'
import Removedproperty from './RemovedProperty'
import AddPricingPlans from './AddPricingPlans'
import MyPlans from './ExpiredPlans'
import ExpiredPlans from './ExpiredPlans';
import Notification  from './Notification'
import ZeroView from './ZeroView'
import OfferOwner from './Detail/OfferOwner';
import OfferBuyer from './Detail/OfferBuyer';
import ViewedOwner from './Detail/ViewedOwner'
import ViewedBuyer from './Detail/ViewedBuyer'
import PhotoRequestOwner from './Detail/PhotoRequestOwner'
import PhotoRequestBuyer from './Detail/PhotoRequestBuyer'
import FavoriteRemovedBuyer from './Detail/FavoriteRemovedBuyer'
import FavoriteRemovedOwner from './Detail/FavoriteRemovedOwner'
import DetailBuyerAssistance from './DetailBuyerAssistance'
import FeaturedProperty from './FeatureProperty'
import ShippingAndDelivery from './ShipingAndDelivery'
import ContactUs from './ContactUs'
// import NotificationList from './NotificationList'
import MatchedOwner from './Detail/MatchedOwner';
import MatchedBuyer from './Detail/MatchedBuyer'
import BuyerList from './BuyerList';
import PyProperty from './PyProperty';
import TermsAndCondition from './TermsAndCondition'
import TermsAndConditionWeb from './TermsAndConditionWeb'
import ShippingAndDeliveryApp from './ShipingandDeliveryApp'
import AllProperty from './AllProperty';
import LeadsDownload from './LeadsDownload';
import ConfirmationModal from './ConfirmationModal';
import MoreComponent from './MoreComponent';
import DetailProperty from './DetailProperty';
import FAQ from './FAQ';
import PrivacyPolicyWeb from './PrivacyPolicyWeb';
import PropertyAssistance from './BuyerAssistance';
import MyInterestSend from './MyInterestSend';
import FormComponent from './FormComponent';
import CardsComponent from './CardsComponent';
import BuyerListFilter from './BuyerListFilter';
import PropertyAssistanceSearch from './PropertyAssistanceSearch';
import SortProperty from './SortProperty';
import OldDate from './OldDate';
import NewDate from './NewDate';
import LowtoHigh from './LowtoHigh';
import HightoLow from './HightoLow';
import PhotosWith from './PhotosWith';
import NotViewProperty from './NotViewProperty';
import MoreSidebar from './MoreSidebar';
import BuyerAssisBuyer from './Detail/BuyerAssisBuyer';
import TabsPage from './TabsPage';
import EditProperty from './EditProperty';
import DetailBuyerAssis from './DetailBuyerAssis';
import ExpireProperty from './ExprieProperty';
import Mapp from './Mapp';
import PropertyMap from './PropertyMap';
import MostViewedProperty from './MostViwedProperty';
import HouseBelow from './HouseBelow';
import HouseAverage from './HouseAverage';
import LoanProperty from './LoanProperty';
import PropertyLand from './PropertyLand';
import PlotBelow from './PlotBelow';
import DetailBuyerAssistanceInterest from './DetailBuyerAsisInt';
import EditBuyerAssistance from './EditBuyerAssistance';
import BuyerAssistance from './BuyerAssistance';
import WebPricingPlan from './WebPricingPlan';
import Groom from './Groom';
import Bride from './Bride';
import PayUForm from './PayUPayment/PayUForm';
import PaymentSuccess from './PayUPayment/PaymentSuccess';
import PaymentFailure from './PayUPayment/PaymentFailure';
import MyPlanGetDatas from './MyPlanGetDatas';
import PayUBuyerForm from './PayuPaymentBuyer/PayUBuyerForm';
import PaymentSuccessBuyer from './PayuPaymentBuyer/PaymentSuccessBuyer';
import PaymentFailureBuyer from './PayuPaymentBuyer/PaymentFailureBuyer';
import BuyerPlan from './BuyerPlan';
import MyBuyerPlan from './MyBuyerPlan';
import PayuSuccessBuyer from './PayuSuccessBuyer';
import PayuFailureBuyer from './PayuFailureBuyer';
import PayuSuccess from './PayuSuccess';
import PayuFailure from './PayuFailure';
import WebLogin from './WebLogin';
import PropertyWithLocation from './PropertyWithLocation';
import MyBuyerListViewed from './MyBuyerListViewed';
import MyBuyerListViewDetail from './MyBuyerListViewDetail';
import AddressRequestBuyer from './Locationrequest/AddressRequestBuyer';
import AddressRequestOwner from './Locationrequest/AddressRequestOwner';
import AddressEditForm from './AddressEditForm';
import ChennaiProperty from './ChennaiProperty';
import OwnerSidebar from './OwnerSidebar';
import BuyerSidebar from './BuyerSidebar';
import SaleProperty from './SaleProperty';
import PointsPlans from './PointsPlans';
import PointsHistory from './PointsHistory';
import PayUPointsForm from './PayUPointsPayment/PayUPointsForm';
import PaymentSuccessPoints from './PayUPointsPayment/PaymentSuccessPoints';
import PaymentFailurePoints from './PayUPointsPayment/PaymentFailurePoints';



export default function RouterPage() {

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  // Check if the user is authenticated on initial load
  useEffect(() => {
    const storedPhone = localStorage.getItem('phoneNumber');
    if (storedPhone) {
      setPhoneNumber(storedPhone);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (phone) => {
    if (phone) {
      localStorage.setItem('phoneNumber', phone); // Store phone in localStorage
      setPhoneNumber(phone);
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      localStorage.removeItem('phoneNumber'); // Remove if no phone number is entered
    }
  };
  return (
    <BrowserRouter>
    <ClarityTracker />
    <Routes>
    <Route path="/" element={<App />} />
    <Route path="/mobileviews" element={<MobileViews />} />
    {/* City-scoped entry points: /pondicherry => PY, /chennai => CH. Both render
        the same feed; the active base (set on load + by the switcher) decides
        which city's data the backend returns. */}
    <Route path="/pondicherry" element={<MobileViews />} />
    <Route path="/chennai" element={<MobileViews />} />
    <Route path="/login" element={<Login onLogin={handleLogin} />} />
    {/* City-locked login pages: /login/chennai pins the base to Chennai (CH),
        /login/pondicherry to Pondicherry (PY). Same Login component; the city
        picker is hidden and the user only sees that city's data after login. */}
    <Route path="/login/:city" element={<Login onLogin={handleLogin} />} />
    <Route path="/Construction" element={ <Building  /> } />
    <Route path="*" element={<Nopage />} />
    <Route path='/my' element={ <MyProperty  /> } />
        <Route path='/new-property' element={ <NewProperty  /> } />
        <Route path='/add-form' element={<AddProps/>}/>
        <Route path='/edit-form' element={ <EditForm  /> } />
        <Route path='/detail/:ppcId' element={ <Details  /> } />
        <Route path='/plans' element={ <PricingPlans  /> } />
        <Route path='/add-plan' element={ <AddPricingPlans  /> } />
        <Route path='/about' element={<About />} />
        <Route path='/refund-policy' element={< RefundPolicy />} />
        <Route path='/about-mobile' element={<AboutMobile  />} />
        <Route path='/refund-mobile' element={< RefundMobile/>} />
        <Route path='/privacy-policy' element={< PrivacyPolicy/>} />
        <Route path='/interest' element={ <InterestStatus  /> } />
        <Route path='/business' element={< BusinessOpportunity />} />
        <Route path='/our-support' element={< OurSupport  />} />
        <Route path='/my-profile/:phoneNumber' element={ <MyProfile  /> } />
        <Route path='/my-plan' element={ <MyPlan /> } />
        <Route path='/expired-plans' element={< ExpiredPlans  />} />
        <Route path='/pricing-plans' element={< AddPlan  />} />
        <Route path='/shiping-delivery' element={< ShippingAndDelivery  />} />
        <Route path='/contact-web' element={< ContactUs   />} />
         <Route path='/contactus' element={< ContactedPage />} />
        <Route path='/leads' element={< LeadsCenter />} />
        <Route path='/matched-buyers' element={ <MatchedBuyers /> } />
        <Route path='/my-call' element={< MyCalledList  />} />
        <Route path='/my-interest-buyer' element={< MyInterestBuyers/>} />
        <Route path='/my-photo' element={< MyPhotoRequest  />} />
        <Route path='/my-offers' element={< MyOffers />} />
        <Route path='/my-last-property' element={< MyLastViewProperty />} />
        <Route path='/my-sent-interest' element={< MySentInterest />} />
        <Route path='/my-short-property' element={< MyShortlistedProperty />} />
        <Route path='/my-sent-interest' element={< MySentInterest />} />
        <Route path='/shortlist-buyer' element={< ShortListedBuyers />} />
        <Route path='/view-buyers' element={< ViewedBuyers />} />
         <Route path='/buyer-lists' element={< BuyerLists/>} />
        <Route path='/buyer-list' element={< BuyerList/>} />
        <Route path='/buyer-budget-list/:bucket' element={< BuyerBudgetList/>} />
        <Route path='/FormComponent' element={< FormComponent/>} />
        <Route path='/cards' element={< CardsComponent/>} />
        <Route path='/Buyer-List-Filter' element={< BuyerListFilter/>} />
        <Route path='/Property-Assistance-Search/:phoneNumber' element={< PropertyAssistanceSearch/>} />
        <Route path='/Sort-Property' element={< SortProperty/>} />
        <Route path='/sort/old-to-new' element={< OldDate/>} />
        <Route path='/sort/new-to-old' element={< NewDate/>} />
        <Route path='/sort/low-to-high' element={< LowtoHigh/>} />
        <Route path='/sort/high-to-low' element={< HightoLow/>} />
        <Route path='/sort/with-image' element={< PhotosWith/>} />
                <Route path='/sort/with-image' element={< PhotosWith/>} />
                <Route path='/expire-property' element={< ExpireProperty/>} />
                <Route path='/Mapp' element={< Mapp/>} />


                <Route path='/edit-prop' element={< EditProperty/>} />
                <Route path='/address-edit-form' element={< AddressEditForm/>} />


        <Route path='/more' element={< MoreSidebar/>} />
        <Route path='/details/:ppcId' element={< DetailProperty/>} />



 
        <Route path='/owner' element={< Owner />} />
        <Route path='/RefundPolicy' element={< RefundPolicy />} />
        <Route path='/buyer-assistance/:phoneNumber' element={ <BuyerAssistance />} />

        <Route path='/matched-owner/:phoneNumber' element={ <MatchedOwner /> } />
        <Route path='/matched-buyer/:phoneNumber' element={ <MatchedBuyer /> } />
        <Route path='/more-component' element={ <MoreComponent /> } />


        <Route path='/terms-conditions' element={<TermsAndCondition />} />

        <Route path='/terms-conditions-web' element={<TermsAndConditionWeb />} />

        <Route path='/leads' element={<LeadsDownload />} />
        <Route path='/detail-buyer-assis/:ba_id' element={<DetailBuyerAssis />} />

        <Route path='/confirm-model' element={<ConfirmationModal />} />
        <Route path='/Frequently-Asked-Questions' element={<FAQ />} />
        <Route path='/privacy-web' element={<PrivacyPolicyWeb />} />
        <Route path='/add-property/:phoneNumber' element={<AddProperty />} />
        <Route path='/buyer-assis-buyer' element={<BuyerAssisBuyer />} />
        <Route path="/tabs" element={<TabsPage/>} />


        <Route path='/interest-owner/:phoneNumber' element={ <InterestOwner /> } />
        <Route path='/interest-buyer/:phoneNumber' element={ <BuyerInterest /> } />
        <Route path='/help-owner/:phoneNumber' element={ <NeedHelpOwner  /> } />
        <Route path='/help-buyer/:phoneNumber' element={ <NeedHelpBuyer /> } />
        <Route path='/contact-owner/:phoneNumber' element={ <ContactOwner  /> } />
        <Route path='/contact-buyer/:phoneNumber' element={ <ContactBuyer /> } />
        <Route path='/report-property-owner/:phoneNumber' element={ <ReportPropertyOwner /> } />
        <Route path='/report-property-buyer/:phoneNumber' element={ <ReportPropertyBuyer /> } />
        <Route path='/soldout-owner/:phoneNumber' element={ <SoldOutOwner /> } />
        <Route path='/soldout-buyer/:phoneNumber' element={ <SoldOutBuyer /> } />
        <Route path='/favorite-owner/:phoneNumber' element={ <FavoriteOwner /> } />
        <Route path='/favorite-buyer/:phoneNumber' element={ <FavoriteBuyer /> } />
         <Route path='/my-property' element={ <MyProperties  /> } />
        <Route path='/removed-property' element={ <Removedproperty  /> } />
         <Route path='/zero-view' element={ <ZeroView  /> } />
        <Route path='/sort/zero-view' element={ <NotViewProperty  /> } />

 
        <Route path='/favorite-remove-owner/:phoneNumber' element={ <FavoriteRemovedOwner /> } />
        <Route path='/favorite-remove-buyer/:phoneNumber' element={ <FavoriteRemovedBuyer  /> } />
        <Route path='/notification' element={ <Notification  /> } />
        <Route path='/feature-property' element={ <FeaturedProperty  /> } />
        <Route path='/py-property' element={ <PyProperty  /> } />
        <Route path='/all-property' element={ <AllProperty /> } />

   <Route path='/address-request-owner/:phoneNumber' element={ <AddressRequestOwner /> } />
        <Route path='/address-request-buyer/:phoneNumber' element={ <AddressRequestBuyer  /> } />

        <Route path='/offer-owner/:phoneNumber' element={ <OfferOwner /> } />
        <Route path='/offer-buyer/:phoneNumber' element={ <OfferBuyer /> } />
        <Route path='/View-owner/:phoneNumber' element={ <ViewedOwner  /> } />
        <Route path='/view-buyer/:phoneNumber' element={ <ViewedBuyer /> } /> 
        <Route path='/photo-request-owner/:phoneNumber' element={ <PhotoRequestOwner /> } />
        <Route path='/photo-request-buyer/:phoneNumber' element={ <PhotoRequestBuyer  /> } />
        <Route path='/shiping-delivery-app' element={ <ShippingAndDeliveryApp  /> } />
         <Route path='/my-interest-send' element={ <MyInterestSend  /> } />
        <Route path="/detail-buyer-assistance/:ba_id" element={<DetailBuyerAssistance />} />
        <Route path="/property-map" element={<PropertyMap />} />
        <Route path="/most-viewed" element={<MostViewedProperty />} />
         <Route path="/detail-buyer-assis-interest/:ba_id" element={<DetailBuyerAssistanceInterest />} />

  <Route path='/house-below' element={ <HouseBelow /> } />
        <Route path="/house-average" element={<HouseAverage />} />
        <Route path="/loan-property" element={<LoanProperty />} />
        <Route path="/land-property" element={<PropertyLand />} />
        <Route path="/plot-below" element={<PlotBelow />} />
                <Route path="/edit-buyer-assistance" element={<EditBuyerAssistance />} />
<Route path='/Pricing-Plan' element={ <WebPricingPlan /> } />
<Route path='/groom' element={ <Groom /> } />
<Route path='/bride' element={ <Bride /> } />

 <Route path="/payu-form" element={<PayUForm />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-failure" element={<PaymentFailure />} />
                
                   <Route path="/myplan-datas" element={<MyPlanGetDatas />} />
         
              <Route path="/payu-form-buyer" element={<PayUBuyerForm />} />
          <Route path="/payment-success-buyer" element={<PaymentSuccessBuyer />} />
          <Route path="/payment-failure-buyer" element={<PaymentFailureBuyer />} />
          <Route path="/buyer-plan" element={<BuyerPlan />} />
        <Route path='/my-buyer-plan' element={ <MyBuyerPlan /> } />


       <Route path="/payu/success-buyer" element={<PayuSuccessBuyer />} />
          <Route path="/payu/failure-buyer" element={<PayuFailureBuyer />} />
  <Route path="/payu/success" element={<PayuSuccess />} />
          <Route path="/payu/failure" element={<PayuFailure />} />

                    <Route path="/web-login" element={<WebLogin />} />
<Route path='/sort/property-with-location' element={<PropertyWithLocation/>} />
<Route path='/sort/bank-loan' element={<LoanProperty/>} />
<Route path='/sort/house-below-30L' element={<HouseBelow/>} />
<Route path='/sort/house-30L-50L' element={<HouseAverage/>} />
<Route path='/sort/plot-below-15L' element={<PlotBelow/>} />
<Route path='/sort/agricultural-land' element={<PropertyLand/>} />
<Route path='/my-buyer-list-viewed' element={<MyBuyerListViewed/>} />
<Route path='/my-buyer-list-viewed-detail/:ba_id' element={<MyBuyerListViewDetail/>} />
<Route path='/chennai-property' element={<ChennaiProperty/>} />
<Route path='/owner-menu' element={<OwnerSidebar/>} />
<Route path='/buyer-menu' element={<BuyerSidebar/>} />

                                                                <Route path='/sale-property' element={< SaleProperty />} />

        {/* ── Points module routes ───────────────────────────── */}
        <Route path='/points-plans'           element={<PointsPlans />} />
        <Route path='/points-history'         element={<PointsHistory />} />
        <Route path='/payu-points-form'       element={<PayUPointsForm />} />
        <Route path='/points-payment-success' element={<PaymentSuccessPoints />} />
        <Route path='/points-payment-failure' element={<PaymentFailurePoints />} />

    </Routes>

    {/* Mounted OUTSIDE <Routes> so the assistant (and an active voice session)
        survives navigation between pages. Only shown once the user is logged in —
        the backend mints its session token from the stored phone number. */}
    {(isAuthenticated || !!localStorage.getItem('phoneNumber')) && <AssistantWidget />}
    </BrowserRouter>
  )
}


 