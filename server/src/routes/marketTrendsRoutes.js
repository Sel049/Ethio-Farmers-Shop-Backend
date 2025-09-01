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
router.get('/market/trends', getPriceTrends);
router.get('/market/overview', getMarketOverview);
router.get('/market/seasonal-insights', getSeasonalInsights);
router.get('/market/comparison', getMarketComparison);
router.get('/market/popular-produce', getPopularProduce);

// Protected routes (authentication required - for data collection)
router.use(authenticateToken);
router.post('/market/price-data', addPriceData);

export default router;

