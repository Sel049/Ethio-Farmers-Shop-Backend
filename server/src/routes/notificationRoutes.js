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
router.post('/notifications', createNotification);
router.get('/notifications', getUserNotifications);
router.put('/notifications/:id/read', markNotificationRead);
router.put('/notifications/read-all', markAllNotificationsRead);
router.delete('/notifications/:id', deleteNotification);

// Notification statistics
router.get('/notifications/stats', getNotificationStats);

// System notifications (admin functionality)
router.post('/notifications/system', createSystemNotification);

export default router;

