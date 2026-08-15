import React from 'react';
import {
  LuMapPin,
  LuBedDouble,
  LuMaximize2,
  LuUser,
  LuCalendar,
  LuPencil,
  LuTrash2,
  LuBadgeCheck,
  LuCrown,
  LuCreditCard,
  LuUndo2,
} from 'react-icons/lu';
import pic from '../Assets/default.png';
import './PremiumPropertyCard.css';

const formatIndianNumber = (n) => {
  const s = String(n);
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + (rest ? ',' : '') + last3;
};

const formatPrice = (price) => {
  const n = Number(price);
  if (!Number.isFinite(n)) return 'N/A';
  if (n >= 10000000) return (n / 10000000).toFixed(2) + ' Cr';
  if (n >= 100000) return (n / 100000).toFixed(2) + ' L';
  return formatIndianNumber(n);
};

const formatLocation = (user) => {
  const parts = [user.nagar, user.area, user.city, user.district, user.state]
    .filter((v) => v !== null && v !== undefined && v !== '')
    .slice(0, 3)
    .map((v) => v.charAt(0).toUpperCase() + v.slice(1).toLowerCase());
  return parts.length ? parts.join(', ') : 'N/A, N/A';
};

const formatDate = (iso) => {
  if (!iso) return 'N/A';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Premium real-estate property card.
 *
 * Props:
 *   user        — the property object from the API
 *   onCardClick — fired when the card body is clicked
 *   onEdit      — fired when Edit pressed
 *   onRemove    — fired when Remove pressed
 *   onPay       — fired when Pay Now pressed (only shown when unpaid)
 *   onUndo      — fired when Undo pressed (Removed tab variant)
 *   variant     — "active" (default) or "removed"
 */
export default function PremiumPropertyCard({
  user,
  onCardClick,
  onEdit,
  onRemove,
  onPay,
  onUndo,
  variant = 'active',
}) {
  const isPaid = user.payustatususer === 'paid';
  const isPremium = isPaid; // visual premium frame trigger
  const isVerified = user.status === 'active';

  const statusLabel = isVerified
    ? 'Approved'
    : user.status === 'complete'
    ? 'Pre-Approved'
    : 'Pending';

  const statusClass = isVerified
    ? 'ppc-status-approved'
    : user.status === 'complete'
    ? 'ppc-status-preapproved'
    : 'ppc-status-pending';

  const imageSrc = user.photos?.length
    ? `https://ppcpondy.com/PPC/${user.photos[0]}`
    : pic;

  const dateLabel =
    user.updatedAt && user.updatedAt !== user.createdAt
      ? formatDate(user.updatedAt)
      : formatDate(user.createdAt);

  const altText = `${user.ppcId || 'N/A'}-${user.propertyMode || 'N/A'}-${
    user.propertyType || 'N/A'
  }-rs-${user.price || '0'}-in-${user.city || ''}-${user.area || ''}-${
    user.state || ''
  }`
    .replace(/\s+/g, '-')
    .replace(/,+/g, '-')
    .toLowerCase();

  const stop = (e) => e.stopPropagation();

  return (
    <div
      className={`ppc-card ${isPremium ? 'ppc-premium' : ''}`}
      onClick={onCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onCardClick && onCardClick();
        }
      }}
    >
      {/* Corner ribbon — appears across the top-right corner of the
          ENTIRE card when paid. Pointer-events disabled so it never
          blocks clicks on the card body. */}
      {isPaid && (
        <div className="ppc-ribbon-wrap" aria-hidden="true">
          <div className="ppc-ribbon">PAID</div>
        </div>
      )}

      {/* Image side */}
      <div className="ppc-image-wrap">
        <img className="ppc-image" src={imageSrc} alt={altText} />
        <div className="ppc-image-overlay" />

        <div className="ppc-badges">
          {isPaid && (
            <span className="ppc-badge ppc-badge-premium">
              <LuCrown />
              Premium
            </span>
          )}
          {isVerified && (
            <span className="ppc-badge ppc-badge-verified">
              <LuBadgeCheck />
              Verified
            </span>
          )}
        </div>

        <div className={`ppc-status ${statusClass}`}>{statusLabel}</div>
      </div>

      {/* Details side */}
      <div className="ppc-details">
        <div className="ppc-eyebrow">
          <span className="ppc-eyebrow-left">
            <span className="ppc-puc-pill">PUC-{user.ppcId}</span>
            <span className="ppc-eyebrow-sep">·</span>
            <span>
              {user.propertyMode
                ? user.propertyMode.charAt(0).toUpperCase() +
                  user.propertyMode.slice(1)
                : 'N/A'}
            </span>
          </span>
          {user.featureStatus === 'yes' && <span>★ Featured</span>}
        </div>

        <h3 className="ppc-title">
          {user.propertyType
            ? user.propertyType.charAt(0).toUpperCase() +
              user.propertyType.slice(1)
            : 'N/A'}
        </h3>

        <div className="ppc-location">
          <LuMapPin size={13} />
          <span>{formatLocation(user)}</span>
        </div>

        <div className="ppc-specs">
          <div className="ppc-spec">
            <LuMaximize2 />
            <span className="ppc-spec-value">{user.totalArea || 'N/A'}</span>
            <span>
              {user.areaUnit
                ? user.areaUnit.charAt(0).toUpperCase() + user.areaUnit.slice(1)
                : ''}
            </span>
          </div>
          <div className="ppc-spec">
            <LuBedDouble />
            <span className="ppc-spec-value">{user.bedrooms || 'N/A'}</span>
            <span>BHK</span>
          </div>
          <div className="ppc-spec">
            <LuUser />
            <span>
              {user.ownership
                ? user.ownership.charAt(0).toUpperCase() +
                  user.ownership.slice(1)
                : 'N/A'}
            </span>
          </div>
          <div className="ppc-spec">
            <LuCalendar />
            <span>{dateLabel}</span>
          </div>
        </div>

        <div className="ppc-price-row">
          <span className="ppc-price">
            <span className="ppc-price-currency">₹</span>
            {user.price ? formatPrice(user.price) : 'N/A'}
          </span>
          <span
            className={`ppc-negotiable ${
              user.negotiation === 'Yes' ? '' : 'ppc-non-neg'
            }`}
          >
            {user.negotiation === 'Yes' ? 'Negotiable' : 'Non-Neg.'}
          </span>
        </div>

        {user.paymentDisplayStatus && user.paymentDisplayStatus !== 'N/A' && (
          <div className="ppc-meta-line">{user.paymentDisplayStatus}</div>
        )}

        <div className="ppc-actions">
          {variant === 'removed' ? (
            <button
              type="button"
              className="ppc-btn ppc-btn-undo"
              onClick={(e) => {
                stop(e);
                onUndo && onUndo();
              }}
            >
              <LuUndo2 />
              Undo
            </button>
          ) : (
            <>
              <button
                type="button"
                className="ppc-btn ppc-btn-remove"
                onClick={(e) => {
                  stop(e);
                  onRemove && onRemove();
                }}
              >
                <LuTrash2 />
                Remove
              </button>
              <button
                type="button"
                className="ppc-btn ppc-btn-edit"
                onClick={(e) => {
                  stop(e);
                  onEdit && onEdit();
                }}
              >
                <LuPencil />
                Edit
              </button>
              {!isPaid && (
                <button
                  type="button"
                  className="ppc-btn ppc-btn-pay"
                  onClick={(e) => {
                    stop(e);
                    onPay && onPay();
                  }}
                >
                  <LuCreditCard />
                  Pay Now
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
