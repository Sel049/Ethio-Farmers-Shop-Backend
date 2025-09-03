import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createNotification,
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getNotificationStats,
  createSystemNotification
} from '../controllers/notificationController.js';

const router = express.Router();

// All notification routes require authentication
router.use(authenticateToken);

// Notification management
router.post('/', createNotification);
router.get('/', getUserNotifications);
router.put('/:id/read', markNotificationRead);
router.put('/read-all', markAllNotificationsRead);
router.delete('/:id', deleteNotification);

// Notification statistics
router.get('/stats', getNotificationStats);

// System notifications (admin functionality)
router.post('/system', createSystemNotification);

export default router;

