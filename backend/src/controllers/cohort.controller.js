// Quản lý khóa học
const Cohort = require('../models/cohort.model');
const Class = require('../models/class.model');
const StudentCohort = require('../models/student_cohort.model');

module.exports = {
  async getAllCohorts(req, res) {
    try {
      const cohorts = await Cohort.find().sort({ year: -1 });
      res.json(cohorts);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getCohortById(req, res) {
    try {
      const cohort = await Cohort.findById(req.params.id);
      if (!cohort) {
        return res.status(404).json({ message: 'Cohort not found' });
      }
      res.json(cohort);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getCohortByYear(req, res) {
    try {
      const cohort = await Cohort.findOne({ year: req.params.year });
      if (!cohort) {
        return res.status(404).json({ message: 'Cohort not found' });
      }
      res.json(cohort);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async createCohort(req, res) {
    try {
      const cohort = new Cohort(req.body);
      await cohort.save();
      res.status(201).json(cohort);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  async updateCohort(req, res) {
    try {
      const cohort = await Cohort.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!cohort) {
        return res.status(404).json({ message: 'Cohort not found' });
      }
      res.json(cohort);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  async deleteCohort(req, res) {
    try {
      const cohort = await Cohort.findByIdAndDelete(req.params.id);
      if (!cohort) {
        return res.status(404).json({ message: 'Cohort not found' });
      }
      res.json({ message: 'Cohort deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getCohortClasses(req, res) {
    try {
      const classes = await Class.find({ cohort: req.params.id })
        .populate('falcuty')
        .populate('cohort');
      res.json(classes);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getCohortStudents(req, res) {
    try {
      const studentCohorts = await StudentCohort.find({ cohort: req.params.id })
        .populate({
          path: 'student',
          populate: {
            path: 'user',
            select: '-password'
          }
        })
        .populate('cohort');
      res.json(studentCohorts);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
};


