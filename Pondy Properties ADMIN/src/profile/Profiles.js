import React, { useContext } from 'react';
import ContextFileAdmin from '../context/ContextFileAdmin';

const Profiles = () => {
  const { adminName, adminRole } = useContext(ContextFileAdmin); // Use context here

  return <div>Hello, {adminName} {adminRole}</div>;
};

export default Profiles;
