import axios from 'axios';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setPhoneNumber } from '../red/userSlice';
import { rememberAfterLogin } from './AfterLoginRedirect';

// Public account-deletion page linked from the Google Play Data safety form
// (User Data policy: Account Deletion Requirement). Anyone can read it, but
// only a logged-in user can delete — and only their own account, identified by
// the phone number stored at OTP login. Deleting someone else's account by
// typing their number must not be possible.
//
// Uses POST /user/self-delete (PPC/user/AccountDeletionRouter.js): removes the
// user's personal data, takes down their listings and buyer requests, removes
// their number from other people's listings, then marks every login record
// 'deleted' so /send-otp refuses the number with "Account deleted".
export default function DeleteAccount() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState({ state: 'idle', msg: '' });

  let storedPhone = null;
  try { storedPhone = localStorage.getItem('phoneNumber'); } catch (e) { /* storage blocked */ }
  const phoneDigits = (storedPhone || '').replace(/\D/g, '').slice(-10);
  const loggedIn = phoneDigits.length === 10;

  const handleDelete = async () => {
    const ok = window.confirm(
      `Delete the Pondy Properties account for +91 ${phoneDigits}?\n\n` +
      'You will be logged out and will not be able to log in with this number again. This cannot be undone.'
    );
    if (!ok) return;

    setStatus({ state: 'deleting', msg: '' });
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/user/self-delete`, {
        phone: phoneDigits,
        reason: reason.trim() || 'Deleted by user from website',
      });
      dispatch(setPhoneNumber(null));
      try {
        localStorage.removeItem('phoneNumber');
        localStorage.removeItem('countryCode');
      } catch (e) { /* storage blocked */ }
      setStatus({ state: 'done', msg: '' });
    } catch (err) {
      setStatus({
        state: 'error',
        msg: 'Could not delete your account right now. Please try again, or email info.ppc@gmail.com.',
      });
    }
  };

  return (
    <div className="container my-5" style={{ maxWidth: 760 }}>
      <h1 className="h3 mb-3">Delete your Pondy Properties account</h1>
      <p>
        Users of the <strong>Pondy Properties</strong> app (Google Play package <code>com.apps.ppcpondy</code>)
        and the pondyproperty.com website can delete their account and associated data here.
      </p>

      <h2 className="h5 mt-4">How to delete your account</h2>
      <ol>
        <li>Log in with your registered mobile number (OTP).</li>
        <li>Open this page (<strong>pondyproperty.com/delete-account</strong>).</li>
        <li>Tap <strong>Delete my account</strong> and confirm.</li>
      </ol>
      <p>
        Can’t log in? Email <a href="mailto:info.ppc@gmail.com?subject=Account%20deletion%20request">info.ppc@gmail.com</a> or
        call <a href="tel:+918300622013">+91 83006 22013</a> from your registered number and we will delete it for you.
      </p>

      <h2 className="h5 mt-4">What is deleted</h2>
      <ul>
        <li>Your account and profile (name, mobile number, email, address)</li>
        <li>Property listings and buyer requirements you posted, with their photos</li>
        <li>Your favourites, contact requests, viewed properties and notifications</li>
        <li>Messages you exchanged with the in-app assistant</li>
      </ul>
      <p>
        All of this is removed as soon as you confirm: your account is closed and your listings are taken off
        the site immediately, and any remaining copies are permanently erased within 30 days.
      </p>

      <h2 className="h5 mt-4">What is kept</h2>
      <ul>
        <li>Payment and invoice records, retained for up to 8 years where Indian tax and accounting law requires</li>
        <li>Records we must keep to resolve disputes, prevent fraud or comply with legal requests</li>
      </ul>

      <div className="card mt-4">
        <div className="card-body">
          {status.state === 'done' ? (
            <>
              <div className="alert alert-success mb-3">
                Your account has been deleted and you have been logged out.
              </div>
              <button type="button" className="btn btn-primary" onClick={() => navigate('/')}>Go to home page</button>
            </>
          ) : loggedIn ? (
            <>
              <p className="mb-3">Logged in as <strong>+91 {phoneDigits}</strong></p>
              <div className="mb-3">
                <label className="form-label" htmlFor="da-reason">Why are you leaving? (optional)</label>
                <textarea id="da-reason" rows={3} className="form-control" value={reason}
                  onChange={(e) => setReason(e.target.value)} />
              </div>
              {status.state === 'error' && <div className="alert alert-danger">{status.msg}</div>}
              <button type="button" className="btn btn-danger" onClick={handleDelete}
                disabled={status.state === 'deleting'}>
                {status.state === 'deleting' ? 'Deleting…' : 'Delete my account'}
              </button>
            </>
          ) : (
            <>
              <p className="mb-3">Please log in with your registered mobile number to delete your account.</p>
              <button type="button" className="btn btn-primary" onClick={() => {
                rememberAfterLogin('/delete-account');
                navigate('/web-login');
              }}>
                Log in to delete account
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
