// Quản lý thông báo
const Notification = require('../models/notification.model');
const NotificationRead = require('../models/notification_read.model');
const User = require('../models/user.model');
const UserRole = require('../models/user_role.model');
const StudentProfile = require('../models/student_profile.model');
const StaffProfile = require('../models/staff_profile.model');

// Helper function to check user type
async function getUserType(userId) {
  // Check if user is student
  const studentProfile = await StudentProfile.findOne({ user_id: userId });
  if (studentProfile) {
    return 'student';
  }
  
  // Check if user is staff
  const staffProfile = await StaffProfile.findOne({ user_id: userId });
  if (staffProfile) {
    return 'staff';
  }
  
  // Check if user is admin
  const userRoles = await UserRole.find({ user_id: userId }).populate('role_id');
  const isAdmin = userRoles.some(ur => ur.role_id && ur.role_id.name === 'admin');
  if (isAdmin) {
    return 'admin';
  }
  
  return 'unknown';
}

// Helper function to check if notification is visible to user
function isNotificationVisible(notification, userId, userType) {
  const { target_audience, target_user_ids } = notification;
  
  // If target_audience is 'all', show to everyone
  if (target_audience === 'all') {
    return true;
  }
  
  // If target_audience is 'student', show to students
  if (target_audience === 'student' && userType === 'student') {
    return true;
  }
  
  // If target_audience is 'staff', show to staff and admin
  if (target_audience === 'staff' && (userType === 'staff' || userType === 'admin')) {
    return true;
  }
  
  // If target_audience is 'specific', show only to users in target_user_ids
  if (target_audience === 'specific') {
    if (!userId) return false;
    const userIdStr = userId.toString();
    return target_user_ids && target_user_ids.some(id => id && id.toString() === userIdStr);
  }
  
  // Admin can see all notifications
  if (userType === 'admin') {
    return true;
  }
  
  return false;
}

// Helper function to get unread count (internal use)
async function getUnreadCountInternal(userId, userType = null) {
  try {
    // Get user type if not provided
    if (!userType) {
      userType = await getUserType(userId);
    }
    
    // Get all notifications
    const allNotifications = await Notification.find({}).select('_id target_audience target_user_ids');
    
    // Filter notifications by target_audience
    const visibleNotifications = allNotifications.filter(notification => 
      isNotificationVisible(notification, userId, userType)
    );
    
    const notificationIds = visibleNotifications.map(n => n._id);
    
    // Get read notifications for this user
    const readRecords = await NotificationRead.find({
      notification_id: { $in: notificationIds },
      user_id: userId
    });
    
    const readNotificationIds = new Set(readRecords.filter(r => r.notification_id).map(r => r.notification_id.toString()));
    
    // Count unread notifications
    const unreadCount = notificationIds.filter(id => id && !readNotificationIds.has(id.toString())).length;
    
    return unreadCount;
  } catch (err) {
    console.error('Get unread count error:', err);
    return 0;
  }
}

