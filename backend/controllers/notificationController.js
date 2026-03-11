const { Notification, User, Donation } = require('../models/index');

// @desc    Get user notifications
// @route   GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows: notifications, count: total } = await Notification.findAndCountAll({
      where: { recipientId: req.user.id },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'organizationName', 'profileImage'] },
        { model: Donation, as: 'donation', attributes: ['id', 'title', 'status', 'category'] },
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit),
    });

    const unreadCount = await Notification.count({ where: { recipientId: req.user.id, isRead: false } });

    const serialized = notifications.map((n) => {
      const obj = n.toJSON();
      obj._id = obj.id;
      if (obj.donation) obj.donation._id = obj.donation.id;
      return obj;
    });

    res.json({ success: true, notifications: serialized, total, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

// @desc    Mark single notification as read
// @route   PUT /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { id: req.params.id, recipientId: req.user.id } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark as read' });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { recipientId: req.user.id, isRead: false } }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark notifications as read' });
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.count({ where: { recipientId: req.user.id, isRead: false } });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

