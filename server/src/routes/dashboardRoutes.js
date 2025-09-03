import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getBuyerDashboard,
  getFarmerDashboard,
  getAdminDashboard,
  getAnalyticsData
} from '../controllers/dashboardController.js';

const router = express.Router();

// All dashboard routes require authentication
router.use(authenticateToken);

// Role-specific dashboard routes
router.get('/buyer', getBuyerDashboard);
router.get('/farmer', getFarmerDashboard);
router.get('/admin', getAdminDashboard);

// Analytics data for charts
router.get('/analytics', getAnalyticsData);

export default router;

