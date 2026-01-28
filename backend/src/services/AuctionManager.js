const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Mutex implementation for handling concurrent bid operations
 * Ensures only one bid can be processed at a time per auction item
 */
class Mutex {
  constructor() {
    this.queue = [];
    this.locked = false;
  }

  async acquire() {
    return new Promise((resolve) => {
      if (!this.locked) {
        this.locked = true;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }

  release() {
    if (this.queue.length > 0) {
      const resolve = this.queue.shift();
      resolve();
    } else {
      this.locked = false;
    }
  }
}

/**
 * AuctionManager - Handles all auction-related operations with concurrency control
 */
class AuctionManager {
  constructor() {
    this.items = new Map();
    this.mutexes = new Map(); // One mutex per item for fine-grained locking
    this.bidHistory = new Map();
    this.initializeSampleData();
  }

  /**
   * Initialize with sample auction items
   */
  initializeSampleData() {
    const sampleItems = [
      {
        id: uuidv4(),
        title: 'Vintage Rolex Submariner 1960s',
        description: 'Rare vintage Rolex watch in excellent condition',
        startingPrice: 5000.00,
        currentBid: 5000.00,
        imageUrl: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49',
        category: 'Watches',
        auctionEndTime: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
        currentBidder: null,
        bidCount: 0,
        status: 'active',
        createdAt: new Date(),
        previousBidders: [], // Track users who have been outbid
      },
      {
        id: uuidv4(),
        title: 'MacBook Pro 16" M3 Max 2024',
        description: 'Brand new sealed MacBook Pro with M3 Max chip, 64GB RAM',
        startingPrice: 2500.00,
        currentBid: 2500.00,
        imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8',
        category: 'Electronics',
        auctionEndTime: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        currentBidder: null,
        bidCount: 0,
        status: 'active',
        createdAt: new Date(),
        previousBidders: [],
      },
      {
        id: uuidv4(),
        title: 'Limited Edition Air Jordan 1 Chicago',
        description: 'Size 10, deadstock condition with original box',
        startingPrice: 800.00,
        currentBid: 800.00,
        imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
        category: 'Sneakers',
        auctionEndTime: new Date(Date.now() + 3 * 60 * 1000), // 3 minutes
        currentBidder: null,
        bidCount: 0,
        status: 'active',
        createdAt: new Date(),
      },
      {
        id: uuidv4(),
        title: 'Sony A7R V Mirrorless Camera',
        description: 'Professional full-frame camera with 61MP sensor',
        startingPrice: 3200.00,
        currentBid: 3200.00,
        imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32',
        category: 'Cameras',
        auctionEndTime: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        currentBidder: null,
        bidCount: 0,
        status: 'active',
        createdAt: new Date(),
      },
    ];

    sampleItems.forEach((item) => {
      this.items.set(item.id, item);
      this.mutexes.set(item.id, new Mutex());
      this.bidHistory.set(item.id, []);
    });

    logger.info(`Initialized ${sampleItems.length} sample auction items`);
  }

  /**
   * Get all auction items
   */
  getAllItems() {
    const items = Array.from(this.items.values());

    // Update status for ended auctions
    items.forEach((item) => {
      if (new Date() >= new Date(item.auctionEndTime) && item.status === 'active') {
        item.status = 'ended';
      }
    });

    return items;
  }

  /**
   * Get a specific item by ID
   */
  getItem(itemId) {
    return this.items.get(itemId);
  }

  /**
   * Place a bid with mutex-based concurrency control
   * This prevents race conditions when multiple users bid simultaneously
   */
  async placeBid(itemId, amount, userId, userName) {
    const mutex = this.mutexes.get(itemId);

    if (!mutex) {
      throw new Error('Item not found');
    }

    // Acquire the mutex lock - only one bid can proceed at a time per item
    await mutex.acquire();

    try {
      const item = this.items.get(itemId);

      if (!item) {
        throw new Error('Item not found');
      }

      // Validate auction is still active
      const now = new Date();
      const endTime = new Date(item.auctionEndTime);

      if (now >= endTime) {
        throw new Error('Auction has ended');
      }

      // Calculate minimum required bid
      const minBidIncrement = parseFloat(process.env.MIN_BID_INCREMENT) || 1.00;
      const minRequiredBid = item.currentBid + minBidIncrement;

      // Validate bid amount
      if (amount < minRequiredBid) {
        throw new Error(
          `Bid must be at least $${minRequiredBid.toFixed(2)}. Current bid is $${item.currentBid.toFixed(2)}`
        );
      }

      // Prevent self-outbidding
      if (item.currentBidder && item.currentBidder.userId === userId) {
        throw new Error('You are already the highest bidder');
      }

      // Record previous bidder for notification
      const previousBidder = item.currentBidder ? { ...item.currentBidder } : null;
      const previousAmount = item.currentBid;

      // Update item with new bid
      item.currentBid = amount;
      item.currentBidder = {
        userId,
        userName,
        bidTime: now,
      };
      item.bidCount += 1;
      item.lastBidTime = now;

      // Track previous bidder in the previousBidders array
      if (previousBidder && !item.previousBidders) {
        item.previousBidders = [];
      }
      if (previousBidder && !item.previousBidders.includes(previousBidder.userId)) {
        item.previousBidders.push(previousBidder.userId);
      }

      // Anti-sniping: Extend auction if bid placed in final minute
      const timeRemaining = (endTime - now) / 1000;
      const lastMinuteThreshold = parseInt(process.env.LAST_MINUTE_THRESHOLD_SECONDS) || 60;

      if (timeRemaining < lastMinuteThreshold && timeRemaining > 0) {
        const extensionSeconds = parseInt(process.env.AUCTION_EXTENSION_SECONDS) || 30;
        const newEndTime = new Date(now.getTime() + extensionSeconds * 1000);
        item.auctionEndTime = newEndTime;
        logger.info(`Auction ${itemId} extended by ${extensionSeconds} seconds due to late bid`);
      }

      // Record bid in history
      const bidRecord = {
        bidId: uuidv4(),
        amount,
        userId,
        userName,
        timestamp: now,
      };

      const history = this.bidHistory.get(itemId);
      history.push(bidRecord);

      logger.info(
        `Bid placed: Item ${item.title}, Amount $${amount}, User: ${userName}, Previous: $${previousAmount}`
      );

      return {
        success: true,
        item,
        bidRecord,
        previousBidder,
      };
    } catch (error) {
      logger.error(`Bid failed: ${error.message}`);
      throw error;
    } finally {
      // Always release the mutex
      mutex.release();
    }
  }

  /**
   * Get bid history for an item
   */
  getBidHistory(itemId) {
    return this.bidHistory.get(itemId) || [];
  }

  /**
   * Add a new auction item
   */
  addItem(itemData) {
    const item = {
      id: uuidv4(),
      ...itemData,
      currentBid: itemData.startingPrice,
      currentBidder: null,
      bidCount: 0,
      status: 'active',
      createdAt: new Date(),
      previousBidders: [],
    };

    this.items.set(item.id, item);
    this.mutexes.set(item.id, new Mutex());
    this.bidHistory.set(item.id, []);

    logger.info(`New auction item created: ${item.title}`);
    return item;
  }

  /**
   * Close expired auctions
   */
  closeExpiredAuctions() {
    const now = new Date();
    let closedCount = 0;

    this.items.forEach((item) => {
      if (item.status === 'active' && new Date(item.auctionEndTime) <= now) {
        item.status = 'ended';
        closedCount++;
        logger.info(`Auction ended: ${item.title}, Winner: ${item.currentBidder?.userName || 'No bids'}`);
      }
    });

    return closedCount;
  }
}

module.exports = AuctionManager;