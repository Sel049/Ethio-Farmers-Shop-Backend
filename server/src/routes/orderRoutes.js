import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createOrder,
  getBuyerOrders,
  getFarmerOrders,
  getOrderById,
  updateOrderStatus,
  getOrderStats
} from '../controllers/orderController.js';

const router = express.Router();

// All order routes require authentication
router.use(authenticateToken);

// Order management
router.post('/orders', createOrder);
router.get('/orders/:id', getOrderById);
router.put('/orders/:id/status', updateOrderStatus);

// Role-specific order views
router.get('/buyer/orders', getBuyerOrders);
router.get('/farmer/orders', getFarmerOrders);

// Order statistics
router.get('/orders/stats', getOrderStats);

export default router;

