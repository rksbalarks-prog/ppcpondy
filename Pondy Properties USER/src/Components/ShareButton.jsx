import { useState } from 'react';

const ShareButton = ({ propertyId }) => {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/property/${propertyId}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copyToClipboard}
      className="bg-blue-600 text-white px-4 py-2 rounded"
    >
      {copied ? 'Link Copied!' : 'Share'}
    </button>
  );
};

export default ShareButton;
