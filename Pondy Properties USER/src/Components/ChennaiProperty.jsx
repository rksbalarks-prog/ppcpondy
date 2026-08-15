




import { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";

import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import myImage from '../Assets/Rectangle 146.png'; 
import myImage1 from '../Assets/Rectangle 145.png'; 
import pic from '../Assets/Mask Group 3@2x.png'; 
import calendar from '../Assets/Calender-01.png'
import bed from '../Assets/BHK-01.png'
import totalarea from '../Assets/Total Area-01.png'
import postedby from '../Assets/Posted By-01.png'
import indianprice from '../Assets/Indian Rupee-01.png'

import { 
  FaRupeeSign, FaBed, FaCalendarAlt, FaUserAlt, FaRulerCombined,
  FaCamera,
  FaEye
} from "react-icons/fa";
import NoData from "../Assets/OOOPS-No-Data-Found.png";
import { MdOutlineStarOutline } from "react-icons/md";
import maplocation from "../Assets/maplocation.png";

const ChennaiProperty = () => {
    const [imageCounts, setImageCounts] = useState({}); 
  
  const [properties, setProperties] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const location = useLocation();
    const storedPhoneNumber = location.state?.phoneNumber || localStorage.getItem("phoneNumber") || "";
    const [clickedProperties, setclickedProperties] = useState([]);
  
    const [phoneNumber, setPhoneNumber] = useState(storedPhoneNumber);
  useEffect(() => {
    const recordDashboardView = async () => {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/record-views`, {
          phoneNumber: phoneNumber,
          viewedFile: "Py Property",
          viewTime: new Date().toISOString(),
        });
      } catch (err) {
      }
    };
  
    if (phoneNumber) {
      recordDashboardView();
    }
  }, [phoneNumber]);

  const formatIndianNumber = (x) => {
  x = x.toString();
  const lastThree = x.slice(-3);
  const otherNumbers = x.slice(0, -3);
  return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + (otherNumbers ? "," : "") + lastThree;
};

const formatPrice = (price) => {
  price = Number(price);
  if (isNaN(price)) return 'N/A';

  if (price >= 10000000) {
    return (price / 10000000).toFixed(2) + ' Cr';
  } else if (price >= 100000) {
    return (price / 100000).toFixed(2) + ' Lakhs';
  } else {
    return formatIndianNumber(price);
  }
};
 



  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const [pondyRes, featuredRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/fetch-chennai-properties-on-demand`),
          axios.get(`${process.env.REACT_APP_API_URL}/fetch-featured-chennai-properties-on-demand`)
        ]);

        const pondy = pondyRes.data.data || [];
        const featured = featuredRes.data.properties?.map((property) => ({
          ...property,
          isFeatured: true
        })) || [];

        const combined = [...pondy, ...featured];
        const sorted = combined.sort(
          (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
        );

        setProperties(sorted);
        setError("");
      } catch (err) {
        console.error(err);
       } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);


  const handleCardClick = (ppcId, phoneNumber) => {
      if (!clickedProperties.includes(ppcId)) {
    const updatedClickedProperties = [...clickedProperties, ppcId];
    setclickedProperties(updatedClickedProperties);
    localStorage.setItem('clickedProperties', JSON.stringify(updatedClickedProperties));
  }
     navigate(`/detail/${ppcId}`, { state: {phoneNumber } });

  };
useEffect(() => {
  const stored = JSON.parse(localStorage.getItem('clickedProperties')) || [];
  setclickedProperties(stored);
}, []);


  const fetchImageCount = async (ppcId) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/uploads-count`, {
        params: { ppcId },
      });
      return response.data.uploadedImagesCount || 0;
    } catch (error) {
      return 0;
    }
  };
  
       useEffect(() => {
        const fetchAllImageCounts = async () => {
          const counts = {};
          await Promise.all(
            properties.map(async (property) => {
              const count = await fetchImageCount(property.ppcId);
              counts[property.ppcId] = count;
            })
          );
          setImageCounts(counts);
        };
    
        if (properties.length > 0) {
          fetchAllImageCounts();
        }
      }, [properties]);
    
  


  return (
    <Container fluid className="p-0 w-100 d-flex align-items-center justify-content-center ">
      <Row className="g-3 w-100 ">
        <Col lg={12} className="d-flex align-items-center justify-content-center">
      
 
      <div className="w-100">
 
      <div style={{ overflowY: 'auto', fontFamily:"Inter, sans-serif" }}>
      {loading ? (
  <div className="text-center my-4"
    style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 1000
    }}>
    <span className="spinner-border text-primary" role="status" />
    <p className="mt-2">Loading properties...</p>
  </div>
) : properties.length > 0 ? ( 
  properties.map((property) => (
         
          <div 
          key={property._id}
          className="card mb-3 shadow rounded-4"
          style={{ width: '100%', height: 'auto', background: '#F9F9F9', overflow:'hidden' }}
          onClick={() => handleCardClick(property.ppcId, property.phoneNumber)}
        >
           <div className="row g-0 align-items-stretch">
<div className="col-md-4 col-4 d-flex flex-column align-items-center">

<div style={{ position: "relative", width: "100%",height: '100%', }}>
{property.isFeatured && (
  <span
    className="m-0 ps-1 pe-2"
    style={{
      position: "absolute",
      top: "0px",
      right: "0px",
      fontSize: "12px",
      background: "linear-gradient(to right,rgba(255, 200, 0, 0.91),rgb(251, 182, 6))",
      color: "black",
      cursor: "pointer",
      borderRadius: "0px 0px 0px 15px",
      zIndex: 2,
    }}
  >
    <MdOutlineStarOutline /> Featured
  </span>
)}

{/* Image */}
      <img
  src={
    property.photos && property.photos.length > 0
      ? `https://ppcpondy.com/PPC/${property.photos[0].replace(/\\/g, "/").replace(/^\/+/, "")}`
      : "https://d17r9yv50dox9q.cloudfront.net/car_gallery/default.jpg"
  }
  alt={(
    `${property.ppcId || 'N/A'}-${property.propertyMode || 'N/A'}-${property.propertyType || 'N/A'}-rs-${property.price || '0'}
    -in-${property.city || ''}-${property.area || ''}-${property.state || ''}`
  )
    .replace(/\s+/g, "-")
    .replace(/,+/g, "-")
    .toLowerCase()
  }
  className="img-fluid"
  style={{
    objectFit: "cover",
    objectPosition: "center",
    width: "100%",
    height: "160px",
    borderRadius: "15px",
  }}
