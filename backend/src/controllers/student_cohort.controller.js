// Quản lý sinh viên - khóa
const StudentCohort = require('../models/student_cohort.model');

module.exports = {
  async getAllStudentCohorts(req, res) {
    try {
      const studentCohorts = await StudentCohort.find()
        .populate({
          path: 'student',
          populate: {
            path: 'user',
            select: '-password'
          }
        })
        .populate('cohort')
        .sort({ createdAt: -1 });
      res.json(studentCohorts);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getStudentCohortById(req, res) {
    try {
      const studentCohort = await StudentCohort.findById(req.params.id)
        .populate({
          path: 'student',
          populate: {
            path: 'user',
            select: '-password'
          }
        })
        .populate('cohort');
      if (!studentCohort) {
        return res.status(404).json({ message: 'Student cohort not found' });
      }
      res.json(studentCohort);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getStudentCohortsByStudent(req, res) {
    try {
      const studentCohorts = await StudentCohort.find({ student: req.params.studentId })
        .populate({
          path: 'student',
          populate: {
            path: 'user',
            select: '-password'
          }
        })
        .populate('cohort')
        .sort({ createdAt: -1 });
      res.json(studentCohorts);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getStudentCohortsByCohort(req, res) {
    try {
      const studentCohorts = await StudentCohort.find({ cohort: req.params.cohortId })
        .populate({
          path: 'student',
          populate: {
            path: 'user',
            select: '-password'
          }
        })
        .populate('cohort')
        .sort({ createdAt: -1 });
      res.json(studentCohorts);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async createStudentCohort(req, res) {
    try {
      const studentCohort = new StudentCohort(req.body);
      await studentCohort.save();
      await studentCohort.populate({
        path: 'student',
        populate: {
          path: 'user',
          select: '-password'
        }
      });
      await studentCohort.populate('cohort');
      res.status(201).json(studentCohort);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  async updateStudentCohort(req, res) {
    try {
      const studentCohort = await StudentCohort.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      )
        .populate({
          path: 'student',
          populate: {
            path: 'user',
            select: '-password'
          }
        })
        .populate('cohort');
      if (!studentCohort) {
        return res.status(404).json({ message: 'Student cohort not found' });
      }
      res.json(studentCohort);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  async deleteStudentCohort(req, res) {
    try {
      const studentCohort = await StudentCohort.findByIdAndDelete(req.params.id);
      if (!studentCohort) {
        return res.status(404).json({ message: 'Student cohort not found' });
      }
      res.json({ message: 'Student cohort deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
};


