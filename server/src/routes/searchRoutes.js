import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  searchListings,
  searchFarmers,
  getSearchSuggestions,
  getPopularSearches,
  getSearchAnalytics
} from '../controllers/searchController.js';

const router = express.Router();

// Public search routes (no authentication required)
router.get('/listings', searchListings);
router.get('/farmers', searchFarmers);
router.get('/suggestions', getSearchSuggestions);
router.get('/popular', getPopularSearches);

// Protected routes (authentication required for analytics)
router.use(authenticateToken);
router.get('/analytics', getSearchAnalytics);

export default router;

