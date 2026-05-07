const prisma = require('../utils/prisma.util');

// ─── Get User Notifications ───────────────────────────────────────────────
const getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.status(200).json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Mark Notification as Read ────────────────────────────────────────────
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.notification.updateMany({
      where: { id, userId: req.user.id },
      data: { isRead: true }
    });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Mark All as Read ─────────────────────────────────────────────────────
const markAllAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true }
    });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Internal Helper: Create Notification ────────────────────────────────
const createNotification = async ({ userId, type, title, message, link }) => {
  try {
    return await prisma.notification.create({
      data: { userId, type, title, message, link }
    });
  } catch (error) {
    console.error('[createNotification Helper Error]', error);
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, createNotification };
