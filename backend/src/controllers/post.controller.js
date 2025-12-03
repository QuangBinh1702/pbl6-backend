// Quản lý bài đăng
const Post = require('../models/post.model');
const Activity = require('../models/activity.model');

module.exports = {
  async getAllPosts(req, res) {
    try {
      const { status, all } = req.query; // Filter by status or get all posts
      const filter = {};
      
      // Mặc định chỉ hiển thị post đã đăng (status = true) cho user thường
      // Nếu có query ?all=true thì admin/staff có thể xem tất cả
      if (all === 'true' || all === true) {
        // Admin/staff có thể xem tất cả (không filter status)
        // Nếu có query status cụ thể thì vẫn áp dụng
        if (status !== undefined) {
          filter.status = status === 'true' || status === true;
        }
        // Nếu không có status query, không filter (trả về tất cả)
      } else {
        // User thường: mặc định chỉ thấy post đã đăng
        if (status !== undefined) {
          filter.status = status === 'true' || status === true;
        } else {
          filter.status = true; // Mặc định chỉ hiển thị post đã đăng
        }
      }
      
      const posts = await Post.find(filter)
        .populate('activity_id')
        .sort({ created_at: -1 });
      res.json({
        success: true,
        data: posts
      });
    } catch (err) {
      res.status(500).json({ 
        success: false,
        message: err.message 
      });
    }
  },

  async getPostById(req, res) {
    try {
      const post = await Post.findById(req.params.id)
        .populate('activity_id');
      if (!post) {
        return res.status(404).json({ 
          success: false,
          message: 'Post not found' 
        });
      }
      res.json({
        success: true,
        data: post
      });
    } catch (err) {
      res.status(500).json({ 
        success: false,
        message: err.message 
      });
    }
  },

  async getPostsByActivity(req, res) {
    try {
      const { all } = req.query; // Cho phép xem tất cả post (kể cả chưa đăng)
      const filter = { activity_id: req.params.activityId };
      
      // Mặc định chỉ hiển thị post đã đăng (status = true)
      // Nếu có query ?all=true thì admin/staff có thể xem tất cả
      if (all !== 'true' && all !== true) {
        filter.status = true; // Chỉ hiển thị post đã đăng
      }
      
      const posts = await Post.find(filter)
        .populate('activity_id')
        .sort({ created_at: -1 });
      res.json({
        success: true,
        data: posts
      });
    } catch (err) {
      res.status(500).json({ 
        success: false,
        message: err.message 
      });
    }
  },

  async createPost(req, res) {
    try {
      const { 
        activity_id,
        registration_open,
        registration_close
      } = req.body;

      // Validate required fields
      if (!activity_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'activity_id là bắt buộc' 
        });
      }

      if (!registration_open || !registration_close) {
        return res.status(400).json({ 
          success: false, 
          message: 'registration_open và registration_close là bắt buộc' 
        });
      }

      // Kiểm tra Activity có tồn tại không
      const activity = await Activity.findById(activity_id);
      if (!activity) {
        return res.status(404).json({ 
          success: false, 
          message: 'Activity không tồn tại' 
        });
      }

      // Validate dates
      const registrationOpenDate = new Date(registration_open);
      const registrationCloseDate = new Date(registration_close);
      
      if (isNaN(registrationOpenDate.getTime()) || isNaN(registrationCloseDate.getTime())) {
        return res.status(400).json({ 
          success: false, 
          message: 'Định dạng thời gian không hợp lệ' 
        });
      }

      if (registrationCloseDate < registrationOpenDate) {
        return res.status(400).json({ 
          success: false, 
          message: 'Thời gian kết thúc đăng ký phải sau thời gian bắt đầu' 
        });
      }

      // Xử lý file upload (activity_image)
      let activityImageUrl = activity.activity_image; // Giữ nguyên ảnh cũ nếu không upload mới
      
      if (req.file) {
        // Tạo URL cho file đã upload
        const protocol = req.protocol;
        const host = req.get('host');
        activityImageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
      }

      // Cập nhật Activity với các thông tin mới
      const updateData = {
        registration_open: registrationOpenDate,
        registration_close: registrationCloseDate
      };

      if (activityImageUrl) {
        updateData.activity_image = activityImageUrl;
      }

      const updatedActivity = await Activity.findByIdAndUpdate(
        activity_id,
        updateData,
        { new: true, runValidators: true }
      );

      // Tạo Post tham chiếu tới Activity với status = true (đã đăng)
      const post = await Post.create({
        activity_id: activity_id,
        status: true // Đã đăng (khi bấm xác nhận)
      });

      // Populate activity data
      await post.populate('activity_id');

      res.status(201).json({
        success: true,
        data: {
          post: post,
          activity: updatedActivity
        }
      });
    } catch (err) {
      console.error('Create post error:', err);
      res.status(400).json({ 
        success: false,
        message: err.message 
      });
    }
  },

  async updatePost(req, res) {
    try {
      const { status } = req.body;
      
      // Chỉ cho phép cập nhật status và activity_id (nếu cần)
      const updateData = {};
      if (status !== undefined) {
        updateData.status = status;
      }
      if (req.body.activity_id) {
        updateData.activity_id = req.body.activity_id;
      }

      const post = await Post.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).populate('activity_id');
      
      if (!post) {
        return res.status(404).json({ 
          success: false,
          message: 'Post not found' 
        });
      }
      
      res.json({
        success: true,
        data: post
      });
    } catch (err) {
      res.status(400).json({ 
        success: false,
        message: err.message 
      });
    }
  },

  async deletePost(req, res) {
    try {
      const post = await Post.findByIdAndDelete(req.params.id);
      if (!post) {
        return res.status(404).json({ 
          success: false,
          message: 'Post not found' 
        });
      }
      res.json({ 
        success: true,
        message: 'Post deleted successfully' 
      });
    } catch (err) {
      res.status(500).json({ 
        success: false,
        message: err.message 
      });
    }
  },
};


