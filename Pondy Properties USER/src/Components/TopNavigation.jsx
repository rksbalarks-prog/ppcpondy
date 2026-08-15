


import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
 import {
  Home as HomeIcon,
  ListAlt as ListAltIcon,
  Person as PersonIcon,
  DriveEta as DriveEtaIcon,
  Star as StarIcon,
  VisibilityOff as VisibilityOffIcon,
  MenuBook as MenuBookIcon,
  Favorite as FavoriteIcon,
} from '@mui/icons-material';
import rentproperty from '../Assets/Rent Property-01.png'
import buyerlist from '../Assets/Buyer List-01.png'
import py from '../Assets/PY Bikes.png'

function TopNavigation({ value, onChange }) {
  return (
    <AppBar position="sticky" style={{background:'none', color:"black", border:'none',padding:'0'}}>
      <Toolbar className='p-0'>
        <Tabs
          value={value}
          onChange={onChange}
          textColor="inherit"
          TabIndicatorProps={{
            style: {
              backgroundColor: '#32757F', // Custom indicator color
            },
          }}          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={<span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }}>Py Property</span>} icon={<img  src={py} alt=" Property" height={40}/>} />
          <Tab label={<span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }}>All Property</span>} icon={<ListAltIcon style={{ width: 34, height: 34 , background:'red', color:'white', borderRadius:'50%'}}/>} />
          <Tab label={<span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }}>Buyer List</span>} icon={<img src={buyerlist} alt='' height={40}/>} />
          <Tab label={<span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }}>Rent Property</span>} icon={<img  src={rentproperty} alt=" Property" height={40}/>} />
          <Tab label={<span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }}>Used Cars</span>} icon={<DriveEtaIcon  style={{ width: 24, height: 24 , background:'red', color:'white', borderRadius:'50%'}}/>} />
          <Tab label={<span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }}>Groom</span>} icon={<PersonIcon style={{ width: 24, height: 24 , background:'red', color:'white', borderRadius:'50%'}}/>} />
          <Tab label={<span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }}>Bride</span>} icon={<PersonIcon style={{ width: 24, height: 24 , background:'red', color:'white', borderRadius:'50%'}}/>} />
          <Tab label={<span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }}>Featured Property</span>} icon={<StarIcon style={{ width: 24, height: 24 , background:'red', color:'white', borderRadius:'50%'}}/>} />
          <Tab label={<span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }}>Not Viewed Property</span>} icon={<VisibilityOffIcon style={{ width: 24, height: 24 , background:'red', color:'white', borderRadius:'50%'}}/>} />
          <Tab label={<span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }}>My Property</span>} icon={<HomeIcon style={{ width: 24, height: 24 , background:'red', color:'white', borderRadius:'50%'}}/>} />
          <Tab label={<span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }}>Owner Menu</span>} icon={<MenuBookIcon style={{ width: 24, height: 24 , background:'red', color:'white', borderRadius:'50%'}}/>} />
          <Tab label={<span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }}>Buyer Menu</span>} icon={<FavoriteIcon style={{ width: 24, height: 24 , background:'red', color:'white', borderRadius:'50%'}}/>} />
        </Tabs>
      </Toolbar>
    </AppBar>
  );
}

export default TopNavigation;