module.exports = {
  // Lấy tất cả thông báo của user hiện tại
  async getAllNotifications(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 1000, read_status, notification_type } = req.query;
      
      // Get user type
      const userType = await getUserType(userId);
      
      // Build filter for notifications
      const filter = {};
      
      // Filter by notification type if provided
      if (notification_type) {
        filter.notification_type = notification_type;
      }
      
      // Get all notifications (we'll filter by target_audience later)
      const allNotifications = await Notification.find(filter)
        .sort({ published_date: -1 })
        .populate('created_by', 'username');
      
      // Filter notifications by target_audience
      const visibleNotifications = allNotifications.filter(notification => 
        isNotificationVisible(notification, userId, userType)
      );
      
      // Apply pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const paginatedNotifications = visibleNotifications.slice(skip, skip + parseInt(limit));
      
      // Get read status for all visible notifications for this user
      const notificationIds = paginatedNotifications.map(n => n._id);
      const readRecords = await NotificationRead.find({
        notification_id: { $in: notificationIds },
        user_id: userId
      });
      
      // Create a map of read status
      const readMap = new Map();
      readRecords.forEach(record => {
        if (record.notification_id) {
          readMap.set(record.notification_id.toString(), true);
        }
      });
      
      // Combine notifications with read status
      let notificationsWithReadStatus = paginatedNotifications.map(notification => {
        const notificationObj = notification.toObject();
        notificationObj.is_read = notification._id ? readMap.has(notification._id.toString()) : false;
        return notificationObj;
      });
      
      // Filter by read status if provided
      if (read_status === 'read') {
        notificationsWithReadStatus = notificationsWithReadStatus.filter(n => n.is_read === true);
      } else if (read_status === 'unread') {
        notificationsWithReadStatus = notificationsWithReadStatus.filter(n => n.is_read === false);
      }
      
      // Get total count of visible notifications
      const totalNotifications = visibleNotifications.length;
      const totalUnread = await getUnreadCountInternal(userId, userType);
      
      res.json({ 
        success: true, 
        data: notificationsWithReadStatus,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalNotifications,
          totalPages: Math.ceil(totalNotifications / parseInt(limit))
        },
        unread_count: totalUnread
      });
    } catch (err) {
      console.error('Get all notifications error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Lấy số lượng thông báo chưa đọc
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      const unreadCount = await getUnreadCountInternal(userId);
      
      res.json({ 
        success: true, 
        unread_count: unreadCount
      });
    } catch (err) {
      console.error('Get unread count error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Lấy thông báo theo ID
  async getNotificationById(req, res) {
    try {
      const userId = req.user.id;
      const notification = await Notification.findById(req.params.id)
        .populate('created_by', 'username');
      
      if (!notification) {
        return res.status(404).json({ 
          success: false, 
          message: 'Notification not found' 
        });
      }
      
      // Check if notification is visible to user
      const userType = await getUserType(userId);
      if (!isNotificationVisible(notification, userId, userType)) {
        return res.status(403).json({ 
          success: false, 
          message: 'You do not have permission to view this notification' 
        });
      }
      
      // Check if user has read this notification
      const readRecord = await NotificationRead.findOne({
        notification_id: notification._id,
        user_id: userId
      });
      
      const notificationObj = notification.toObject();
      notificationObj.is_read = !!readRecord;
      if (readRecord) {
        notificationObj.read_at = readRecord.read_at;
      }
      
      res.json({ success: true, data: notificationObj });
    } catch (err) {
      console.error('Get notification by ID error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Tạo thông báo mới
  async createNotification(req, res) {
    try {
      const {
        title,
        content,
        published_date,
        icon_type,
        notification_type,
        target_audience,
        target_user_ids
      } = req.body;
      
      // Validate required fields
      if (!title || !content) {
        return res.status(400).json({ 
          success: false, 
          message: 'Title and content are required' 
        });
      }
      
      const notification = await Notification.create({
        title,
        content,
        published_date: published_date ? new Date(published_date) : new Date(),
        icon_type: icon_type || 'megaphone',
        notification_type: notification_type || 'general',
        created_by: req.user.id,
        target_audience: target_audience || 'all',
        target_user_ids: target_user_ids || []
      });
      
      const populatedNotification = await Notification.findById(notification._id)
        .populate('created_by', 'username');
      
      res.status(201).json({ success: true, data: populatedNotification });
    } catch (err) {
      console.error('Create notification error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  },

  // Cập nhật thông báo
  async updateNotification(req, res) {
    try {
      const updates = { ...req.body };
      
      // Convert published_date to Date if provided
      if (updates.published_date) {
        updates.published_date = new Date(updates.published_date);
      }
      
      const notification = await Notification.findByIdAndUpdate(
        req.params.id, 
        updates, 
        { new: true, runValidators: true }
      ).populate('created_by', 'username');
      
      if (!notification) {
        return res.status(404).json({ 
          success: false, 
          message: 'Notification not found' 
        });
      }
      
      res.json({ success: true, data: notification });
    } catch (err) {
      console.error('Update notification error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  },

  // Xóa thông báo
  async deleteNotification(req, res) {
    try {
      const notification = await Notification.findByIdAndDelete(req.params.id);
      
      if (!notification) {
        return res.status(404).json({ 
          success: false, 
          message: 'Notification not found' 
        });
      }
      
      // Also delete related read records
      await NotificationRead.deleteMany({ notification_id: req.params.id });
      
      res.json({ success: true, message: 'Notification deleted successfully' });
    } catch (err) {
      console.error('Delete notification error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Đánh dấu thông báo là đã đọc
  async markAsRead(req, res) {
    try {
      const userId = req.user.id;
      const notificationId = req.params.id;
      
      // Check if notification exists
      const notification = await Notification.findById(notificationId);
      if (!notification) {
        return res.status(404).json({ 
          success: false, 
          message: 'Notification not found' 
        });
      }
      
      // Check if notification is visible to user
      const userType = await getUserType(userId);
      if (!isNotificationVisible(notification, userId, userType)) {
        return res.status(403).json({ 
          success: false, 
          message: 'You do not have permission to mark this notification as read' 
        });
      }
      
      // Check if already read
      const existingRead = await NotificationRead.findOne({
        notification_id: notificationId,
        user_id: userId
      });
      
      if (existingRead) {
        return res.json({ 
          success: true, 
          message: 'Notification already marked as read',
          data: existingRead
        });
      }
      
      // Create read record
      const readRecord = await NotificationRead.create({
        notification_id: notificationId,
        user_id: userId,
        read_at: new Date()
      });
      
      res.json({ success: true, data: readRecord });
    } catch (err) {
      console.error('Mark as read error:', err);
      if (err.code === 11000) {
        return res.json({ 
          success: true, 
          message: 'Notification already marked as read'
        });
      }
      res.status(400).json({ success: false, message: err.message });
    }
  },

  // Đánh dấu tất cả thông báo là đã đọc
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;
      
      // Get user type
      const userType = await getUserType(userId);
      
      // Get all notifications
      const allNotifications = await Notification.find({}).select('_id target_audience target_user_ids');
      
      // Filter notifications by target_audience
      const visibleNotifications = allNotifications.filter(notification => 
        isNotificationVisible(notification, userId, userType)
      );
      
      const notificationIds = visibleNotifications.map(n => n._id);
      
      // Get already read notifications
      const readRecords = await NotificationRead.find({
        notification_id: { $in: notificationIds },
        user_id: userId
      });
      
      const readNotificationIds = new Set(readRecords.filter(r => r.notification_id).map(r => r.notification_id.toString()));
      
      // Find unread notifications (only visible ones)
      const unreadNotifications = notificationIds.filter(
        id => id && !readNotificationIds.has(id.toString())
      );
      
      // Create read records for unread notifications
      if (unreadNotifications.length > 0) {
        const readRecordsToCreate = unreadNotifications.map(notificationId => ({
          notification_id: notificationId,
          user_id: userId,
          read_at: new Date()
        }));
        
        await NotificationRead.insertMany(readRecordsToCreate, { ordered: false });
      }
      
      res.json({ 
        success: true, 
        message: `Marked ${unreadNotifications.length} notifications as read`
      });
    } catch (err) {
      console.error('Mark all as read error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  }
};

