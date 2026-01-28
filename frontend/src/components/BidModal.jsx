import React, { useState, useEffect } from 'react';
import { X, TrendingUp, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

const BidModal = ({ item, onClose, onPlaceBid, isSubmitting }) => {
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      const minBid = item.currentBid + 1;
      setBidAmount(minBid.toFixed(2));
    }
  }, [item]);

  if (!item) return null;

  const minBid = item.currentBid + 1;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const amount = parseFloat(bidAmount);

    if (isNaN(amount)) {
      setError('Please enter a valid amount');
      return;
    }

    if (amount < minBid) {
      setError(`Bid must be at least ${formatCurrency(minBid)}`);
      return;
    }

    onPlaceBid(amount);
  };

  const quickBids = [
    { label: 'Min', value: minBid },
    { label: '+$10', value: item.currentBid + 10 },
    { label: '+$50', value: item.currentBid + 50 },
    { label: '+$100', value: item.currentBid + 100 },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Place Your Bid</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Item Info */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg text-gray-900 mb-2">{item.title}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-primary-500" />
                <span>Current Bid: <span className="font-bold text-gray-900">{formatCurrency(item.currentBid)}</span></span>
              </div>
              <div>
                Bids: <span className="font-semibold">{item.bidCount}</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Bid Amount Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Bid Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min={minBid}
                  value={bidAmount}
                  onChange={(e) => {
                    setBidAmount(e.target.value);
                    setError('');
                  }}
                  className="input-field pl-8 text-lg font-semibold"
                  placeholder={minBid.toFixed(2)}
                  autoFocus
                  disabled={isSubmitting}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Minimum bid: {formatCurrency(minBid)}
              </p>
            </div>

            {/* Quick Bid Buttons */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Bids
              </label>
              <div className="grid grid-cols-4 gap-2">
                {quickBids.map((quick) => (
                  <button
                    key={quick.label}
                    type="button"
                    onClick={() => {
                      setBidAmount(quick.value.toFixed(2));
                      setError('');
                    }}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-lg transition-colors"
                    disabled={isSubmitting}
                  >
                    {quick.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Placing...
                  </span>
                ) : (
                  'Place Bid'
                )}
              </button>
            </div>
          </form>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> Bids placed in the final minute may extend the auction by 30 seconds to prevent sniping.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BidModal;