import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFollowups } from '../contexts/FollowupContext';

/*
 * <PhoneCell />
 * --------------
 * Renders a phone number with a colour cue based on follow-up state:
 *   - Red underline   → no follow-up exists for this phone (action needed)
 *   - Green underline → follow-up has been created
 *
 * Double-clicking the number navigates to the matching create-followup page:
 *   - type="owner"  → /dashboard/create-followup        with state { ppcId, phoneNumber }
 *   - type="tenant" → /dashboard/create-followup-buyer  with state { ba_id, phoneNumber }
 *
 * Drop-in usage: replace `{item.phoneNumber}` (or wrap an existing <td>) with
 *   <PhoneCell phone={item.phoneNumber} type="owner"  ppcId={item.ppcId} />
 *   <PhoneCell phone={item.phoneNumber} type="tenant" ba_id={item.ba_id}  />
 *
 * Pass `onDoubleClick` to override the default navigation — e.g. the Login
 * (OTP) Report opens a quick create-follow-up modal in place instead of
 * routing to a create page. When provided, the built-in navigation is skipped.
 */
const PhoneCell = ({
  phone,
  type,                 // "owner" | "tenant" | "visitor" | "ring" | "any"
  ppcId,
  ba_id,
  baId,                 // accepted as alias to match existing prop names
  display,              // optional override for what to render (defaults to phone)
  className = '',
  style = {},
  title,
  onDoubleClick,        // optional: (phone) => void — overrides default navigation
}) => {
  const navigate = useNavigate();
  const { hasFollowup, loaded } = useFollowups();

  const finalBaId = ba_id || baId;
  const inferredType = type || (finalBaId ? 'tenant' : 'owner');
  const exists = hasFollowup(phone, inferredType);

  const handleDoubleClick = useCallback((e) => {
    e.stopPropagation();
    if (!phone) return;
    if (onDoubleClick) {
      onDoubleClick(phone);
      return;
    }
    if (inferredType === 'tenant') {
      navigate('/dashboard/create-followup-buyer', {
        state: { ba_id: finalBaId, phoneNumber: phone },
      });
    } else {
      navigate('/dashboard/create-followup', {
        state: { ppcId, phoneNumber: phone },
      });
    }
  }, [navigate, inferredType, phone, ppcId, finalBaId, onDoubleClick]);

  // Loading state: render plain text (avoid flashing red while we fetch).
  if (!loaded) {
    return <span className={className} style={style}>{display ?? phone ?? '—'}</span>;
  }

  if (!phone) {
    return <span className={className} style={style}>{display ?? '—'}</span>;
  }

  const colour = exists ? '#16a34a' : '#dc2626'; // green-600 / red-600
  return (
    <span
      role="button"
      tabIndex={0}
      onDoubleClick={handleDoubleClick}
      title={
        title ??
        (exists
          ? 'Follow-up already created — double-click to add another'
          : 'No follow-up yet — double-click to create one')
      }
      className={className}
      style={{
        color: colour,
        textDecoration: 'underline',
        textDecorationColor: colour,
        textUnderlineOffset: '3px',
        textDecorationThickness: '2px',
        cursor: 'pointer',
        fontWeight: 600,
        userSelect: 'text',
        ...style,
      }}
    >
      {display ?? phone}
    </span>
  );
};

export default PhoneCell;
