// Controller cho minh chứng hoạt động ngoài trường
const Evidence = require('../models/evidence.model');

module.exports = {
  async getAllEvidences(req, res) {
    try {
      const evidences = await Evidence.find();
      res.json(evidences);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  async getEvidenceById(req, res) {
    try {
      const evidence = await Evidence.findById(req.params.id);
      if (!evidence) return res.status(404).json({ message: 'Evidence not found' });
      res.json(evidence);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  async createEvidence(req, res) {
    try {
      const evidence = new Evidence({ ...req.body, user: req.user._id });
      await evidence.save();
      res.status(201).json(evidence);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
  async updateEvidence(req, res) {
    try {
      const evidence = await Evidence.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!evidence) return res.status(404).json({ message: 'Evidence not found' });
      res.json(evidence);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
  async approveEvidence(req, res) {
    try {
      const evidence = await Evidence.findByIdAndUpdate(
        req.params.id,
        { status: 'approved', confirmedBy: req.user._id, confirmedAt: new Date() },
        { new: true }
      );
      if (!evidence) return res.status(404).json({ message: 'Evidence not found' });
      res.json(evidence);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
  async rejectEvidence(req, res) {
    try {
      const evidence = await Evidence.findByIdAndUpdate(
        req.params.id,
        { status: 'rejected', confirmedBy: req.user._id, confirmedAt: new Date() },
        { new: true }
      );
      if (!evidence) return res.status(404).json({ message: 'Evidence not found' });
      res.json(evidence);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
  async deleteEvidence(req, res) {
    try {
      const evidence = await Evidence.findByIdAndDelete(req.params.id);
      if (!evidence) return res.status(404).json({ message: 'Evidence not found' });
      res.json({ message: 'Evidence deleted' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
};
