import React from 'react';
import {  useLocation, useNavigate } from 'react-router-dom';

const PaymentFailureBuyer = () => {
  const searchParams = new URLSearchParams(useLocation().search);
  const mihpayid = searchParams.get('mihpayid');
  const amount = searchParams.get('amount');
  const firstname = searchParams.get('firstname');
  const email = searchParams.get('email');
  const phone = searchParams.get('phone');
    const status = searchParams.get('status');
      const payUdate = searchParams.get('payUdate'); // 👈 Get payUdate from URL
  const planName = searchParams.get('planName');


  const formattedDate = payUdate
    ? new Date(payUdate).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'N/A';
      const navigate = useNavigate();

  const handleClick = () => {
    navigate('/mobileviews');  // navigate to a route
  };

 const handleTryClick = () => {
    navigate('/my-buyer-plan');  // navigate to a route
  };

  return (
   <>
     
      <div style={{
      fontFamily: "'Segoe UI', Roboto, sans-serif",
      maxWidth: '400px',
      margin: '2rem auto',
      padding: '2rem',
      borderRadius: '12px',
      background: 'linear-gradient(135deg, #fff 0%, #f9f9f9 100%)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: '1px solid rgba(0,0,0,0.05)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: '#fee2e2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '1rem'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 8V12" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 16H12.01" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <h1 style={{
            color: '#DC2626',
            fontSize: '1.5rem',
            fontWeight: '600',
            margin: '0'
          }}>Payment Failed!</h1>
          <p style={{
            color: '#6B7280',
            fontSize: '0.875rem',
            margin: '0.25rem 0 0'
          }}>{formattedDate}</p>
        </div>
      </div>

      {/* Transaction Details */}
      <div style={{
        backgroundColor: '#F3F4F6',
        borderRadius: '8px',
        padding: '1.25rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '0.75rem'
        }}>
          <span style={{ color: '#4B5563', fontWeight: '500' }}>Transaction ID:</span>
          <span style={{ color: '#111827', fontWeight: '600' }}> {mihpayid}</span>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '0.75rem'
        }}>
          <span style={{ color: '#4B5563', fontWeight: '500' }}>Amount:</span>
          <span style={{ color: '#111827', fontWeight: '600' }}>₹ {amount}</span>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '0.75rem'
        }}>
          <span style={{ color: '#4B5563', fontWeight: '500' }}>Status:</span>
          <span style={{ 
            color: '#DC2626', 
            fontWeight: '600',
            backgroundColor: '#FEE2E2',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.875rem'
          }}>{status}</span>
        </div>
      </div>

      {/* User Details */}
      <div style={{
        marginBottom: '1.5rem'
      }}>
        <h3 style={{
          color: '#374151',
          fontSize: '1rem',
          fontWeight: '600',
          marginBottom: '1rem',
          paddingBottom: '0.5rem',
          borderBottom: '1px solid #E5E7EB'
        }}>Customer Details</h3>
        
        <div style={{ marginBottom: '0.75rem' }}>
          <p style={{ 
            color: '#6B7280',
            fontSize: '0.875rem',
            margin: '0 0 0.25rem'
          }}>Name</p>
          <p style={{ 
            color: '#111827',
            fontWeight: '500',
            margin: '0'
          }}>{firstname}</p>
        </div>
        
        <div style={{ marginBottom: '0.75rem' }}>
          <p style={{ 
            color: '#6B7280',
            fontSize: '0.875rem',
            margin: '0 0 0.25rem'
          }}>Email</p>
          <p style={{ 
            color: '#111827',
            fontWeight: '500',
            margin: '0'
          }}>{email}</p>
        </div>
        
        <div style={{ marginBottom: '0.75rem' }}>
          <p style={{ 
            color: '#6B7280',
            fontSize: '0.875rem',
            margin: '0 0 0.25rem'
          }}>Phone</p>
          <p style={{ 
            color: '#111827',
            fontWeight: '500',
            margin: '0'
          }}>{phone}</p>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button style={{
          flex: '1',
          backgroundColor: '#2563EB',
          color: 'white',
          border: 'none',
          padding: '0.75rem',
          borderRadius: '6px',
          fontWeight: '500',
          fontSize: '0.875rem',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onClick={handleTryClick}  >
          Try Again
        </button>
        <button style={{
          flex: '1',
          backgroundColor: 'white',
          color: '#374151',
          border: '1px solid #D1D5DB',
          padding: '0.75rem',
          borderRadius: '6px',
          fontWeight: '500',
          fontSize: '0.875rem',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
onClick={handleClick}        >
          Go To Home
        </button>
      </div>
    </div>
    </>
  );
};

export default PaymentFailureBuyer;
