
import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import imge1 from '../Assets/myaccountmore.png';
import imge2 from '../Assets/sellermore.png';
import imge3 from '../Assets/buyermore.png';
import more2 from '../Assets/bottom.png';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft } from 'react-icons/fa';
import rangoli from '../Assets/rangoi.png';


// MenuLink Component
const MenuLink = ({ to, label , count }) => (
    <Link to={to} style={{ textDecoration: "none" }}>
        <li className="list-group-item d-flex justify-content-between align-items-center custom-list-item">
            <div className="d-flex align-items-center">
            <span style={{fontSize:"14px"}}>{label}</span>        
                </div>
            {count !== undefined && count !== null && ( // This moves to the right
                <span className="badge bg-success rounded-pill">{count}</span>
            )}        </li>
    </Link>
);

const MoreSidebar = ({ phoneNumber }) => {
    const [activeTab, setActiveTab] = useState('myAccount');
      const [loading, setLoading] = useState(false);
    

    const handleTabClick = (tabName) => {
        setActiveTab(tabName);
    };

    const navigate = useNavigate();
    const [error, setError] = useState(null);
 const [propertyCount, setPropertyCount] = useState(0);

    const [buyerViewedCount, setBuyerViewedCount] = useState(0);
      const [interestBuyersCount, setInterestBuyersCount] = useState(0);
      const [helpRequestsCount, setHelpRequestsCount] = useState(0);
      const [contactBuyerCount, setContactBuyerCount] = useState(0);

      const [reportRequestsCount, setReportRequestsCount] = useState(0);
      const [soldOutRequestsCount, setSoldOutRequestsCount] = useState(0);
      const [favoriteRequestsCount, setFavoriteRequestsCount] = useState(0);

        const [mostViewedCount, setMostViewedCount] = useState(0);
      
  const [buyerCount, setBuyerCount] = useState(0);

      const [photoRequestsCount, setPhotoRequestsCount] = useState(0);
      const [matchedPropertiesCount, setMatchedPropertiesCount] = useState(0);
      const [offersCount, setOffersCount] = useState(0);
      const [ownerOfferCount, setOwnerOfferCount] = useState(0);
      const [ownerPhotoRequestCount, setOwnerPhotoRequestCount] = useState(0);
      const [ownerMatchedPropertyCount, setOwnerMatchedPropertyCount] = useState(0);
      const [favoriteCount, setFavoriteCount] = useState(0);
const [favoriteOwnerCount, setFavoriteOwnerCount] = useState(0);
const [favoriteRemovedOwnerCount, setFavoriteRemovedOwnerCount] = useState(0);
const [reportPropertyOwnersCount, setReportPropertyOwnersCount] = useState(0);
const [contactOwnersCount, setContactOwnersCount] = useState(0);
const [helpOwnersCount, setHelpOwnersCount] = useState(0);
const [interestOwnersCount, setInterestOwnersCount] = useState(0);
const [viewedPropertiesCount, setViewedPropertiesCount] = useState(0);

const [totalPlansCount, setTotalPlansCount] = useState(0);

const [userCount, setUserCount] = useState(0);

const [deleteCount,setDeleteCount]= useState(0);

const [notificationCount, setNotificationCount] = useState(0);
const [notificationUserCount, setNotificationUserCount] = useState(0);

  const [planCount, setPlanCount] = useState(0);

  const [callUserCount, setCallUserCount] = useState(0);
  const [buyerAssistanceInterestCount, setBuyerAssistanceInterestCount] = useState(0);
  const [viewCountLast10Days, setViewCountLast10Days] = useState(0);


  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    let scrollTimeout;

    const handleScroll = () => {
      setIsScrolling(true);

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 150); // Adjust the delay as needed
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      clearTimeout(scrollTimeout);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  useEffect(() => {
    const fetchViewCountLast10Days = async () => {
      if (!phoneNumber) return;

      try {
        const { data } = await axios.get(
          `${process.env.REACT_APP_API_URL}/user-view-count/${phoneNumber}`
        );
        setViewCountLast10Days(data.viewCount);
      } catch (error) {
        // setError("Failed to fetch view count");
      }
    };

    fetchViewCountLast10Days();
  }, [phoneNumber]);

  useEffect(() => {
    const fetchBuyerAssistance = async () => {
        try {
          const res = await axios.get(`${process.env.REACT_APP_API_URL}/count-buyerAssistance/${phoneNumber}`);
          setBuyerCount(res.data?.count || 0); // Default to 0 if count is undefined
        } catch (err) {
          setBuyerCount(0); // Set to 0 in case of error
        }
      };

    fetchBuyerAssistance();
  }, [phoneNumber]);

  
  useEffect(() => {
    const fetchPropertyCount = async () => {
      try {
        const { data } = await axios.get(
          `${process.env.REACT_APP_API_URL}/get-property-count-by-phone?phoneNumber=${phoneNumber}`
        );
        setPropertyCount(data.propertyCount); // ✅ Use correct field name from backend
      } catch (err) {
      }
    };

    if (phoneNumber) {
      fetchPropertyCount();
    }
  }, [phoneNumber]);
  useEffect(() => {
    const fetchBuyerAssistanceInterestCount = async () => {
        if (!phoneNumber) return;

        try {
            const { data } = await axios.get(
                `${process.env.REACT_APP_API_URL}/buyer-assistance-interests-phone/count`,
                {
                    params: { phone: phoneNumber },
                }
            );
            setBuyerAssistanceInterestCount(data.count);
        } catch (error) {
        }
    };

    fetchBuyerAssistanceInterestCount();
}, [phoneNumber]);

useEffect(() => {
  const fetchMostViewedCount = async () => {
    try {
      const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/get-most-viewed-properties-count?phoneNumber=${phoneNumber}`);
      setMostViewedCount(data.mostViewedPropertiesCount);
    } catch (err) {
    }
  };

  if (phoneNumber) {
    fetchMostViewedCount();
  }
}, [phoneNumber]);

useEffect(() => {
    const fetchHelpOwnersCount = async () => {
        if (!phoneNumber) return;

        try {
            const { data } = await axios.get(
                `${process.env.REACT_APP_API_URL}/get-help-as-owner-count?phoneNumber=${phoneNumber}`
            );
            setHelpOwnersCount(data.helpPropertiesCount);  // ✅ corrected
        } catch (error) {
        }
    };

    fetchHelpOwnersCount();
}, [phoneNumber]);



  useEffect(() => {
    const fetchCallUserCount = async () => {
      if (!phoneNumber) return;

      try {
        const { data } = await axios.get(
          `${process.env.REACT_APP_API_URL}/user-call/property-owner/${phoneNumber}/count`
        );
        setCallUserCount(data.count);
      } catch (err) {
        setError('Error fetching call user count');
      }
    };

    fetchCallUserCount();
  }, [phoneNumber]);


  useEffect(() => {
    const fetchNotificationUserCount = async () => {
      if (!phoneNumber) return;
  
      try {
        const { data } = await axios.get(
          `${process.env.REACT_APP_API_URL}/notification-user-count?phoneNumber=${phoneNumber}`
        );
        setNotificationUserCount(data.count);
      } catch (error) {
        setError("Error fetching notification count");
      }
    };
  
    fetchNotificationUserCount();
  }, [phoneNumber]);
  

  useEffect(() => {

    const fetchPlanCount = async () => {
      if (!phoneNumber) return;

      try {
        const { data } = await axios.get(
          `${process.env.REACT_APP_API_URL}/plans/count/${phoneNumber}`
        );
        setPlanCount(data.count);
      } catch (error) {
        setError("Error fetching plan count.");
      }
    };

    fetchPlanCount();
  }, [phoneNumber]);


useEffect(() => {
    const fetchNotificationCount = async () => {
      if (!phoneNumber) return; // Avoid API call if phoneNumber is missing

      try {
        const { data } = await axios.get(
          `${process.env.REACT_APP_API_URL}/notifications/count/${phoneNumber}`
        );
        setNotificationCount(data.count);
      } catch (error) {
        setError("Error fetching notification count");
      }
    };

    fetchNotificationCount();
  }, [phoneNumber]);

useEffect(() => {
    const fetchUserCount = async () => {
        if (!phoneNumber) return;
        try {
            const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/fetch-delete-status-count?phoneNumber=${phoneNumber}`);
            setDeleteCount(data.count);
        } catch (err) {
            // setError("Failed to fetch user count");
        } finally {
            setLoading(false);
        }
    };

    fetchUserCount();
}, [phoneNumber]);


