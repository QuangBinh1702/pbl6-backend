// Quản lý khoa
const OrgUnit = require('../models/org_unit.model');
const Class = require('../models/class.model');

module.exports = {
  async getAllFaculties(req, res) {
    try {
      const faculties = await OrgUnit.find({ type: 'faculty' })
        .populate('leader_id')
        .sort({ name: 1 });
      res.json(faculties);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getFacultyById(req, res) {
    try {
      const faculty = await OrgUnit.findById(req.params.id)
        .populate('leader_id');
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
      const facultyData = {
        ...req.body,
        type: 'faculty'
      };
      const faculty = new OrgUnit(facultyData);
      await faculty.save();
      await faculty.populate('leader_id');
      res.status(201).json(faculty);
    } catch (err) {
      if (err.code === 11000) {
        return res.status(400).json({ message: `Khoa "${req.body.name}" đã tồn tại` });
      }
      res.status(400).json({ message: err.message });
    }
  },

  async updateFaculty(req, res) {
    try {
      const faculty = await OrgUnit.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      )
        .populate('leader_id');
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
      const faculty = await OrgUnit.findByIdAndDelete(req.params.id);
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


