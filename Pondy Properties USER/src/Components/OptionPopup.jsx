import React from 'react';
import { FaTimes, FaCheck } from 'react-icons/fa';

const OptionPopup = ({ 
  title, 
  options, 
  onSelect, 
  onClose, 
  selectedValues = [],
  isMultiSelect = false,
  onSearch = null,
  onNext = null
}) => {
  const isSelected = (value) => {
    if (Array.isArray(selectedValues)) {
      return selectedValues.includes(value);
    }
    return selectedValues === value;
  };

  const handleOptionClick = (value) => {
    if (isMultiSelect) {
      // Toggle selection for multi-select
      if (isSelected(value)) {
        const newValues = selectedValues.filter(v => v !== value);
        onSelect(newValues);
      } else {
        onSelect([...selectedValues, value]);
      }
    } else {
      // Single select - close popup after selection
      onSelect(value);
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        animation: 'fadeIn 0.3s ease-in',
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>

      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '0',
          width: '90%',
          maxWidth: '400px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          animation: 'slideUp 0.3s ease-out',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: '#6CBAAF',
            color: '#fff',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #5a9a95',
          }}
        >
          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
            {title}
          </h4>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
            }}
          >
            <FaTimes />
          </button>
        </div>

        {/* Options */}
        <div
          style={{
            padding: '12px',
            overflowY: 'auto',
            maxHeight: 'calc(80vh - 100px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {options.map((option) => (
            <div
              key={option}
              onClick={() => handleOptionClick(option)}
              style={{
                padding: '12px 14px',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: isSelected(option) ? '#E8F5F3' : '#fff',
                borderColor: isSelected(option) ? '#6CBAAF' : '#e0e0e0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F0F9F7';
                e.currentTarget.style.borderColor = '#6CBAAF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isSelected(option) ? '#E8F5F3' : '#fff';
                e.currentTarget.style.borderColor = isSelected(option) ? '#6CBAAF' : '#e0e0e0';
              }}
            >
              <span
                style={{
                  color: '#2F747F',
                  fontWeight: isSelected(option) ? 600 : 500,
                  fontSize: '14px',
                }}
              >
                {option}
              </span>
              {isSelected(option) && (
                <FaCheck style={{ color: '#6CBAAF', fontSize: '14px' }} />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#F9F9F9',
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f0f0f0',
              color: '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '12px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e0e0e0')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
          >
            Skip
          </button>
          {onSearch && (
            <button
              onClick={() => {
                onSearch();
                onClose();
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6CBAAF',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '12px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#5a9a95')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#6CBAAF')}
            >
              Search
            </button>
          )}
          {onNext && (
            <button
              onClick={() => {
                onNext();
                onClose();
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6CBAAF',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '12px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#5a9a95')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#6CBAAF')}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OptionPopup;
