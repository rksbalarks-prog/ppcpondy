import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './Users/Login';
import PropertyCard from './Card/PropertyCard';
import AddProperties from './Users/Addproperties';
import MyProperty from './Card/MyProperty';
import Property from './Users/Property';
import AddProp from './Users/AddProp';
import FixedBottomNavigation from './Users/FixedBottomNavigation';
import AddProps from './Users/AddProps';
import BottomNav from './BottomNav';
import { Socket } from 'socket.io-client';
import MobileView from './Components/MoblieViews';
 
export default function Apps() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/mobileviews" element={<MobileView />} />
        <Route path="/add" element={<AddProperties />} />
        <Route path='/card' element={<PropertyCard />} />
        <Route path='/my' element={<MyProperty />} />
        <Route path='/property' element={<Property />} />
        <Route path='/add-form' element={<AddProps />} />
        <Route path='/bottom-nav' element={<FixedBottomNavigation />} />
        <Route path='/socket' element={<Socket />} />


      </Routes>
    </Router>
  );
};

