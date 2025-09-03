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
router.post('/', addToFavorites);
router.delete('/:listingId', removeFromFavorites);
router.post('/bulk', bulkUpdateFavorites);

// Favorite retrieval
router.get('/listings', getFavoriteListings);
router.get('/farmers', getFavoriteFarmers);
router.get('/check/:listingId', checkFavoriteStatus);
router.get('/stats', getFavoriteStats);

export default router;