useEffect(() => {
    const fetchUserCount = async () => {
        if (!phoneNumber) return;
        try {
            const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/property-count?phoneNumber=${phoneNumber}`);
            setUserCount(data.count);
        } catch (err) {
            // setError("Failed to fetch user count");
        } finally {
            setLoading(false);
        }
    };

    fetchUserCount();
}, [phoneNumber]);


    useEffect(() => {
        const fetchPlansCount = async () => {
            try {
                const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/get-all-plan-count`);
                setTotalPlansCount(data.totalPlansCount);
            } catch (error) {
            }
        };

        fetchPlansCount();
    }, []);


useEffect(() => {
    const fetchViewedPropertiesCount = async () => {
        if (!phoneNumber) return; // Avoid API call if phoneNumber is missing

        try {
            const { data } = await axios.get(
                `${process.env.REACT_APP_API_URL}/property-owner-viewed-users-count?phoneNumber=${phoneNumber}`
            );
            setViewedPropertiesCount(data.viewedPropertiesCount);
        } catch (error) {
        }
    };

    fetchViewedPropertiesCount();
}, [phoneNumber]);

useEffect(() => {
    const fetchInterestOwnersCount = async () => {
        if (!phoneNumber) return;

        try {
            const { data } = await axios.get(
                `${process.env.REACT_APP_API_URL}/get-interest-sent-count?phoneNumber=${phoneNumber}`
            );

            // ✅ Use the correct key from the API response
            setInterestOwnersCount(data.interestSentCount);

        } catch (error) {
        }
    };

    fetchInterestOwnersCount();
}, [phoneNumber]);


useEffect(() => {
    const fetchContactOwnersCount = async () => {
        if (!phoneNumber) return; // Avoid API call if phoneNumber is missing

        try {
            const { data } = await axios.get(
                `${process.env.REACT_APP_API_URL}/get-contact-owner-count?phoneNumber=${phoneNumber}`
            );
            setContactOwnersCount(data.contactOwnersCount);
        } catch (error) {
        }
    };

    fetchContactOwnersCount();
}, [phoneNumber]);

    useEffect(() => {
        const fetchReportPropertyOwnersCount = async () => {
            if (!phoneNumber) return; // Ensure phoneNumber exists before making the request

            try {
                const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/get-reportproperty-owner-count?phoneNumber=${phoneNumber}`);
                setReportPropertyOwnersCount(data.reportPropertyOwnersCount);
            } catch (error) {
            }
        };

        fetchReportPropertyOwnersCount();
    }, [phoneNumber]); 



const [soldOutOwnersCount, setSoldOutOwnersCount] = useState(0);

useEffect(() => {
    const fetchSoldOutOwnersCount = async () => {
        try {
            const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/get-soldout-owner-count?phoneNumber=${phoneNumber}`);
            setSoldOutOwnersCount(data.soldOutOwnersCount);
        } catch (error) {
        }
    };

    fetchSoldOutOwnersCount();
}, [phoneNumber]);


