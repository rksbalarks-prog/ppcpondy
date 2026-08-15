 

import React, { useState, useEffect } from 'react';
import navBg from '../Assets/bottomimg.png'
import houseIcon from '../Assets/ppc logo.jpg'
import { FaBuilding, FaEllipsisH, FaHome, FaUser } from 'react-icons/fa';
import { MdOutlineAddHomeWork } from 'react-icons/md';
import { RxHome } from "react-icons/rx";
import { BiBuildingHouse } from 'react-icons/bi';
import { RiAccountCircleLine } from 'react-icons/ri';
import './BottomNavigation.css';

const BottomNavigation = ({ activeItem, setActive }) => {
  // Animation state for center button
  const [isAnimating, setIsAnimating] = useState(false);
  const bottomNavItems = [
    { name: 'bottomHome', label: 'Home', icon: <RxHome /> },
    { name: 'bottomProperty', label: 'Properties', icon: <BiBuildingHouse  /> },
    { name: 'bottomBuyer', label: 'Assistant', icon:<RiAccountCircleLine /> },
    { name: 'bottomMore', label: 'More', icon: <FaEllipsisH /> },
  ];

  // Animation loop: 0-4s (image in center), 4-8s (animated up), 8-11s (return), repeat
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now() % 11000; // 11 second cycle
      setIsAnimating(now >= 4000 && now < 8000); // Animate from 4s to 8s
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const navbarContainerStyle = {
width: "100%",
  };

const backgroundStyle = { 
   backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  backgroundSize: 'cover',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  pointerEvents: 'auto',
  width: '100%',
  height: '100%',
};


  const itemStyle = (isActive) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    color: isActive ? '#2F747F' : '#888',
    fontWeight: isActive ? 'bold' : 'normal',
    fontSize: '12px',
    cursor: 'pointer',
    flex: 1,
  });

  const iconStyle = {
    fontSize: '22px',
    marginBottom: '4px',
  };

  const floatingButtonStyle = {
    position: 'absolute',
     bottom:"10px",
    left: '50%',
    transform: isAnimating ? 'translateX(-50%) translateY(-50px)' : 'translateX(-50%) translateY(0)',
    width: '70px',
    height: '70px',
    backgroundColor: isAnimating ? '#28a745' : '#0066FF',
    borderRadius: '50%',
    boxShadow: isAnimating ? '0 0 25px rgba(40, 167, 69, 0.8)' : '0 0 30px rgba(0, 102, 255, 0.6), 0 4px 12px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#fff',
    fontSize: isAnimating ? '13px' : '0',
    fontWeight: isAnimating ? 'bold' : 'normal',
    zIndex: 20,
    pointerEvents: 'auto',
    cursor: 'pointer',
    border: '4px solid white',
    transition: 'all 0.6s ease-in-out',
    overflow: 'hidden',
  };

  return (
   <div style={backgroundStyle}>
  {[...bottomNavItems.slice(0, 2), { name: 'add', label: '', icon: <MdOutlineAddHomeWork /> }, ...bottomNavItems.slice(2)].map((item, index) => {
    const isAddButton = item.name === 'add';
    return (
      <div
        key={item.name}
        style={{
          ...itemStyle(activeItem === item.name),
          ...(isAddButton && {
            marginTop: '-30px',
            zIndex: 20,
            justifyContent: 'center',
            alignItems: 'center',
          }),
        }}
        onClick={() => !isAddButton ? setActive(item.name) : setActive('bottomAdd')}
      >
        <div style={isAddButton ? floatingButtonStyle : iconStyle}>
          {isAddButton ? (
            isAnimating ? (
              <div style={{ textAlign: 'center', lineHeight: '1.2' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Add</div>
                <div style={{ fontSize: '12px', fontWeight: '600' }}>Property</div>
              </div>
            ) : (
              <img src={houseIcon} alt="Add Property" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            )
          ) : (
            item.icon
          )}
        </div>
        {!isAddButton && <div>{item.label}</div>}
      </div>
    );
  })}
</div>

  );
};

export default BottomNavigation;
