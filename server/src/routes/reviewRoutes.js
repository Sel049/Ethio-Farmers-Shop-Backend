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
router.get('/reviews/listing/:listingId', getListingReviews);
router.get('/reviews/farmer/:farmerId', getFarmerReviews);

// Protected routes (authentication required)
router.use(authenticateToken);

// Review management
router.post('/reviews', createReview);
router.put('/reviews/:id', updateReview);
router.delete('/reviews/:id', deleteReview);

// User-specific review routes
router.get('/reviews/user', getUserReviews);

// Review statistics (admin functionality)
router.get('/reviews/stats', getReviewStats);

export default router;

