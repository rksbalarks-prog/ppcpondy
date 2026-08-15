import React, { useState } from 'react';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import HomeIcon from '@mui/icons-material/Home';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import AddHomeIcon from '@mui/icons-material/AddHome';
import './BottomNavigationComponent.css';

export default function Fooo() {
    const [value, setValue] = useState(0);

  return (
    <>
    <title>Animated Bottom Navigation Bar</title>
    <meta charSet="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <link rel="stylesheet" href="styles.css" />
    <style
      dangerouslySetInnerHTML={{
        __html:
          '\n    @import url("https://fonts.googleapis.com/css2?family=Roboto&display=swap");\n@import url("https://fonts.googleapis.com/icon?family=Material+Icons+Outlined");\n\n:root {\n  --accent-color: #1fa8f5;\n  --accent-color-fg: #fefefe;\n  --backdrop-color: #89d4fe;\n  --app-content-background-color: #c0d8ec;\n  --inset-shadow: rgba(7, 43, 74, 0.3);\n  --outset-shadow: rgba(223, 240, 255, 0.25);\n  --clay-box-shadow: rgba(7, 43, 74, 0.3);\n  --clay-background-color: #c0d8ec;\n  --clay-fg-color: #444;\n}\n\nbody {\n  background-color: var(--backdrop-color);\n  font-size: 10px;\n  font-family: "Roboto", sans-serif;\n}\n\n.flex-center {\n  display: flex;\n  justify-content: space-around;\n  align-items: center;\n}\n\n.container {\n  padding: 1rem 1rem 1.5rem;\n}\n\n.stage {\n  max-width: 400px;\n  width: 400px;\n  margin: 0 auto;\n}\n\n.home.active {\n  color: var(--accent-color);\n}\n.home-style {\n  --app-content-background-color: #c0d8ec;\n}\n\n.products.active {\n  --outset-shadow: rgba(247, 167, 103, 0.45);\n  --inset-shadow: rgba(149, 62, 8, 0.45);\n  --clay-box-shadow: rgba(211, 69, 20, 0.4);\n  --clay-background-color: #d34514;\n  --clay-fg-color: #f1f2f3;\n  color: #690c0c;\n}\n.products-style {\n  --app-content-background-color: #d36e5a;\n}\n\n.services.active {\n  --outset-shadow: rgba(255, 159, 40, 0.45);\n  --inset-shadow: rgba(88, 54, 13, 0.45);\n  --clay-box-shadow: rgba(88, 54, 13, 0.4);\n  --clay-background-color: #ed9426;\n  --clay-fg-color: #f1f2f3;\n  color: #cf5c0f;\n}\n.services-style {\n  --app-content-background-color: #ed9426;\n}\n\n.about.active {\n  --outset-shadow: rgba(93, 255, 85, 0.45);\n  --inset-shadow: rgba(28, 78, 26, 0.45);\n  --clay-box-shadow: rgba(28, 78, 26, 0.4);\n  --clay-background-color: #4dd146;\n  --clay-fg-color: #f1f2f3;\n  color: #4dd146;\n}\n.about-style {\n  --app-content-background-color: #4dd146;\n}\n\n.help.active {\n  --outset-shadow: rgba(230, 230, 230, 0.45);\n  --inset-shadow: rgba(81, 81, 81, 0.45);\n  --clay-box-shadow: rgba(81, 81, 81, 0.4);\n  --clay-background-color: #a3a3a3;\n  --clay-fg-color: #f1f2f3;\n  color: #783896;\n}\n.help-style {\n  --app-content-background-color: #a3a3a3;\n}\n\n.tabbar {\n  background-color: var(--app-content-background-color);\n  border-bottom-left-radius: 1rem;\n  border-bottom-right-radius: 1rem;\n  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);\n  height: 120px;\n  display: flex;\n  flex-direction: column;\n  box-sizing: content-box;\n  position: relative;\n  overflow: hidden;\n  transition: background-color 0.4s;\n}\n.tabbar ul,\n.tabbar li {\n  list-style-type: none;\n  margin: 0;\n  padding: 0;\n}\n.tabbar ul {\n  position: absolute;\n  bottom: 0;\n  width: 100%;\n  background-color: #f9f8fa;\n  align-self: flex-end;\n  justify-content: center;\n  height: 50px;\n}\n.tabbar li {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  font-size: 1rem;\n  margin-right: 5px;\n  transition: all 0.4s;\n  background-color: #f9f8fa;\n  width: 60px;\n  height: 60px;\n  position: relative;\n  color: #888;\n  cursor: pointer;\n}\n.tabbar li:last-child {\n  margin-right: 0;\n}\n\n.tab-style2 ul {\n  justify-content: center;\n}\n.tab-style2 li {\n  border-top-left-radius: 100%;\n  border-top-right-radius: 100%;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  top: 1px;\n  left: 0;\n  width: 60px;\n  height: 50px;\n}\n.tab-style2 .active {\n  width: 60px;\n  height: 60px;\n  top: -1rem;\n}\n.tab-style2 .active span {\n  font-size: 2rem;\n}\n.tab-style2 .active:before, .tab-style2 .active:after {\n  position: absolute;\n  content: " ";\n  width: 13px;\n  height: 13px;\n  border-bottom: 4px solid #f9f8fa;\n  top: 8px;\n}\n.tab-style2 .active:before {\n  border-bottom-right-radius: 100%;\n  left: -7px;\n}\n.tab-style2 .active:after {\n  border-bottom-left-radius: 100%;\n  right: -7px;\n}\n\n  '
      }}
    />
   
<div className="container stage">
      <div className="container">
        <div className="tabbar tab-style2">
          <BottomNavigation
            value={value}
            onChange={(event, newValue) => setValue(newValue)}
            showLabels
          >
            <BottomNavigationAction
              className="home"
              label="Home"
              icon={<HomeIcon />}
            />
            <BottomNavigationAction
              className="products"
              label="Property"
              icon={<BusinessIcon />}
            />
            <BottomNavigationAction
              className="home-property"
              label="HomeProperty"
              icon={<AddHomeIcon />}
            />
            <BottomNavigationAction
              className="buyer"
              label="Buyer"
              icon={<PersonIcon />}
            />
            <BottomNavigationAction
              className="more"
              label="More"
              icon={<MoreHorizIcon />}
            />
          </BottomNavigation>
        </div>
      </div>
    </div>
  </>  )
}
