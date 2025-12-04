// Quản lý bài đăng
const Post = require('../models/post.model');
const Activity = require('../models/activity.model');
const { validateDate } = require('../utils/date.util');

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

      // Validate dates với helper function
      const regOpenValidation = validateDate(registration_open, 'registration_open');
      if (regOpenValidation.error) {
        return res.status(400).json({ 
          success: false, 
          message: regOpenValidation.error 
        });
      }
      const registrationOpenDate = regOpenValidation.date;

      const regCloseValidation = validateDate(registration_close, 'registration_close');
      if (regCloseValidation.error) {
        return res.status(400).json({ 
          success: false, 
          message: regCloseValidation.error 
        });
      }
      const registrationCloseDate = regCloseValidation.date;

      // Validate: registration_close phải sau registration_open
      if (registrationCloseDate < registrationOpenDate) {
        return res.status(400).json({ 
          success: false, 
          message: 'Thời gian kết thúc đăng ký phải sau thời gian bắt đầu' 
        });
      }

      // Validate: registration_open và registration_close phải trước start_time của activity
      if (activity.start_time) {
        const activityStartTime = new Date(activity.start_time);
        
        if (registrationOpenDate >= activityStartTime) {
          return res.status(400).json({ 
            success: false, 
            message: 'Thời gian bắt đầu đăng ký phải trước thời gian bắt đầu hoạt động' 
          });
        }
        
        if (registrationCloseDate >= activityStartTime) {
          return res.status(400).json({ 
            success: false, 
            message: 'Thời gian kết thúc đăng ký phải trước thời gian bắt đầu hoạt động' 
          });
        }
      }

      // Validate: registration_close không được trong quá khứ
      const now = new Date();
      if (registrationOpenDate < now) {
        return res.status(400).json({ 
          success: false, 
          message: 'Thời gian bắt đầu đăng ký không được trong quá khứ' 
        });
      }
      
      if (registrationCloseDate < now) {
        return res.status(400).json({ 
          success: false, 
          message: 'Thời gian kết thúc đăng ký không được trong quá khứ' 
        });
      }

      // Xử lý file upload (activity_image)
      let activityImageUrl = activity.activity_image; // Giữ nguyên ảnh cũ nếu không upload mới
      
      if (req.file) {
        // Sử dụng Cloudinary URL nếu có, nếu không dùng local URL
        const { getFileUrl } = require('../utils/cloudinary.util');
        activityImageUrl = getFileUrl(req.file, req);
      }

      // Lưu local time vào database
      // Parse date string với timezone và extract local time components
      // Sau đó tạo Date object với local time values (không convert timezone)
      const extractLocalTimeFromString = (dateString) => {
        // Parse date string để lấy local time components và timezone offset
        // Format: "YYYY-MM-DDTHH:mm:ss.sss+HH:mm" hoặc "YYYY-MM-DDTHH:mm:ss.sssZ"
        const fullMatch = dateString.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{3}))?(?:([+-])(\d{2}):(\d{2})|Z)?/);
        
        if (fullMatch) {
          const [, year, month, day, hour, minute, second, millisecond, tzSign, tzHour, tzMinute] = fullMatch;
          
          // Extract timezone offset (nếu có)
          let timezoneOffsetMinutes = 0;
          if (tzSign && tzHour && tzMinute) {
            const offsetHours = parseInt(tzHour);
            const offsetMinutes = parseInt(tzMinute);
            timezoneOffsetMinutes = (tzSign === '+' ? 1 : -1) * (offsetHours * 60 + offsetMinutes);
          } else if (dateString.endsWith('Z')) {
            // UTC timezone
            timezoneOffsetMinutes = 0;
          }
          
          // Tạo Date object với local time values
          // Sử dụng UTC methods nhưng với local time values
          // Sau đó adjust với timezone offset để giữ nguyên local time
          const localDate = new Date(Date.UTC(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            parseInt(hour),
            parseInt(minute),
            parseInt(second || 0),
            parseInt(millisecond || 0)
          ));
          
          // Adjust với timezone offset để giữ nguyên local time
          // Nếu timezone là +07:00, ta cần subtract 7 hours từ UTC date
          // để giữ nguyên local time values
          const adjustedDate = new Date(localDate.getTime() - timezoneOffsetMinutes * 60 * 1000);
          
          return adjustedDate;
        }
        
        // Fallback: parse như bình thường
        return new Date(dateString);
      };
      
      // Extract local time từ date strings
      const registrationOpenLocal = extractLocalTimeFromString(registration_open);
      const registrationCloseLocal = extractLocalTimeFromString(registration_close);
      
      const updateData = {
        registration_open: registrationOpenLocal,
        registration_close: registrationCloseLocal
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