/>

  


 <div
style={{
position: "absolute",
bottom: "0px",
width: "100%",
display: "flex",
justifyContent: "space-between",
}}
>
                             
<span className="d-flex justify-content-center align-items-center" style={{ color:'#fff', background:`url(${myImage}) no-repeat center center`, backgroundSize:"cover" ,fontSize:'12px', width:'50px' }}>
          <FaCamera className="me-1"/> {imageCounts[property.ppcId] || 0}
          </span>
          <span className="d-flex justify-content-center align-items-center" style={{ color:'#fff', background:`url(${myImage1}) no-repeat center center`, backgroundSize:"cover" ,fontSize:'12px', width:'50px' }}>
          <FaEye className="me-1" />{property.views}
          </span>
</div>
</div>
</div>
         <div className="col-md-8 col-8 " style={{paddingLeft:"10px", paddingTop:"7px" , background: clickedProperties.includes(property.ppcId) ? "#ffffff" : "#F9F9F9",}}>
            <div className="d-flex justify-content-between"><p className="m-0" style={{ color:'#5E5E5E' , fontWeight:500 , fontSize:"13px"}}>{property.propertyMode
  ? property.propertyMode.charAt(0).toUpperCase() + property.propertyMode.slice(1)
  : 'N/A'} 
</p>  <p className="m-0 pe-5">{property.locationCoordinates ? <img src={maplocation} alt="" width={15} /> : ""}</p>
          </div>
         <p className="fw-bold m-0 " style={{ color:clickedProperties.includes(property.ppcId) ? "#F76F00" : "#000000", fontSize:"15px" }}>{property.propertyType 
  ? property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1) 
  : 'N/A'}
