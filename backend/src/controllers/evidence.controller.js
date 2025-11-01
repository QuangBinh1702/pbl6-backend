// Controller cho minh chứng hoạt động ngoài trường
const Evidence = require('../models/evidence.model');
const StudentProfile = require('../models/student_profile.model');

module.exports = {
  async getAllEvidences(req, res) {
    try {
      const evidences = await Evidence.find()
        .populate('student_id')
        .sort({ submitted_at: -1 });
      res.json({ success: true, data: evidences });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getEvidenceById(req, res) {
    try {
      const evidence = await Evidence.findById(req.params.id)
        .populate('student_id');
      if (!evidence) return res.status(404).json({ success: false, message: 'Evidence not found' });
      res.json({ success: true, data: evidence });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getEvidencesByStudent(req, res) {
    try {
      const evidences = await Evidence.find({ student_id: req.params.studentId })
        .populate('student_id')
        .sort({ submitted_at: -1 });
      res.json({ success: true, data: evidences });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async createEvidence(req, res) {
    try {
      const { student_id, title, file_url, self_point, class_point, faculty_point } = req.body;
      
      // Ensure _id is not passed from request (should be auto-generated)
      if (req.body._id) {
        delete req.body._id;
      }
      
      // Validate required fields
      if (!student_id || !title) {
        return res.status(400).json({ 
          success: false, 
          message: 'Student ID and title are required' 
        });
      }

      const evidence = new Evidence({
        student_id,
        title,
        file_url,
        self_point: self_point || 0,
        class_point: class_point || 0,
        faculty_point: faculty_point || 0,
        submitted_at: new Date(),
        status: 'pending'
      });
      
      await evidence.save();
      await evidence.populate('student_id');
      res.status(201).json({ success: true, data: evidence });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async updateEvidence(req, res) {
    try {
      // Ensure _id is not passed from request (should be auto-generated)
      if (req.body._id) {
        delete req.body._id;
      }
      
      const evidence = await Evidence.findByIdAndUpdate(
        req.params.id, 
        req.body, 
        { new: true, runValidators: true }
      )
        .populate('student_id');
      
      if (!evidence) return res.status(404).json({ success: false, message: 'Evidence not found' });
      res.json({ success: true, data: evidence });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async approveEvidence(req, res) {
    try {
      const evidence = await Evidence.findByIdAndUpdate(
        req.params.id,
        { 
          status: 'approved', 
          verified_at: new Date() 
        },
        { new: true }
      )
        .populate('student_id');
      
      if (!evidence) return res.status(404).json({ success: false, message: 'Evidence not found' });
      res.json({ success: true, data: evidence });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async rejectEvidence(req, res) {
    try {
      const evidence = await Evidence.findByIdAndUpdate(
        req.params.id,
        { 
          status: 'rejected', 
          verified_at: new Date() 
        },
        { new: true }
      )
        .populate('student_id');
      
      if (!evidence) return res.status(404).json({ success: false, message: 'Evidence not found' });
      res.json({ success: true, data: evidence });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async deleteEvidence(req, res) {
    try {
      const evidence = await Evidence.findByIdAndDelete(req.params.id);
      if (!evidence) return res.status(404).json({ success: false, message: 'Evidence not found' });
      res.json({ success: true, message: 'Evidence deleted successfully' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getEvidencesByStatus(req, res) {
    try {
      const { status } = req.params;
      const evidences = await Evidence.find({ status })
        .populate('student_id')
        .sort({ submitted_at: -1 });
      res.json({ success: true, data: evidences });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
