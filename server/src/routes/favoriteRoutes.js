import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  addToFavorites,
  removeFromFavorites,
  getFavoriteListings,
  checkFavoriteStatus,
  getFavoriteFarmers,
  getFavoriteStats,
  bulkUpdateFavorites
} from '../controllers/favoriteController.js';

const router = express.Router();

// All favorite routes require authentication
router.use(authenticateToken);

// Favorite management
router.post('/favorites', addToFavorites);
router.delete('/favorites/:listingId', removeFromFavorites);
router.post('/favorites/bulk', bulkUpdateFavorites);

// Favorite retrieval
router.get('/favorites/listings', getFavoriteListings);
router.get('/favorites/farmers', getFavoriteFarmers);
router.get('/favorites/check/:listingId', checkFavoriteStatus);
router.get('/favorites/stats', getFavoriteStats);

export default router;