</p>
   <p
  className="m-0"
  style={{ color: "#5E5E5E", fontWeight: 500, fontSize: "13px" }}
>
  {(() => {
    const locs = [ property.nagar, property.area, property.city, property.district, property.state ]
      .filter((v) => v !== null && v !== undefined && v !== "");

    if (locs.length === 0) {
       return <>N/A, N/A</>;
    }

     return locs.slice(0, 3).map((val, idx, arr) => (
      <span key={idx}>
                 {val.charAt(0).toUpperCase() + val.slice(1).toLowerCase()}

        {idx < arr.length - 1 ? ", " : ""}
      </span>
    ));
  })()}
</p>
           <div className="card-body ps-2 m-0 pt-0 pe-2 pb-0 d-flex flex-column justify-content-center">
             <div className="row">
               <div className="col-6 d-flex align-items-center mt-1 mb-1 ps-1">
                  <img src={totalarea} alt="" width={12} className="me-2"/>
                 <span style={{ fontSize:'13px', color:'#5E5E5E' , fontWeight:500 }}>{property.totalArea || 'N/A'} {property.areaUnit
  ? property.areaUnit.charAt(0).toUpperCase() + property.areaUnit.slice(1)
  : 'N/A'}

                  
                 </span>
               </div>
               <div className="col-6 d-flex align-items-center mt-1 mb-1 ps-1 pe-1">
                 <img src={bed} alt="" width={12} className="me-2"/>
                 <span style={{ fontSize:'13px', color:'#5E5E5E' ,fontWeight: 500 }}>{property.bedrooms || 'N/A'} BHK</span>
               </div>
               <div className="col-6 d-flex align-items-center mt-1 mb-1 ps-1 pe-1">
                  <img src={postedby} alt="" width={12} className="me-2"/>
                 <span style={{ fontSize:'13px', color:'#5E5E5E' ,fontWeight: 500 }}>
                 {property.ownership
  ? property.ownership.charAt(0).toUpperCase() + property.ownership.slice(1)
  : 'N/A'}
                 </span>
               </div>
       

                                       <div className="col-6 d-flex align-items-center mt-1 mb-1 ps-1 pe-1">
                 <img src={calendar} alt="" width={12} className="me-2" />
                 <span style={{ fontSize:'13px', color:'#5E5E5E', fontWeight: 500 }}>
                   {
                     property.updatedAt && property.updatedAt !== property.createdAt
                       ? ` ${new Date(property.updatedAt).toLocaleDateString('en-IN', {
                           year: 'numeric',
                           month: 'short',
                           day: 'numeric'
                         })}`
                       : ` ${new Date(property.createdAt).toLocaleDateString('en-IN', {
                           year: 'numeric',
                           month: 'short',
                           day: 'numeric'
                         })}`
                   }
                 </span>
               </div>
               <div className="col-12 d-flex flex-col align-items-center mt-1 mb-1 ps-1">
                <h6 className="m-0">
  


<span
  style={{
    fontSize: '15px',
    color: property.price === 'On Demand' ? '#8C3C2F' : '#2F747F', 
    fontWeight: 600,
    letterSpacing: '1px',
  }}
>
   <img src={indianprice} alt="" width={8} className="me-2" />
  {typeof property.price === 'string' && property.price === 'On Demand'
    ? 'On Demand'
    : property.price
      ? formatPrice(property.price)
      : 'N/A'}
</span>

                <span style={{ color:'#2F747F', marginLeft:"5px",fontSize:'11px',}}> 
                {property.negotiation === 'Yes' ? 'Negotiable' : 'Non-Negotiable'}                </span> 
                  </h6>
               </div>
              </div>
            </div>
          </div>
</div>

        </div>
        )) ) : (
          <div className="text-center my-4 "
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
        
          }}>
        <img src={NoData} alt="" width={100}/>      
        <p>No properties found.</p>
        </div>              )}
      </div>
      </div>
      </Col>
      </Row>
      </Container>
  );
};

export default ChennaiProperty;