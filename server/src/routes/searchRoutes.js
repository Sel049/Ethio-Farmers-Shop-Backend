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
router.get('/search/listings', searchListings);
router.get('/search/farmers', searchFarmers);
router.get('/search/suggestions', getSearchSuggestions);
router.get('/search/popular', getPopularSearches);

// Protected routes (authentication required for analytics)
router.use(authenticateToken);
router.get('/search/analytics', getSearchAnalytics);

export default router;

