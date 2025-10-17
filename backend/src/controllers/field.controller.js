// Quản lý ngành học
const Field = require('../models/field.model');

module.exports = {
  async getAllFields(req, res) {
    try {
      const fields = await Field.find().sort({ name: 1 });
      res.json(fields);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getFieldById(req, res) {
    try {
      const field = await Field.findById(req.params.id);
      if (!field) {
        return res.status(404).json({ message: 'Field not found' });
      }
      res.json(field);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async createField(req, res) {
    try {
      const field = new Field(req.body);
      await field.save();
      res.status(201).json(field);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  async updateField(req, res) {
    try {
      const field = await Field.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!field) {
        return res.status(404).json({ message: 'Field not found' });
      }
      res.json(field);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  async deleteField(req, res) {
    try {
      const field = await Field.findByIdAndDelete(req.params.id);
      if (!field) {
        return res.status(404).json({ message: 'Field not found' });
      }
      res.json({ message: 'Field deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
};


