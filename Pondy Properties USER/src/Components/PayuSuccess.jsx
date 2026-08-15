

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const PaymentSuccess = () => {
  const searchParams = new URLSearchParams(useLocation().search);
  const mihpayid = searchParams.get('mihpayid');
  const amount = searchParams.get('amount');
  const firstname = searchParams.get('firstname');
  const email = searchParams.get('email');
  const phone = searchParams.get('phone');
  const status = searchParams.get('status');
  const payUdate = searchParams.get('payUdate'); // 👈 Get payUdate from URL
  const planName = searchParams.get('planName'); // 👈 Get payUdate from URL

  // Format the date if available
  const formattedDate = payUdate
    ? new Date(payUdate).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'N/A';
     const navigate = useNavigate();

  const handleClick = () => {
    navigate('/my-plan');  // navigate to a route
  };
  return (
 
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
          backgroundColor: '#dcfce7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '1rem'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.86" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 4L12 14.01L9 11.01" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <h1 style={{
            color: '#16a34a',
            fontSize: '1.5rem',
            fontWeight: '600',
            margin: '0'
          }}>Payment Successful!</h1>
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
          <span style={{ color: '#111827', fontWeight: '600' }}>{mihpayid}</span>
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
            color: '#16a34a', 
            fontWeight: '600',
            backgroundColor: '#dcfce7',
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
        {/* <button style={{
          flex: '1',
          backgroundColor: '#16a34a',
          color: 'white',
          border: 'none',
          padding: '0.75rem',
          borderRadius: '6px',
          fontWeight: '500',
          fontSize: '0.875rem',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}>
          View Receipt
        </button> */}
        <button style={{
          flex: '1',
          backgroundColor: '#2196F3',
          color: '#fff',
          border: '1px solid #D1D5DB',
          padding: '0.75rem',
          borderRadius: '6px',
          fontWeight: '500',
          fontSize: '0.875rem',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onClick={handleClick}  
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
