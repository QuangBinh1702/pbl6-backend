// Quản lý phản hồi sinh viên
const StudentFeedback = require('../models/student_feedback.model');
const StudentProfile = require('../models/student_profile.model');
const Activity = require('../models/activity.model');
const Attendance = require('../models/attendance.model');
const ActivityRegistration = require('../models/activity_registration.model');

module.exports = {
  async createFeedback(req, res) {
    try {
      const { activity_id, comment, rating } = req.body;
      
      // Validate
      if (!activity_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'activity_id is required' 
        });
      }
      
      if (rating && (rating < 1 || rating > 5)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Rating must be between 1 and 5' 
        });
      }
      
      // Get student profile for current user
      const studentProfile = await StudentProfile.findOne({ 
        user_id: req.user.id 
      });
      
      if (!studentProfile) {
        return res.status(404).json({ 
          success: false, 
          message: 'Student profile not found' 
        });
      }
      
      // Check if activity exists and is completed
      const activity = await Activity.findById(activity_id);
      if (!activity) {
        return res.status(404).json({ 
          success: false, 
          message: 'Activity not found' 
        });
      }
      
      if (activity.status !== 'completed') {
        return res.status(400).json({ 
          success: false, 
          message: 'Activity must be completed to receive feedback' 
        });
      }
      
      // Check if student participated in activity
      const participated = await Attendance.findOne({
        activity_id,
        student_id: studentProfile._id,
        status: 'present'
      }) || await ActivityRegistration.findOne({
        activity_id,
        student_id: studentProfile._id,
        status: 'attended'
      });
      
      if (!participated) {
        return res.status(403).json({ 
          success: false, 
          message: 'Student must participate in activity to give feedback' 
        });
      }
      
      // Check if feedback already exists
      const existingFeedback = await StudentFeedback.findOne({
        activity_id,
        student_id: studentProfile._id
      });
      
      if (existingFeedback) {
        return res.status(400).json({ 
          success: false, 
          message: 'Feedback already submitted for this activity' 
        });
      }
      
      const feedback = await StudentFeedback.create({
        activity_id,
        student_id: studentProfile._id,
        comment,
        rating,
        submitted_at: new Date()
      });
      
      await feedback.populate({
        path: 'activity_id',
        select: 'title start_time end_time'
      });
      await feedback.populate('student_id');
      
      res.status(201).json({ success: true, data: feedback });
    } catch (err) {
      console.error('Create feedback error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async getAllFeedbacks(req, res) {
    try {
      const { activity_id, student_id, rating } = req.query;
      const filter = {};
      
      if (activity_id) filter.activity_id = activity_id;
      if (student_id) filter.student_id = student_id;
      if (rating) filter.rating = parseInt(rating);
      
      const feedbacks = await StudentFeedback.find(filter)
        .populate({
          path: 'activity_id',
          select: 'title start_time end_time'
        })
        .populate({
          path: 'student_id',
          populate: { path: 'user_id' }
        })
        .sort({ submitted_at: -1 });
      
      res.json({ success: true, data: feedbacks });
    } catch (err) {
      console.error('Get all feedbacks error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getFeedbackById(req, res) {
    try {
      const feedback = await StudentFeedback.findById(req.params.id)
        .populate({
          path: 'activity_id',
          select: 'title start_time end_time'
        })
        .populate({
          path: 'student_id',
          populate: { path: 'user_id' }
        });
      
      if (!feedback) {
        return res.status(404).json({ 
          success: false, 
          message: 'Feedback not found' 
        });
      }
      
      res.json({ success: true, data: feedback });
    } catch (err) {
      console.error('Get feedback by ID error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getFeedbacksByActivity(req, res) {
    try {
      const { activityId } = req.params;
      
      const feedbacks = await StudentFeedback.find({ 
        activity_id: activityId 
      })
        .populate({
          path: 'activity_id',
          select: 'title start_time end_time'
        })
        .populate({
          path: 'student_id',
          populate: { path: 'user_id' }
        })
        .sort({ submitted_at: -1 });
      
      // Calculate average rating
      const avgRating = feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.length || 0;
      
      res.json({ 
        success: true, 
        data: {
          feedbacks,
          count: feedbacks.length,
          averageRating: avgRating.toFixed(2)
        }
      });
    } catch (err) {
      console.error('Get feedbacks by activity error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async updateFeedback(req, res) {
    try {
      const { comment, rating } = req.body;
      const updates = {};
      
      if (comment !== undefined) updates.comment = comment;
      if (rating !== undefined) {
        if (rating < 1 || rating > 5) {
          return res.status(400).json({ 
            success: false, 
            message: 'Rating must be between 1 and 5' 
          });
        }
        updates.rating = rating;
      }
      
      const feedback = await StudentFeedback.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
      )
        .populate({
          path: 'activity_id',
          select: 'title start_time end_time'
        })
        .populate({
          path: 'student_id',
          populate: { path: 'user_id' }
        });
      
      if (!feedback) {
        return res.status(404).json({ 
          success: false, 
          message: 'Feedback not found' 
        });
      }
      
      res.json({ success: true, data: feedback });
    } catch (err) {
      console.error('Update feedback error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async deleteFeedback(req, res) {
    try {
      const feedback = await StudentFeedback.findByIdAndDelete(req.params.id);
      
      if (!feedback) {
        return res.status(404).json({ 
          success: false, 
          message: 'Feedback not found' 
        });
      }
      
      res.json({ success: true, message: 'Feedback deleted successfully' });
    } catch (err) {
      console.error('Delete feedback error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getMyFeedbacks(req, res) {
    try {
      // Get student profile for current user
      const studentProfile = await StudentProfile.findOne({ 
        user_id: req.user.id 
      });
      
      if (!studentProfile) {
        return res.status(404).json({ 
          success: false, 
          message: 'Student profile not found' 
        });
      }
      
      const feedbacks = await StudentFeedback.find({ 
        student_id: studentProfile._id 
      })
        .populate({
          path: 'activity_id',
          select: 'title start_time end_time'
        })
        .sort({ submitted_at: -1 });
      
      res.json({ success: true, data: feedbacks });
    } catch (err) {
      console.error('Get my feedbacks error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getFeedbackByStudentAndActivity(req, res) {
    try {
      const { studentId, activityId } = req.params;
      
      // Validate required parameters
      if (!studentId || !activityId) {
        return res.status(400).json({ 
          success: false, 
          message: 'studentId and activityId are required' 
        });
      }
      
      // Find feedback by student and activity
      const feedback = await StudentFeedback.findOne({
        student_id: studentId,
        activity_id: activityId
      })
        .populate({
          path: 'activity_id',
          select: 'title start_time end_time'
        })
        .populate({
          path: 'student_id',
          populate: { path: 'user_id' }
        });
      
      if (!feedback) {
        return res.status(404).json({ 
          success: false, 
          message: 'Feedback not found for this student and activity' 
        });
      }
      
      res.json({ success: true, data: feedback });
    } catch (err) {
      console.error('Get feedback by student and activity error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
