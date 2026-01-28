import React, { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Gavel, Wifi, WifiOff, User } from 'lucide-react';
import AuctionCard from './components/AuctionCard';
import BidModal from './components/BidModal';
import socketService from './services/socketService';
import { auctionAPI } from './services/apiService';
import { getUserCredentials, formatCurrency } from './utils/helpers';

function App() {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userCredentials, setUserCredentials] = useState(null);

  // Initialize user and connect to socket
  useEffect(() => {
    const credentials = getUserCredentials();
    setUserCredentials(credentials);

    // Connect to socket
    socketService.connect(credentials.userId, credentials.userName);
    setIsConnected(socketService.isConnected());

    // Load initial items
    loadItems();

    return () => {
      socketService.disconnect();
    };
  }, []);

  // Setup socket event listeners
  useEffect(() => {
    if (!userCredentials) return;

    // Connection events
    socketService.on('connect', () => {
      setIsConnected(true);
      toast.success('Connected to auction server', { icon: '🟢' });
    });

    socketService.on('disconnect', () => {
      setIsConnected(false);
      toast.error('Disconnected from server', { icon: '🔴' });
    });

    // Bid events
    socketService.on('BID_SUCCESS', (data) => {
      const { item } = data;

      // Update item in list immediately when user places a bid
      setItems((prevItems) =>
        prevItems.map((i) => (i.id === item.id ? item : i))
      );
    });

    socketService.on('BID_UPDATE', (data) => {
      const { item, bidder } = data;

      // Update item in list
      setItems((prevItems) =>
        prevItems.map((i) => (i.id === item.id ? item : i))
      );

      // Show toast notification
      if (bidder.userId !== userCredentials.userId) {
        toast(`${bidder.userName} placed a bid!`, {
          icon: '🔨',
          duration: 3000,
        });
      }
    });

    socketService.on('OUTBID_NOTIFICATION', (data) => {
      const { itemTitle, newAmount, newBidder, userId } = data;

      if (userId === userCredentials.userId) {
        toast.error(`You've been outbid on ${itemTitle}!`, {
          icon: '😮',
          duration: 5000,
        });
      }
    });

    socketService.on('AUCTION_ENDED', (data) => {
      const { item, winner } = data;

      setItems((prevItems) =>
        prevItems.map((i) => (i.id === item.id ? { ...item, status: 'ended' } : i))
      );

      if (winner?.userId === userCredentials.userId) {
        toast.success(`Congratulations! You won ${item.title}!`, {
          icon: '🎉',
          duration: 10000,
        });
      } else {
        toast(`Auction ended: ${item.title}`, {
          icon: '⏰',
        });
      }
    });

    socketService.on('TIME_WARNING', (data) => {
      const { itemId, timeRemaining } = data;

      // Use functional update to avoid stale closure
      setItems((prevItems) => {
        const item = prevItems.find((i) => i.id === itemId);

        if (item && timeRemaining === 30) {
          toast(`⚠️ ${item.title} ending in ${timeRemaining} seconds!`, {
            duration: 3000,
          });
        }

        return prevItems;
      });
    });

    return () => {
      socketService.removeAllListeners('connect');
      socketService.removeAllListeners('disconnect');
      socketService.removeAllListeners('BID_SUCCESS');
      socketService.removeAllListeners('BID_UPDATE');
      socketService.removeAllListeners('OUTBID_NOTIFICATION');
      socketService.removeAllListeners('AUCTION_ENDED');
      socketService.removeAllListeners('TIME_WARNING');
    };
  }, [userCredentials]); // Removed 'items' dependency to prevent stale closures

  const loadItems = async () => {
    try {
      setIsLoading(true);
      const response = await auctionAPI.getAllItems();
      setItems(response.data);
    } catch (error) {
      toast.error('Failed to load auction items');
      console.error('Error loading items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBidClick = useCallback((item) => {
    if (item.status === 'ended' || new Date() >= new Date(item.auctionEndTime)) {
      toast.error('This auction has ended');
      return;
    }

    setSelectedItem(item);
    socketService.joinAuction(item.id);
  }, []);

  const handlePlaceBid = async (amount) => {
    if (!selectedItem || !userCredentials) return;

    setIsSubmitting(true);

    try {
      await socketService.placeBid(selectedItem.id, amount);

      toast.success('Bid placed successfully!', {
        icon: '✅',
        duration: 3000,
      });

      setSelectedItem(null);
    } catch (error) {
      toast.error(error.message || 'Failed to place bid', {
        icon: '❌',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickBid = async (item, amount) => {
    if (!userCredentials) return;

    if (item.status === 'ended' || new Date() >= new Date(item.auctionEndTime)) {
      toast.error('This auction has ended');
      return;
    }

    try {
      // Join the auction room to receive updates
      socketService.joinAuction(item.id);

      await socketService.placeBid(item.id, amount);

      toast.success(`Quick bid of ${formatCurrency(amount)} placed!`, {
        icon: '⚡',
        duration: 2000,
      });
    } catch (error) {
      toast.error(error.message || 'Failed to place quick bid', {
        icon: '❌',
        duration: 4000,
      });
    }
  };

  const handleCloseModal = () => {
    if (selectedItem) {
      socketService.leaveAuction(selectedItem.id);
    }
    setSelectedItem(null);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Gavel className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Live Auctions</h1>
                <p className="text-sm text-gray-600">Real-time bidding platform</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* User Info */}
              {userCredentials && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {userCredentials.userName}
                  </span>
                </div>
              )}

              {/* Connection Status */}
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isConnected
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
                  }`}
              >
                {isConnected ? (
                  <>
                    <Wifi className="w-4 h-4" />
                    <span className="text-sm font-medium">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4" />
                    <span className="text-sm font-medium">Disconnected</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="card animate-shimmer h-96" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Gavel className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Active Auctions
            </h3>
            <p className="text-gray-500">Check back later for new items!</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800">
                Active Auctions ({items.filter(i => i.status === 'active').length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item) => (
                <AuctionCard
                  key={item.id}
                  item={item}
                  onBidClick={handleBidClick}
                  onQuickBid={handleQuickBid}
                  isActive={selectedItem?.id === item.id}
                  currentUserId={userCredentials?.userId}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Bid Modal */}
      {selectedItem && (
        <BidModal
          item={selectedItem}
          onClose={handleCloseModal}
          onPlaceBid={handlePlaceBid}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

export default App;