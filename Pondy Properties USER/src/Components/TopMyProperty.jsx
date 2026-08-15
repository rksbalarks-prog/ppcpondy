
import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './MoreComponent.css'; // Custom CSS for additional styles
import imge1 from '../Assets/myaccountmore.png'
import imge2 from '../Assets/sellermore.png'
import imge3 from '../Assets/buyermore.png'
import more1 from '../Assets/more1.png'
import more2 from '../Assets/bottom.png'

const TopMyProperty = () => {
    const [activeTab, setActiveTab] = useState('myAccount');

    const handleTabClick = (tabName) => {
        setActiveTab(tabName);
    };

    return (
        <div className="container-fluid mt-4 p-0" style={{fontFamily: "Inter, sans-serif", width:"450px"}}>
            <ul className="nav nav-tabs d-flex justify-content-around align-items-center">
                <li className="nav-item">
             
                    <button
                        className={`nav-link ${activeTab === 'myAccount' ? 'active' : ''}`}
                        style={activeTab === 'myAccount' ? { backgroundColor: '#30747F', color: 'white' } : {color:'black'}}
                        onClick={() => handleTabClick('myAccount')}
                    >
                       MY ACCOUNT
                    </button>
                </li>
                <li className="nav-item">
                <button
                        className={`nav-link ${activeTab === 'ownerMenu ' ? 'active' : ''}`}
                        style={activeTab === 'ownerMenu' ? { backgroundColor: '#30747F', color: 'white' } : {color:'black'}}
                        onClick={() => handleTabClick('ownerMenu')}
                    >
                        OWNER MENU
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'buyerMenu' ? 'active' : ''}`}
                        style={activeTab === 'buyerMenu' ? { backgroundColor: '#30747F', color: 'white' } : {color:'black'}}
                        onClick={() => handleTabClick('buyerMenu')}
                    >
                        BUYER MENU
                    </button>
                </li>
            </ul>

            <div className="tab-content mt-3">
                {activeTab === 'myAccount' && (
                    <div className="tab-pane active" style={{ maxHeight: '400px', overflowY: 'scroll', scrollbarWidth: 'none' }}>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h3 className="m-0" style={{color:'#30747F'}}>My Account</h3>
                            <img src={imge1} alt="My Account" className="rounded" />
                        </div>
                        <ul className="list-group custom-list-group">
                            <li className="list-group-item d-flex justify-content-between align-items-center custom-list-item">
                                <div className="d-flex align-items-center">
                                    <img src="https://via.placeholder.com/30" alt="icon" className="me-3" />
                                    <span>Add New Property</span>
                                </div>
                                <span className="text-primary">&gt;</span>
                            </li>
                            <li className="list-group-item d-flex justify-content-between align-items-center custom-list-item">
                                <div className="d-flex align-items-center">
                                    <img src="https://via.placeholder.com/30" alt="icon" className="me-3" />
                                    <span>My Property</span>
                                </div>
                                <span className="badge bg-primary rounded-pill">0</span>
                            </li>
                            <li className="list-group-item d-flex justify-content-between align-items-center custom-list-item">
                                <div className="d-flex align-items-center">
                                    <img src="https://via.placeholder.com/30" alt="icon" className="me-3" />
                                    <span>My Profile</span>
                                </div>
                                <span className="text-primary">&gt;</span>
                            </li>
                            <li className="list-group-item d-flex justify-content-between align-items-center custom-list-item">
                                <div className="d-flex align-items-center">
                                    <img src="https://via.placeholder.com/30" alt="icon" className="me-3" />
                                    <span>My Plan</span>
                                </div>
                                <span className="text-primary">&gt;</span>
                            </li>
                            <li className="list-group-item d-flex justify-content-between align-items-center custom-list-item">
                                <div className="d-flex align-items-center">
                                    <img src="https://via.placeholder.com/30" alt="icon" className="me-3" />
                                    <span>Notification</span>
                                </div>
                                <div className="form-check form-switch">
                                    <input className="form-check-input" type="checkbox" id="notificationToggle" />
                                </div>
                            </li>
                            <li className="list-group-item d-flex justify-content-between align-items-center custom-list-item">
                                <div className="d-flex align-items-center">
                                    <img src="https://via.placeholder.com/30" alt="icon" className="me-3" />
                                    <span>Removed Property</span>
                                </div>
                                <span className="badge bg-primary rounded-pill">0</span>
                            </li>
                            <li className="list-group-item d-flex justify-content-between align-items-center custom-list-item">
                                <div className="d-flex align-items-center">
                                    <img src="https://via.placeholder.com/30" alt="icon" className="me-3" />
                                    <span>Expired Property</span>
                                </div>
                                <span className="badge bg-primary rounded-pill">0</span>
                            </li>
                        </ul>
                        <img src={more2} alt=""  style={{width:'100%'}}/>

                                       </div>
                )}
                {activeTab === 'ownerMenu' && (
                     <div className="tab-pane active" style={{ maxHeight: '400px', overflowY: 'scroll', scrollbarWidth: 'none' }}>
                     <div className="d-flex justify-content-between align-items-center mb-3">
                         <h3 className="m-0" style={{color:'#30747F'}}>Owner Menu</h3>
                         <img src={imge2} alt="My Account" className="rounded" />
                     </div>
                     <ul className="list-group custom-list-group">
                         <li className="list-group-item d-flex justify-content-between align-items-center custom-list-item">
                             <div className="d-flex align-items-center">
                                 <span>Interested Buyers</span>
                             </div>
                             <span className="badge bg-primary rounded-pill">0</span>
                         </li>
                         <li className="list-group-item d-flex justify-content-between align-items-center custom-list-item">
                             <div className="d-flex align-items-center">
                                 <span>Matched Buyers</span>
                             </div>
                             <span className="badge bg-primary rounded-pill">0</span>
                         </li>
                         <li className="list-group-item d-flex justify-content-between align-items-center custom-list-item">
                             <div className="d-flex align-items-center">
                                 <span>Offers From buyers</span>
                             </div>
                             <span className="badge bg-primary rounded-pill">0</span>
                         </li>
                         <li className="list-group-item d-flex justify-content-between align-items-center custom-list-item">
                             <div className="d-flex align-items-center">
                                 <span>Contacted buyers</span>
                             </div>
                             <span className="badge bg-primary rounded-pill">0</span>
                         </li>
                         <li className="list-group-item d-flex justify-content-between align-items-center custom-list-item">
                             <div className="d-flex align-items-center">
                                 <span>Photo Request buyer</span>
                             </div>
                             <span className="badge bg-primary rounded-pill">0</span>
                         </li>
                         <li className="list-group-item d-flex justify-content-between align-items-center custom-list-item">
                             <div className="d-flex align-items-center">
                                 <span>Shortlisted buyers</span>
                             </div>
                             <span className="badge bg-primary rounded-pill">0</span>
                         </li>
                         <li className="list-group-item d-flex justify-content-between align-items-center custom-list-item">
                             <div className="d-flex align-items-center">
                                 <span>Viewed buyers</span>
                             </div>
                             <span className="badge bg-primary rounded-pill">0</span>
                         </li>
                         <li className="list-group-item d-flex justify-content-between align-items-center custom-list-item">
                             <div className="d-flex align-items-center">
                                 <span>My Intersted buyers</span>
                             </div>
                             <span className="badge bg-primary rounded-pill">0</span>
                         </li>
                         <li className="list-group-item d-flex justify-content-start align-items-center custom-list-item">
                             <div className="d-flex align-items-center">
                                 <span>Buyer List</span>
                             </div>
                         </li>
                         <li className="list-group-item d-flex justify-content-start align-items-center custom-list-item">
                             <div className="d-flex align-items-center">
                                 <span>Leads Center</span>
                             </div>
                         </li>
                     </ul>
                     <img src={more2} alt=""  style={{width:'100%'}}/>

                 </div>
                )}
                {activeTab === 'buyerMenu' && (
                     <div className="tab-pane active" style={{ maxHeight: '400px', overflowY: 'scroll', scrollbarWidth: 'none' }}>
                     <div className="d-flex justify-content-between align-items-center mb-3">
                         <h3 className="m-0" style={{color:'#30747F'}}>Buyer Menu</h3>
                         <img src={imge3} alt="My Account" className="rounded" />
                     </div>
                     <ul className="list-group custom-list-group">
                      
                         <li className="list-group-item d-flex justify-content-start align-items-center custom-list-item">
                             <div className="d-flex align-items-center">
                                 <span>Add Property Assistance</span>
                             </div>
                         </li>    <li className="list-group-item d-flex justify-content-between align-items-center custom-list-item">
                             <div className="d-flex align-items-center">
                                 <span>Property Assistance</span>
                             </div>
                             <span className="badge bg-primary rounded-pill">0</span>
                         </li>    <li className="list-group-item d-flex justify-content-between align-items-center custom-list-item">
                             <div className="d-flex align-items-center">
                                 <span>View Matched Property</span>
                             </div>
                             <span className="badge bg-primary rounded-pill">0</span>
                         </li>    <li className="list-group-item d-flex justify-content-between align-items-center custom-list-item">
                             <div className="d-flex align-items-center">
                                 <span>My Called List</span>
                             </div>
                             <span className="badge bg-primary rounded-pill">0</span>
                         </li>    <li className="list-group-item d-flex justify-content-between align-items-center custom-list-item">
                             <div className="d-flex align-items-center">
                                 <span>My Offers</span>
                             </div>
                             <span className="badge bg-primary rounded-pill">1</span>
                         </li>    <li className="list-group-item d-flex justify-content-between align-items-center custom-list-item">
                             <div className="d-flex align-items-center">
                                 <span>My Photo Request</span>
                             </div>
                             <span className="badge bg-primary rounded-pill">0</span>
                         </li>    <li className="list-group-item d-flex justify-content-between align-items-center custom-list-item">
                             <div className="d-flex align-items-center">
                                 <span>My Sent Interest</span>
                             </div>
                             <span className="badge bg-primary rounded-pill">0</span>
                         </li>    <li className="list-group-item d-flex justify-content-between align-items-center custom-list-item">
                             <div className="d-flex align-items-center">
                                 <span>My ShortList Property</span>
                             </div>
                             <span className="badge bg-primary rounded-pill">0</span>
                         </li>    <li className="list-group-item d-flex justify-content-between align-items-center custom-list-item">
                             <div className="d-flex align-items-center">
                                 <span>My Last Viewed Property</span>
                             </div>
                             <span className="badge bg-primary rounded-pill">0</span>
                         </li>    <li className="list-group-item d-flex justify-content-between align-items-center custom-list-item">
                             <div className="d-flex align-items-center">
                                 <span>Received Interest owner</span>
                             </div>
                             <span className="badge bg-primary rounded-pill">0</span>
                         </li>    
                         
                     </ul>
                     <img src={more1} alt=""  style={{width:'100%'}}/>
                 </div>
                )}
            </div>
        </div>
    );
};

export default TopMyProperty;
