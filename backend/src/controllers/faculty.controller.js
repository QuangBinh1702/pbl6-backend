// Quản lý khoa
const Falcuty = require('../models/falcuty.model');
const Class = require('../models/class.model');

module.exports = {
  async getAllFaculties(req, res) {
    try {
      const faculties = await Falcuty.find().sort({ name: 1 });
      res.json(faculties);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getFacultyById(req, res) {
    try {
      const faculty = await Falcuty.findById(req.params.id);
      if (!faculty) {
        return res.status(404).json({ message: 'Faculty not found' });
      }
      res.json(faculty);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async createFaculty(req, res) {
    try {
      const faculty = new Falcuty(req.body);
      await faculty.save();
      res.status(201).json(faculty);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  async updateFaculty(req, res) {
    try {
      const faculty = await Falcuty.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!faculty) {
        return res.status(404).json({ message: 'Faculty not found' });
      }
      res.json(faculty);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  async deleteFaculty(req, res) {
    try {
      const faculty = await Falcuty.findByIdAndDelete(req.params.id);
      if (!faculty) {
        return res.status(404).json({ message: 'Faculty not found' });
      }
      res.json({ message: 'Faculty deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getFacultyClasses(req, res) {
    try {
      const classes = await Class.find({ falcuty: req.params.id })
        .populate('falcuty')
        .populate('cohort');
      res.json(classes);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
};


