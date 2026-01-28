const express = require('express');
const logger = require('../utils/logger');
const { createItemSchema } = require('../validators/schemas');

function createAuctionRoutes(auctionManager) {
  const router = express.Router();

  /**
   * GET /api/items
   * Get all auction items
   */
  router.get('/items', (req, res) => {
    try {
      const items = auctionManager.getAllItems();
      
      res.json({
        success: true,
        count: items.length,
        data: items,
      });
    } catch (error) {
      logger.error(`Error fetching items: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch auction items',
      });
    }
  });

  /**
   * GET /api/items/:id
   * Get a specific auction item
   */
  router.get('/items/:id', (req, res) => {
    try {
      const { id } = req.params;
      const item = auctionManager.getItem(id);

      if (!item) {
        return res.status(404).json({
          success: false,
          error: 'Item not found',
        });
      }

      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      logger.error(`Error fetching item: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch auction item',
      });
    }
  });

  /**
   * GET /api/items/:id/history
   * Get bid history for an item
   */
  router.get('/items/:id/history', (req, res) => {
    try {
      const { id } = req.params;
      const history = auctionManager.getBidHistory(id);

      res.json({
        success: true,
        count: history.length,
        data: history,
      });
    } catch (error) {
      logger.error(`Error fetching bid history: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch bid history',
      });
    }
  });

  /**
   * POST /api/items
   * Create a new auction item (admin only in production)
   */
  router.post('/items', (req, res) => {
    try {
      const { error, value } = createItemSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
      }

      const item = auctionManager.addItem(value);

      res.status(201).json({
        success: true,
        data: item,
      });
    } catch (error) {
      logger.error(`Error creating item: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Failed to create auction item',
      });
    }
  });

  /**
   * GET /api/health
   * Health check endpoint
   */
  router.get('/health', (req, res) => {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  return router;
}

module.exports = createAuctionRoutes;