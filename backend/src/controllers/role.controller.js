// Quản lý vai trò
const Role = require('../models/role.model');
const User = require('../models/user.model');

module.exports = {
  async getAllRoles(req, res) {
    try {
      const roles = await Role.find().sort({ name: 1 });
      res.json(roles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getRoleById(req, res) {
    try {
      const role = await Role.findById(req.params.id);
      if (!role) {
        return res.status(404).json({ message: 'Role not found' });
      }
      res.json(role);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getRoleByName(req, res) {
    try {
      const role = await Role.findOne({ name: req.params.name });
      if (!role) {
        return res.status(404).json({ message: 'Role not found' });
      }
      res.json(role);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async createRole(req, res) {
    try {
      const role = new Role(req.body);
      await role.save();
      res.status(201).json(role);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  async updateRole(req, res) {
    try {
      const role = await Role.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!role) {
        return res.status(404).json({ message: 'Role not found' });
      }
      res.json(role);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  async deleteRole(req, res) {
    try {
      const role = await Role.findByIdAndDelete(req.params.id);
      if (!role) {
        return res.status(404).json({ message: 'Role not found' });
      }
      res.json({ message: 'Role deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async addPermission(req, res) {
    try {
      const { permission } = req.body;
      const role = await Role.findById(req.params.id);
      
      if (!role) {
        return res.status(404).json({ message: 'Role not found' });
      }

      if (!role.permissions.includes(permission)) {
        role.permissions.push(permission);
        await role.save();
      }

      res.json(role);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  async removePermission(req, res) {
    try {
      const { permission } = req.body;
      const role = await Role.findById(req.params.id);
      
      if (!role) {
        return res.status(404).json({ message: 'Role not found' });
      }

      role.permissions = role.permissions.filter(p => p !== permission);
      await role.save();

      res.json(role);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  async getUsersByRole(req, res) {
    try {
      const role = await Role.findById(req.params.id);
      if (!role) {
        return res.status(404).json({ message: 'Role not found' });
      }

      const users = await User.find({ role: role.name }).select('-password');
      res.json(users);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
};


