const logger = require('../utils/logger');
const { bidSchema } = require('../validators/schemas');

/**
 * Initialize Socket.IO event handlers
 */
function initializeSocketHandlers(io, auctionManager) {
  // Middleware for socket authentication (can be enhanced with JWT)
  io.use((socket, next) => {
    const userId = socket.handshake.auth.userId;
    const userName = socket.handshake.auth.userName;

    if (!userId || !userName) {
      return next(new Error('Authentication required'));
    }

    socket.userId = userId;
    socket.userName = userName;
    next();
  });

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.userName} (${socket.userId})`);

    // Track active connections per user
    socket.on('JOIN_AUCTION', (data) => {
      const { itemId } = data;
      socket.join(`auction:${itemId}`);
      logger.info(`${socket.userName} joined auction ${itemId}`);

      // Send current item state
      const item = auctionManager.getItem(itemId);
      if (item) {
        socket.emit('AUCTION_STATE', { item });
      }
    });

    // Handle bid placement
    socket.on('PLACE_BID', async (data) => {
      try {
        // Validate input
        const { error, value } = bidSchema.validate({
          ...data,
          userId: socket.userId,
          userName: socket.userName,
        });

        if (error) {
          socket.emit('BID_ERROR', {
            error: error.details[0].message,
            itemId: data.itemId,
          });
          return;
        }

        const { itemId, amount } = value;

        // Log bid attempt with timestamp for debugging race conditions
        const attemptTime = new Date();
        logger.info(
          `Bid attempt: ${socket.userName} - $${amount} on ${itemId} at ${attemptTime.toISOString()}`
        );

        // Place bid (with mutex protection against race conditions)
        const result = await auctionManager.placeBid(
          itemId,
          amount,
          socket.userId,
          socket.userName
        );

        // Emit success to the bidder
        socket.emit('BID_SUCCESS', {
          item: result.item,
          bidRecord: result.bidRecord,
          message: 'Your bid has been placed successfully!',
        });

        // Broadcast updated bid to all clients in the auction room
        io.to(`auction:${itemId}`).emit('BID_UPDATE', {
          item: result.item,
          bidder: {
            userId: socket.userId,
            userName: socket.userName,
          },
          timestamp: result.bidRecord.timestamp,
        });

        // Notify previous bidder they've been outbid
        if (result.previousBidder) {
          io.to(`auction:${itemId}`).emit('OUTBID_NOTIFICATION', {
            itemId,
            itemTitle: result.item.title,
            previousAmount: result.bidRecord.amount,
            newAmount: amount,
            newBidder: socket.userName,
            userId: result.previousBidder.userId,
          });
        }

        logger.info(
          `Bid successful: ${socket.userName} - $${amount} on ${result.item.title}`
        );
      } catch (error) {
        // Handle specific error cases
        let errorMessage = error.message;
        let errorCode = 'BID_FAILED';

        if (error.message.includes('already the highest bidder')) {
          errorCode = 'SELF_OUTBID';
        } else if (error.message.includes('Auction has ended')) {
          errorCode = 'AUCTION_ENDED';
        } else if (error.message.includes('must be at least')) {
          errorCode = 'BID_TOO_LOW';
        }

        socket.emit('BID_ERROR', {
          error: errorMessage,
          errorCode,
          itemId: data.itemId,
        });

        logger.warn(
          `Bid rejected: ${socket.userName} - ${errorMessage} - Item: ${data.itemId}`
        );
      }
    });

    // Leave auction room
    socket.on('LEAVE_AUCTION', (data) => {
      const { itemId } = data;
      socket.leave(`auction:${itemId}`);
      logger.info(`${socket.userName} left auction ${itemId}`);
    });

    // Get bid history
    socket.on('GET_BID_HISTORY', (data) => {
      const { itemId } = data;
      const history = auctionManager.getBidHistory(itemId);
      socket.emit('BID_HISTORY', { itemId, history });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(
        `Client disconnected: ${socket.userName} (${socket.userId}) - Reason: ${reason}`
      );
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.userName}: ${error.message}`);
    });
  });

  // Periodic auction status updates
  setInterval(() => {
    const items = auctionManager.getAllItems();
    
    items.forEach((item) => {
      const timeRemaining = new Date(item.auctionEndTime) - new Date();
      
      // Notify all users in auction room of time updates
      if (timeRemaining > 0 && timeRemaining < 60000) { // Last minute
        io.to(`auction:${item.id}`).emit('TIME_WARNING', {
          itemId: item.id,
          timeRemaining: Math.floor(timeRemaining / 1000),
        });
      }
      
      // Close ended auctions
      if (timeRemaining <= 0 && item.status === 'active') {
        item.status = 'ended';
        io.to(`auction:${item.id}`).emit('AUCTION_ENDED', {
          item,
          winner: item.currentBidder,
        });
        logger.info(`Auction ended - ${item.title} - Winner: ${item.currentBidder?.userName || 'No bids'}`);
      }
    });
  }, 5000); // Check every 5 seconds

  logger.info('Socket.IO event handlers initialized');
}

module.exports = initializeSocketHandlers;