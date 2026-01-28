const Joi = require('joi');

const bidSchema = Joi.object({
  itemId: Joi.string().required(),
  amount: Joi.number().positive().precision(2).required(),
  userId: Joi.string().required(),
  userName: Joi.string().max(100).required(),
});

const itemIdSchema = Joi.object({
  itemId: Joi.string().required(),
});

const createItemSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().max(1000).required(),
  startingPrice: Joi.number().positive().precision(2).required(),
  imageUrl: Joi.string().uri().optional(),
  category: Joi.string().max(50).optional(),
  auctionEndTime: Joi.date().iso().greater('now').required(),
});

module.exports = {
  bidSchema,
  itemIdSchema,
  createItemSchema,
};