import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createReview,
  getListingReviews,
  getFarmerReviews,
  updateReview,
  deleteReview,
  getUserReviews,
  getReviewStats
} from '../controllers/reviewController.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/listing/:listingId', getListingReviews);
router.get('/farmer/:farmerId', getFarmerReviews);

// Protected routes (authentication required)
router.use(authenticateToken);

// Review management
router.post('/', createReview);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);

// User-specific review routes
router.get('/user', getUserReviews);

// Review statistics (admin functionality)
router.get('/stats', getReviewStats);

export default router;