useEffect(() => {
    const fetchFavoriteRemovedOwnerCount = async () => {
        try {
            if (!phoneNumber) return;

            const { data } = await axios.get(
                `${process.env.REACT_APP_API_URL}/get-favorite-removed-owner-count?phoneNumber=${phoneNumber}`
            );

            setFavoriteRemovedOwnerCount(data.favoriteRemovedOwnerCount);
        } catch (error) {
            setError("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    fetchFavoriteRemovedOwnerCount();
}, [phoneNumber]);


useEffect(() => {
    const fetchFavoriteOwnerCount = async () => {
        try {
            const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/get-favorite-owner-count?phoneNumber=${phoneNumber}`);
            setFavoriteOwnerCount(data.favoriteOwnerCount);
        } catch (error) {
        }
    };

    if (phoneNumber) {
        fetchFavoriteOwnerCount();
    }
}, [phoneNumber]); // Re-run when phoneNumber changes





useEffect(() => {
    const fetchOwnerMatchedPropertyCount = async () => {
        try {
            const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/fetch-owner-matched-properties/count?phoneNumber=${phoneNumber}`);
            setOwnerMatchedPropertyCount(data.matchedPropertyCount);
        } catch (error) {
        }
    };

    fetchOwnerMatchedPropertyCount();
}, [phoneNumber]);


useEffect(() => {
    const fetchOwnerPhotoRequestCount = async () => {
        try {
            const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/photo-requests/owner/count/${phoneNumber}`);
            setOwnerPhotoRequestCount(data.photoRequestCount);
        } catch (error) {
        }
    };

    fetchOwnerPhotoRequestCount();
}, [phoneNumber]);


      useEffect(() => {
          const fetchOwnerOfferCount = async () => {
              try {
                  const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/offers/owner/count/${phoneNumber}`);
                  setOwnerOfferCount(data.offerCount);
              } catch (error) {
              }
          };
      
          fetchOwnerOfferCount();
      }, [phoneNumber]);
      


useEffect(() => {
    const fetchOffersCount = async () => {
        try {
            const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/offers/buyer/count/${phoneNumber}`);
            setOffersCount(data.offersCount);
        } catch (error) {
        }
    };

    fetchOffersCount();
}, [phoneNumber]);


useEffect(() => {
    const fetchMatchedPropertiesCount = async () => {
        try {
            const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/fetch-buyer-matched-properties/count?phoneNumber=${phoneNumber}`);
            setMatchedPropertiesCount(data.matchedPropertiesCount);
        } catch (error) {
        }
    };

    fetchMatchedPropertiesCount();
}, [phoneNumber]);


      useEffect(() => {
          const fetchPhotoRequestsCount = async () => {
              try {
                  const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/photo-requests/buyer/count/${phoneNumber}`);
                  setPhotoRequestsCount(data.photoRequestsCount);
              } catch (error) {
              }
          };
      
          fetchPhotoRequestsCount();
      }, [phoneNumber]);
      

useEffect(() => {
    const fetchFavoriteRequestsCount = async () => {
        try {
            const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/get-favorite-buyer-count?postedPhoneNumber=${phoneNumber}`);
            setFavoriteRequestsCount(data.favoriteRequestsCount);
        } catch (error) {
        }
    };

    fetchFavoriteRequestsCount();
}, [phoneNumber]);


