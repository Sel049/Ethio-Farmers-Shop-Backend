import { Router } from "express";
import { authGuard } from "../middleware/auth.js";
import { syncUser, registerUser, devLogin, getUserProfile } from "../controllers/authController.js";

const router = Router();

// Public routes (no authentication required)
router.post('/register', registerUser);
router.post('/dev-login', devLogin); // Development login for testing

// Protected routes (authentication required)
router.post('/sync', authGuard, syncUser);
router.get('/profile', authGuard, getUserProfile);

export default router;
