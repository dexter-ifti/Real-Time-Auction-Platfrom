import React, { useState, useEffect } from 'react';
import { Clock, TrendingUp, Users, Gavel } from 'lucide-react';
import { formatCurrency, formatTimeRemaining, getTimeRemainingColor } from '../utils/helpers';

const AuctionCard = ({ item, onBidClick, onQuickBid, isActive, currentUserId }) => {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isEnding, setIsEnding] = useState(false);
  const [priceFlash, setPriceFlash] = useState(false);
  const [previousBid, setPreviousBid] = useState(item.currentBid);

  useEffect(() => {
    const updateTimer = () => {
      const remaining = formatTimeRemaining(item.auctionEndTime);
      setTimeRemaining(remaining);

      const now = new Date();
      const end = new Date(item.auctionEndTime);
      const diff = (end - now) / 1000;
      setIsEnding(diff > 0 && diff < 60);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [item.auctionEndTime]);

  // Trigger price flash animation when bid changes
  useEffect(() => {
    if (item.currentBid !== previousBid) {
      setPriceFlash(true);
      setPreviousBid(item.currentBid);
      const timer = setTimeout(() => setPriceFlash(false), 600);
      return () => clearTimeout(timer);
    }
  }, [item.currentBid, previousBid]);

  const isHighestBidder = item.currentBidder?.userId === currentUserId;
  const hasEnded = item.status === 'ended' || new Date() >= new Date(item.auctionEndTime);

  // Check if user has been outbid (had highest bid before but not anymore)
  const wasOutbid = item.previousBidders?.includes(currentUserId) && !isHighestBidder && !hasEnded;

  return (
    <div
      className={`card hover:shadow-xl transition-all duration-300 ${isActive ? 'ring-2 ring-primary-500' : ''
        } ${isEnding ? 'animate-pulse-fast' : ''}`}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gray-200">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
          }}
        />

        {/* Status Badge */}
        {hasEnded && (
          <div className="absolute top-2 right-2 px-3 py-1 bg-gray-800 text-white text-xs font-semibold rounded-full">
            ENDED
          </div>
        )}

        {/* Winning Badge */}
        {isHighestBidder && !hasEnded && (
          <div className="absolute top-2 right-2 px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full shadow-lg">
            WINNING
          </div>
        )}

        {/* Outbid Badge */}
        {wasOutbid && (
          <div className="absolute top-2 right-2 px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-full shadow-lg animate-pulse">
            OUTBID
          </div>
        )}

        {/* Category */}
        {item.category && (
          <div className="absolute top-2 left-2 px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-medium rounded-full">
            {item.category}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {item.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {item.description}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            <div>
              <div className="text-xs text-gray-500">Current Bid</div>
              <div className={`font-bold text-gray-900 transition-all duration-300 ${priceFlash ? 'animate-bid-placed scale-110' : ''
                }`}>
                {formatCurrency(item.currentBid)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" />
            <div>
              <div className="text-xs text-gray-500">Bids</div>
              <div className="font-bold text-gray-900">{item.bidCount}</div>
            </div>
          </div>
        </div>

        {/* Time Remaining */}
        <div className="flex items-center gap-2 mb-4">
          <Clock className={`w-4 h-4 ${getTimeRemainingColor(item.auctionEndTime)}`} />
          <div>
            <div className="text-xs text-gray-500">Time Remaining</div>
            <div className={`font-semibold ${getTimeRemainingColor(item.auctionEndTime)}`}>
              {timeRemaining}
            </div>
          </div>
        </div>

        {/* Current Bidder */}
        {item.currentBidder && (
          <div className="text-xs text-gray-600 mb-3">
            {isHighestBidder ? (
              <span className="text-green-600 font-medium">You are the highest bidder!</span>
            ) : (
              <span>
                Highest bidder: <span className="font-medium">{item.currentBidder.userName}</span>
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Quick +$10 Bid Button */}
          {!hasEnded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickBid(item, item.currentBid + 10);
              }}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors duration-200 flex items-center gap-1 shadow-md hover:shadow-lg"
              title="Quick bid +$10"
            >
              <TrendingUp className="w-4 h-4" />
              +$10
            </button>
          )}

          {/* Main Bid Button */}
          <button
            onClick={() => onBidClick(item)}
            disabled={hasEnded}
            className={`flex-1 btn-primary flex items-center justify-center gap-2 ${hasEnded ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            <Gavel className="w-4 h-4" />
            {hasEnded ? 'Auction Ended' : 'Place Bid'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuctionCard;