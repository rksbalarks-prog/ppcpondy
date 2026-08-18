

import React from 'react'
import BannerCarousel from './Components/BannerCarousel'
import Ads from './Components/Ads'
import FrontFooter from './Components/FrontFooter'
import Header from './Components/Header'
import Carousel from './Components/Carousel';
import Login from './Components/Login';
import WebLogin from './Components/WebLogin'
import SeoHeading from './Components/SeoHeading'


export default function App() {
  return (
    <>
    {/* The page is all carousels and cards, so the only <h1> a crawler can
        find is this one. Visually hidden, semantically the page's subject. */}
    <SeoHeading>
      Buy, Sell and Rent Property in Pondicherry and Chennai
    </SeoHeading>
    <Header />
    <BannerCarousel />
     <div className="container-fluid ps-5 pe-4">
      <div className="row">
        {/* Main Content */}
         <div className="col-12 col-md-9" style={{fontFamily:"Inter, sans-serif", fontWeight:'Medium'}}>
 <div className='mt-3 mb-3'>
                  <WebLogin />

</div>

          <Carousel />
          
          </div>
        {/* Sidebar */}
        <div className="d-none d-md-block col-md-3 mt-3 p-0 ">
          <Ads />
          </div>
      </div>
    </div>
    <FrontFooter/>
    </>
  )
}
