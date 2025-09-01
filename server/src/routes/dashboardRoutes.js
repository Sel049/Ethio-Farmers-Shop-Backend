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
router.get('/dashboard/buyer', getBuyerDashboard);
router.get('/dashboard/farmer', getFarmerDashboard);
router.get('/dashboard/admin', getAdminDashboard);

// Analytics data for charts
router.get('/dashboard/analytics', getAnalyticsData);

export default router;

