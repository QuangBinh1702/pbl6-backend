// Quản lý lớp học
const Class = require('../models/class.model');
const StudentProfile = require('../models/student_profile.model');

module.exports = {
  async getAllClasses(req, res) {
    try {
      const classes = await Class.find()
        .populate('falcuty')
        .populate('cohort');
      res.json(classes);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getClassById(req, res) {
    try {
      const classData = await Class.findById(req.params.id)
        .populate('falcuty')
        .populate('cohort');
      if (!classData) {
        return res.status(404).json({ message: 'Class not found' });
      }
      res.json(classData);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async createClass(req, res) {
    try {
      const classData = new Class(req.body);
      await classData.save();
      await classData.populate('falcuty');
      await classData.populate('cohort');
      res.status(201).json(classData);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  async updateClass(req, res) {
    try {
      const classData = await Class.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      )
        .populate('falcuty')
        .populate('cohort');
      if (!classData) {
        return res.status(404).json({ message: 'Class not found' });
      }
      res.json(classData);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  async deleteClass(req, res) {
    try {
      const classData = await Class.findByIdAndDelete(req.params.id);
      if (!classData) {
        return res.status(404).json({ message: 'Class not found' });
      }
      res.json({ message: 'Class deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getClassesByFaculty(req, res) {
    try {
      const classes = await Class.find({ falcuty: req.params.facultyId })
        .populate('falcuty')
        .populate('cohort');
      res.json(classes);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getClassesByCohort(req, res) {
    try {
      const classes = await Class.find({ cohort: req.params.cohortId })
        .populate('falcuty')
        .populate('cohort');
      res.json(classes);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getClassStudents(req, res) {
    try {
      const students = await StudentProfile.find({ class: req.params.id })
        .populate('user', '-password')
        .populate('class');
      res.json(students);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
};