useEffect(() => {
    const fetchSoldOutRequestsCount = async () => {
        try {
            const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/get-soldout-buyer-count?postedPhoneNumber=${phoneNumber}`);
            setSoldOutRequestsCount(data.soldOutRequestsCount);
        } catch (error) {
        }
    };

    fetchSoldOutRequestsCount();
}, [phoneNumber]);


useEffect(() => {
    const fetchReportRequestsCount = async () => {
        try {
            const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/get-reportproperty-buyer-count?postedPhoneNumber=${phoneNumber}`);
            setReportRequestsCount(data.reportRequestsCount);
        } catch (error) {
        }
    };

    fetchReportRequestsCount();
}, [phoneNumber]);
    
      useEffect(() => {
        if (!phoneNumber) {
          setLoading(false);
          return;
        }
    
        const fetchInterestBuyersCount = async () => {
          try {
            const response = await axios.get(
              `${process.env.REACT_APP_API_URL}/interest-buyers-count/${phoneNumber}`
            );
    
            if (response.status === 200) {
              setInterestBuyersCount(response.data.interestBuyersCount);
            }
          } catch (error) {
          } finally {
            setLoading(false);
          }
        };
    
        fetchInterestBuyersCount();
      }, [phoneNumber]);
    

      useEffect(() => {
        // Fetch buyer viewed count
        const fetchBuyerViewedCount = async () => {
            try {
                const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/property-buyer-viewed-count?phoneNumber=${phoneNumber}`);
                setBuyerViewedCount(data.buyerViewedCount);
            } catch (error) {
            }
        };
    
        fetchBuyerViewedCount();
    }, [phoneNumber]);

    useEffect(() => {
    const fetchHelpRequestsCount = async () => {
        try {
            const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/get-help-as-buyer-count?postedPhoneNumber=${phoneNumber}`);
            setHelpRequestsCount(data.helpRequestsCount);
        } catch (error) {
        }
    };

    fetchHelpRequestsCount();
}, [phoneNumber]);


  // Fetch contact buyer count
  useEffect(() => {
  const fetchContactBuyerCount = async () => {
    try {
        const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/get-contact-buyer-count?postedPhoneNumber=${phoneNumber}`);
        setContactBuyerCount(data.contactBuyerCount);
    } catch (error) {
    }
};

fetchContactBuyerCount();
}, [phoneNumber]);




    

    const handleAddProperty = async () => {
        if (!phoneNumber) {
            return;
        }
    
        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/store-data`,
                { phoneNumber }
            );
    
            if (response.status === 201) {
                const ppcId = response.data.ppcId;
     
                navigate(`/add-property/${phoneNumber}?ppcId=${ppcId}`);

            }
        } catch (error) {
        }
    };
      const styles = {
    container: {
 fontFamily: "Inter, sans-serif",
            width: "100%",
            overflowY: "auto",
            scrollbarWidth:"none",
      background: '#f8f8f8',
    },
    tabs: {
      display: 'flex',
      borderBottom: '1px solid #ddd',
      background: '#ffffff',

    },
    tab: {
      flex: 1,
      textAlign: 'center',
      padding: '12px',
      fontWeight: '500',
      border: '1px solid #ddd',
      borderBottom: 'none',
      cursor: 'pointer',
          },
    activeTab: {
      backgroundColor: '#4B3F72',
      color: 'white',
    },
    card: {
      background: '#fff',
      borderRadius: '10px',
      padding: '16px',
    boxShadow: '0 2px 8px rgba(0, 123, 255, 0.3)',
      marginTop: '12px',
    },
    headerRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
    },
    title: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#4B3F72',
    },
    listItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '14px 0',
      borderTop: '1px solid #eee',
      fontSize: '16px',
      color: '#333',
    },
    arrow: {
      fontSize: '20px',
      color: '#aaa',
    },
    badge: {
      background: '#d6cfff',
      color: '#4B3F72',
      borderRadius: '50%',
      padding: '6px 12px',
      fontWeight: 'bold',
      fontSize: '14px',
    },
    switch: {
      position: 'relative',
      display: 'inline-block',
      width: '44px',
      height: '24px',
    },
    slider: {
      position: 'absolute',
      cursor: 'pointer',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#ccc',
      transition: '0.4s',
      borderRadius: '24px',
    },
    sliderBefore: {
      position: 'absolute',
      content: '""',
      height: '18px',
      width: '18px',
      left: '3px',
      bottom: '3px',
      backgroundColor: 'white',
      transition: '0.4s',
      borderRadius: '50%',
    },
    sliderChecked: {
      backgroundColor: '#4B3F72',
    },
    sliderBeforeChecked: {
      transform: 'translateX(20px)',
    },
  
  };

      const tabStyle = (tab) => ({
     zIndex: 2,
    flex: 1,
    padding: '16px 0',
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    backgroundColor: activeTab === tab ? '#30747F' : '#fff',
    color: activeTab === tab ? '#fff' : '#000',
    borderRight: tab !== 'buyerMenu' ? '1px solid #ccc' : 'none',
    cursor: 'pointer',
  });

    return (
    <div className="container d-flex align-items-center justify-content-center p-0">
    <div className="d-flex flex-column align-items-center justify-content-center m-0" style={{ maxWidth: '500px', margin: 'auto', width: '100%' , background:"#F7F7F7" , fontFamily: 'Inter, sans-serif'}}>
    <div className="d-flex align-items-center justify-content-start w-100"    style={{
        background: "#EFEFEF",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        opacity: isScrolling ? 0 : 1,
        pointerEvents: isScrolling ? "none" : "auto",
        transition: "opacity 0.3s ease-in-out",
      }}>
        <button
             onClick={() => navigate(-1)}
             className="pe-5"
             style={{
               backgroundColor: '#f0f0f0',
               border: 'none',
               padding: '10px 20px',
               cursor: 'pointer',
               transition: 'all 0.3s ease-in-out',
               display: 'flex',
               alignItems: 'center',
             }}
             onMouseEnter={(e) => {
               e.currentTarget.style.backgroundColor = '#f0f4f5'; // Change background
               e.currentTarget.querySelector('svg').style.color = '#00B987'; // Change icon color
             }}
             onMouseLeave={(e) => {
               e.currentTarget.style.backgroundColor = '#f0f0f0';
               e.currentTarget.querySelector('svg').style.color = '#30747F';
             }}
           >
             <FaArrowLeft style={{ color: '#30747F', transition: 'color 0.3s ease-in-out' , background:"transparent"}} />
           </button> <h3 className="m-0 ms-3" style={{fontSize:"20px"}}>MORE  </h3> </div>
<div className="row g-2 w-100">
            {/* Navigation Tabs */}
          <div style={styles.tabs}>
           <div style={tabStyle('myAccount')} onClick={() => handleTabClick('myAccount')}>
        MY ACCOUNT
      </div>
      <div style={tabStyle('ownerMenu')} onClick={() => handleTabClick('ownerMenu')}>
        OWNER MENU
      </div>
      <div style={tabStyle('buyerMenu')} onClick={() => handleTabClick('buyerMenu')}>
        BUYER MENU
      </div>
      </div>

            {/* Content for Each Tab */}
           <div className="tab-content mt-3">
                        {/* My Account Tab Content */}
                                   <img src={rangoli} alt="" width={200} style={{position:"absolute", top:'135px' , left:"-50px", zIndex: 0,pointerEvents: 'none',  opacity: 0.3}}/>
        
                     {activeTab === 'myAccount' && (
            <div className="tab-pane active" >
                <div style={{paddingLeft:"50px"}}
                >
        
              
              
        <div style={{
              background: '#fff',
              borderRadius: '10px',
              padding: '16px',
            boxShadow: '0 2px 8px rgba(0, 123, 255, 0.3)',
              marginTop: '12px',
              zIndex:2
        }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                    <h3 className="m-0" style={{ color: '#30747F', fontSize:"18px" , fontWeight:"bold" }}>My Account</h3>
                    <img src={imge1} alt="My Account" className="rounded" />
                </div>
            <ul className="list-group custom-list-group" >
                    <li 
                    style={{   display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 0',
              fontSize: '16px',
              color: '#333',}}
                        onClick={handleAddProperty} 
                    >
        <span style={{fontSize:"14px" , fontWeight:400 , color:"#5E5E5E" , fontWeight:500}}>ADD PROPERTY</span>                {/* <span className="badge bg-primary rounded-pill">0</span> */}
                    </li>
        
                    
                    <MenuLink 
            to={`/my-property`} 
            label="My Property "  
            count={userCount}   
        />
        
        <MenuLink to={`/my-profile/${phoneNumber}`} label="My Profile " />
        
        
        <MenuLink 
            to={`/my-plan`} 
            label="My Plan "  
            count={planCount}   
        />
        
        
        
        <MenuLink 
          to="/notification" 
          label="Notifications"  
          count={(notificationCount || 0) + (notificationUserCount || 0)} 
        />
        
        <MenuLink 
            to={`/removed-property`} 
            label="Removed Property "  
            count={deleteCount}   
        />
        
        
        
        <MenuLink 
            to={`/expire-property`} 
            label="Expried Plan "  
            count={propertyCount}
        />
        
        
        <MenuLink  
            to={`/add-plan`} 
            label="Add Plans Owners"
            count={totalPlansCount}
            badgeClass="bg-success" 
        />
        
        
        
        
        
        
                  
        
                </ul> 
            </div>
        </div>
            </div>
        )}
        
          {/* Buyer Menu Tab Content */}
          {activeTab === 'ownerMenu' && (
                            <div className="tab-pane active">
               <div style={{marginLeft:"50px",}}>  
                <div style={{
              background: '#ffffff',
              borderRadius: '10px',
              padding: '16px',
            boxShadow: '0 2px 8px rgba(0, 123, 255, 0.3)',
              marginTop: '12px',
        }}>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h3 className="m-0" style={{ color: '#30747F', fontSize:"18px" , fontWeight:"bold"}}>Owner Menu</h3>
                                    <img src={imge3} alt="Buyer Menu" className="rounded" />
                                </div>
                                <ul className="list-group">
                                    {/* Example usage of MenuLink for buyer */}
                                    {/* <MenuLink to={`/interest-buyer/${phoneNumber}`} label="Buyer Interested " /> */}
     <MenuLink  
    to={`/Buyer-List-Filter`} 
    label="Buyer Lists"
    // count={interestBuyersCount}
    badgeClass="bg-primary" 
/>           
             <MenuLink  
            to={`/interest-buyer/${phoneNumber}`} 
            label=" Interested Buyers"
            count={interestBuyersCount}
            badgeClass="bg-primary" 
        />
        
        
        <MenuLink  
            to={`/matched-buyer/${phoneNumber}`} 
            label="Matched Buyers "
            count={matchedPropertiesCount}
            badgeClass="bg-success" 
        />
        
        
        <MenuLink  
            to={`/offer-buyer/${phoneNumber}`} 
            label="Offers From Buyers"
            count={offersCount}
            badgeClass="bg-info" 
        />
        
        
        <MenuLink  
            to={`/contact-buyer/${phoneNumber}`} 
            label="Contacted Buyers "
            count={contactBuyerCount}
            badgeClass="bg-warning" 
        />
        
        
        <MenuLink  
            to={`/photo-request-buyer/${phoneNumber}`} 
            label=" Photo Requested Buyers"
            count={photoRequestsCount}
            badgeClass="bg-info" 
        />
        
        
        <MenuLink  
            to={`/favorite-buyer/${phoneNumber}`} 
            label="Shortlisted Buyers"
            count={favoriteRequestsCount}
            badgeClass="bg-primary" 
        />
        
        
        <MenuLink  
            to={`/view-buyer/${phoneNumber}`} 
            label=" Viewed Buyers"
            count={buyerViewedCount}
            badgeClass="bg-success" 
        />
        
        
        
                                </ul>
                            </div>
                                                </div>
        
                                                </div>
        
                        )}
        
        
                        {/* Owner Menu Tab Content */}
                        {activeTab === 'buyerMenu' && (
                            <div className="tab-pane active">
                                        <div style={{marginLeft:"50px"}}
                >
        
              
              
        <div style={{
              background: '#fff',
              borderRadius: '10px',
              padding: '16px',
            boxShadow: '0 2px 8px rgba(0, 123, 255, 0.3)',
              marginTop: '12px',
        }}>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h3 className="m-0" style={{ color: '#30747F' , fontSize:"18px" , fontWeight:"bold"}}>Buyer Menu</h3>
                                    <img src={imge2} alt="Owner Menu" className="rounded" />
                                </div>
                                <ul className="list-group">
        
        
                               
                                <MenuLink 
                                to={`/buyer-assistance/${phoneNumber}`}
            label=" Add Buyer Assistance " 
        />
        
        
        <MenuLink 
                                to={`/buyer-assis-buyer`}
            label="My Buyer Assistance"
            count={buyerCount}   
        
        />
                                <MenuLink 
            to={`/interest-owner/${phoneNumber}`} 
            label=" My Send Interest  "  
            count={interestOwnersCount}   
        />
        
        <MenuLink  
            to={`/matched-owner/${phoneNumber}`} 
            label="MY Matched Properties"
            count={ownerMatchedPropertyCount}
            badgeClass="bg-success" 
        />
        
        
        <MenuLink  
            to={`/photo-request-owner/${phoneNumber}`} 
            label="My Photo Requests"
            count={ownerPhotoRequestCount}
            badgeClass="bg-info" 
        />
        
        
        <MenuLink  
            to={`/contact-owner/${phoneNumber}`} 
            label="My Contacted "
            count={contactOwnersCount}
            badgeClass="bg-primary" 
        />
        
        
        <MenuLink  
            to={`/offer-owner/${phoneNumber}`} 
            label="My Offers "
            count={ownerOfferCount}
            badgeClass="bg-success" 
        />
        
        
        <MenuLink  
            to={`/favorite-owner/${phoneNumber}`} 
            label="My Shortlist Property"
            count={favoriteOwnerCount}
            badgeClass="bg-success" 
        />
        
        
        
        <MenuLink 
            to={`/my-last-property`} 
            label="My Last Viewed Property "  
            count={viewCountLast10Days}
        />
        
        <MenuLink 
            to={`/my-interest-send`} 
            label="My Interest Send "  
            count={buyerAssistanceInterestCount}
        
        />
        
        <MenuLink 
            to={`/most-viewed`} 
            label="My Most Viewed Property "  
            count={mostViewedCount}
        />
        
        
          </ul>
                            </div>
                            </div></div>
                        )}
        
                      
                    </div>
        

            {/* Footer Image */}
            <img src={more2} alt="Footer" style={{ width: '100%', marginTop: '20px' }} />
        </div>
        </div>
        </div>

    );
};

export default MoreSidebar;
























