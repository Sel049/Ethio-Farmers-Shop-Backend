import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  getFarmerListings,
  searchListings
} from '../controllers/listingController.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/listings', getListings);
router.get('/listings/search', searchListings);
router.get('/listings/:id', getListingById);

// Protected routes (authentication required)
router.use(authenticateToken);

router.post('/listings', createListing);
router.put('/listings/:id', updateListing);
router.delete('/listings/:id', deleteListing);
router.get('/farmer/listings', getFarmerListings);

export default router;

