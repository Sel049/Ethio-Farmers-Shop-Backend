import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getPriceTrends,
  getMarketOverview,
  getSeasonalInsights,
  getMarketComparison,
  getPopularProduce,
  addPriceData
} from '../controllers/marketTrendsController.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/trends', getPriceTrends);
router.get('/overview', getMarketOverview);
router.get('/seasonal-insights', getSeasonalInsights);
router.get('/comparison', getMarketComparison);
router.get('/popular-produce', getPopularProduce);

// Protected routes (authentication required - for data collection)
router.post('/price-data', authenticateToken, addPriceData);

export default router;

