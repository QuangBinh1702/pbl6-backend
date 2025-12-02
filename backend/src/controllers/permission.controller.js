const Permission = require('../models/permission.model');
const Action = require('../models/action.model');
const Role = require('../models/role.model');
const RoleAction = require('../models/role_action.model');
const UserRole = require('../models/user_role.model');
const UserActionOverride = require('../models/user_action_override.model');
const User = require('../models/user.model');
const StudentProfile = require('../models/student_profile.model');
const StaffProfile = require('../models/staff_profile.model');
const { hasPermission, getUserActions, getAllUserPermissions } = require('../utils/permission.util');

/**
 * Lấy tất cả permissions
 */
exports.getAllPermissions = async (req, res) => {
  try {
    const { search } = req.query;
    
    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { resource: { $regex: search, $options: 'i' } }
      ];
    }
    
    const permissions = await Permission.find(query)
      .select('resource name description')
      .sort({ resource: 1, name: 1 });
    
    res.json({
      success: true,
      count: permissions.length,
      data: permissions
    });
  } catch (err) {
    console.error('Get all permissions error:', err);
    res.status(500).json({
      success: false,
      message: 'Error retrieving permissions',
      error: err.message
    });
  }
};

/**
 * Lấy tất cả actions
 */
exports.getAllActions = async (req, res) => {
  try {
    const { resource, is_active } = req.query;
    
    const query = {};
    if (resource) query.resource = resource;
    if (is_active !== undefined) query.is_active = is_active === 'true';
    
    const actions = await Action.find(query)
      .select('action_code action_name resource description is_active')
      .sort({ resource: 1, action_code: 1 });
    
    res.json({
      success: true,
      count: actions.length,
      data: actions
    });
  } catch (err) {
    console.error('Get all actions error:', err);
    res.status(500).json({
      success: false,
      message: 'Error retrieving actions',
      error: err.message
    });
  }
};

/**
 * Lấy actions theo resource
 */
exports.getActionsByResource = async (req, res) => {
  try {
    const { resource } = req.params;
    
    const actions = await Action.find({ 
      resource,
      is_active: true 
    })
      .select('action_code action_name description')
      .sort({ action_code: 1 });
    
    res.json({
      success: true,
      resource,
      count: actions.length,
      data: actions
    });
  } catch (err) {
    console.error('Get actions by resource error:', err);
    res.status(500).json({
      success: false,
      message: 'Error retrieving actions',
      error: err.message
    });
  }
};

/**
 * Tạo permission mới
 */
exports.createPermission = async (req, res) => {
  try {
    const { resource, name, description } = req.body;
    
    if (!resource || !name) {
      return res.status(400).json({
        success: false,
        message: 'resource and name are required'
      });
    }
    
    const permission = await Permission.create({
      resource,
      name,
      description
    });
    
    res.status(201).json({
      success: true,
      data: permission
    });
  } catch (err) {
    console.error('Create permission error:', err);
    res.status(400).json({
      success: false,
      message: 'Error creating permission',
      error: err.message
    });
  }
};

/**
 * Tạo action mới
 */
exports.createAction = async (req, res) => {
  try {
    const { action_code, action_name, resource, description, is_active } = req.body;
    
    if (!action_code || !action_name || !resource) {
      return res.status(400).json({
        success: false,
        message: 'action_code, action_name, and resource are required'
      });
    }
    
    // Check if action already exists
    const existing = await Action.findOne({ 
      resource, 
      action_code: action_code.toUpperCase() 
    });
    
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Action already exists for this resource'
      });
    }
    
    const action = await Action.create({
      action_code: action_code.toUpperCase(),
      action_name,
      resource,
      description,
      is_active: is_active !== false
    });
    
    res.status(201).json({
      success: true,
      data: action
    });
  } catch (err) {
    console.error('Create action error:', err);
    res.status(400).json({
      success: false,
      message: 'Error creating action',
      error: err.message
    });
  }
};

/**
 * Kiểm tra user có permission không
 */
exports.checkUserPermission = async (req, res) => {
  try {
    const { userId } = req.params;
    const { resource, action } = req.body;
    
    if (!resource || !action) {
      return res.status(400).json({
        success: false,
        message: 'resource and action are required'
      });
    }
    
    const allowed = await hasPermission(userId, resource, action);
    
    // Get action name from Action model
    const actionDoc = await Action.findOne({
      resource,
      action_code: action.toUpperCase(),
      is_active: true
    });
    
    res.json({
      success: true,
      allowed,
      user: userId,
      resource,
      action,
      action_name: actionDoc?.action_name || action
    });
  } catch (err) {
    console.error('Check user permission error:', err);
    res.status(500).json({
      success: false,
      message: 'Error checking permission',
      error: err.message
    });
  }
};

/**
 * Lấy tất cả permissions của user
 */
exports.getUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get all permissions grouped by resource (already includes action_code and action_name)
    const permissions = await getAllUserPermissions(userId);
    
    // Get user roles
    const userRoles = await UserRole.find({ user_id: userId })
      .populate('role_id')
      .populate('org_unit_id');
    
    // Get user overrides
    const overrides = await UserActionOverride.find({ user_id: userId })
      .populate('action_id');
    
    res.json({
      success: true,
      user: userId,
      roles: userRoles.map(ur => ({
        role: ur.role_id?.name,
        orgUnit: ur.org_unit_id?.name
      })),
      permissions,
      overrides: overrides.map(o => ({
        action: `${o.action_id?.resource}.${o.action_id?.action_code}`,
        action_name: o.action_id?.action_name || o.action_id?.action_code,
        granted: o.is_granted
      }))
    });
  } catch (err) {
    console.error('Get user permissions error:', err);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user permissions',
      error: err.message
    });
  }
};

/**
 * Lấy actions của user cho một resource cụ thể
 */
exports.getUserActionsForResource = async (req, res) => {
  try {
    const { userId, resource } = req.params;
    
    const actions = await getUserActions(userId, resource);
    
    res.json({
      success: true,
      user: userId,
      resource,
      actions
    });
  } catch (err) {
    console.error('Get user actions for resource error:', err);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user actions',
      error: err.message
    });
  }
};

/**
 * Lấy tất cả roles
 */
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find()
      .select('name description')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      count: roles.length,
      data: roles
    });
  } catch (err) {
    console.error('Get all roles error:', err);
    res.status(500).json({
      success: false,
      message: 'Error retrieving roles',
      error: err.message
    });
  }
};

/**
 * Lấy actions của một role
 */
exports.getRoleActions = async (req, res) => {
  try {
    const { roleId } = req.params;
    
    const roleActions = await RoleAction.find({ role_id: roleId })
      .populate('action_id');
    
    const actions = roleActions
      .filter(ra => ra.action_id)
      .map(ra => ({
        id: ra.action_id._id,
        code: ra.action_id.action_code,
        name: ra.action_id.action_name,
        resource: ra.action_id.resource,
        description: ra.action_id.description
      }));
    
    res.json({
      success: true,
      roleId,
      count: actions.length,
      data: actions
    });
  } catch (err) {
    console.error('Get role actions error:', err);
    res.status(500).json({
      success: false,
      message: 'Error retrieving role actions',
      error: err.message
    });
  }
};

/**
 * Thêm action vào role
 */
exports.addActionToRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { action_id } = req.body;
    
    if (!action_id) {
      return res.status(400).json({
        success: false,
        message: 'action_id is required'
      });
    }
    
    // Check if role exists
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    // Check if action exists
    const action = await Action.findById(action_id);
    if (!action) {
      return res.status(404).json({
        success: false,
        message: 'Action not found'
      });
    }
    
    // Check if already assigned
    const existing = await RoleAction.findOne({ role_id: roleId, action_id });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Action already assigned to this role'
      });
    }
    
    const roleAction = await RoleAction.create({ role_id: roleId, action_id });
    await roleAction.populate('action_id');
    
    res.status(201).json({
      success: true,
      data: roleAction
    });
  } catch (err) {
    console.error('Add action to role error:', err);
    res.status(400).json({
      success: false,
      message: 'Error adding action to role',
      error: err.message
    });
  }
};

/**
 * Xóa action khỏi role
 */
exports.removeActionFromRole = async (req, res) => {
  try {
    const { roleId, actionId } = req.params;
    
    const roleAction = await RoleAction.findOneAndDelete({
      role_id: roleId,
      action_id: actionId
    });
    
    if (!roleAction) {
      return res.status(404).json({
        success: false,
        message: 'Role-Action assignment not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Action removed from role successfully'
    });
  } catch (err) {
    console.error('Remove action from role error:', err);
    res.status(500).json({
      success: false,
      message: 'Error removing action from role',
      error: err.message
    });
  }
};

/**
 * Lấy thông tin user và permissions theo username
 */
exports.getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    
    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get user roles
    const userRoles = await UserRole.find({ user_id: user._id })
      .populate('role_id')
      .populate('org_unit_id');
    
    // Get all permissions grouped by resource
    const permissions = await getAllUserPermissions(user._id);
    
    // Get user overrides
    const overrides = await UserActionOverride.find({ user_id: user._id })
      .populate('action_id');
    
    // Check if user is student or staff
    const studentProfile = await StudentProfile.findOne({ user_id: user._id });
    const staffProfile = await StaffProfile.findOne({ user_id: user._id });
    
    const userType = studentProfile ? 'student' : staffProfile ? 'staff' : 'unknown';
    
    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        active: user.active,
        isLocked: user.isLocked,
        userType
      },
      roles: userRoles.map(ur => ({
        id: ur._id,
        role: ur.role_id?.name,
        roleId: ur.role_id?._id,
        orgUnit: ur.org_unit_id ? {
          id: ur.org_unit_id._id,
          name: ur.org_unit_id.name
        } : null
      })),
      permissions,
      overrides: overrides.map(o => ({
        action_id: o.action_id?._id,
        resource: o.action_id?.resource,
        action_code: o.action_id?.action_code,
        action_name: o.action_id?.action_name || o.action_id?.action_code,
        is_granted: o.is_granted
      }))
    });
  } catch (err) {
    console.error('Get user by username error:', err);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user information',
      error: err.message
    });
  }
};

/**
 * Cập nhật permissions cho user (bulk update actions)
 */
exports.updateUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { actions } = req.body; // Array of { action_id, is_granted }
    
    if (!Array.isArray(actions)) {
      return res.status(400).json({
        success: false,
        message: 'actions must be an array'
      });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const results = [];
    
    // Process each action
    for (const actionData of actions) {
      const { action_id, is_granted } = actionData;
      
      if (!action_id) continue;
      
      // Check if action exists
      const action = await Action.findById(action_id);
      if (!action) {
        results.push({ action_id, success: false, message: 'Action not found' });
        continue;
      }
      
      // Create or update override
      const override = await UserActionOverride.findOneAndUpdate(
        { user_id: userId, action_id },
        { is_granted: is_granted !== false },
        { upsert: true, new: true }
      ).populate('action_id');
      
      results.push({
        action_id,
        success: true,
        data: override
      });
    }
    
    res.json({
      success: true,
      message: 'Permissions updated successfully',
      results
    });
  } catch (err) {
    console.error('Update user permissions error:', err);
    res.status(500).json({
      success: false,
      message: 'Error updating user permissions',
      error: err.message
    });
  }
};

/**
 * Gán role tổ chức cho sinh viên
 */
exports.assignOrgRoleToStudent = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role_id, org_unit_id, position } = req.body;
    
    if (!role_id || !org_unit_id) {
      return res.status(400).json({
        success: false,
        message: 'role_id and org_unit_id are required'
      });
    }
    
    // Check if user exists and is a student
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const studentProfile = await StudentProfile.findOne({ user_id: userId });
    if (!studentProfile) {
      return res.status(400).json({
        success: false,
        message: 'User is not a student'
      });
    }
    
    // Check if role exists
    const role = await Role.findById(role_id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    // Check if user-role assignment already exists
    const existing = await UserRole.findOne({
      user_id: userId,
      role_id,
      org_unit_id
    });
    
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'User already has this role in this organization unit'
      });
    }
    
    // Create user role assignment
    const userRole = await UserRole.create({
      user_id: userId,
      role_id,
      org_unit_id
    });
    
    // If position is provided, create or update staff profile
    if (position) {
      const existingStaffProfile = await StaffProfile.findOne({ user_id: userId });
      if (existingStaffProfile) {
        // Update existing staff profile
        existingStaffProfile.org_unit_id = org_unit_id;
        existingStaffProfile.position = position;
        await existingStaffProfile.save();
      } else {
        // Create new staff profile for student with org role
        await StaffProfile.create({
          user_id: userId,
          staff_number: `ORG_${studentProfile.student_number || userId}`,
          org_unit_id,
          position,
          full_name: studentProfile.full_name || user.username
        });
      }
    }
    
    await userRole.populate('role_id');
    await userRole.populate('org_unit_id');
    
    res.status(201).json({
      success: true,
      message: 'Organization role assigned to student successfully',
      data: userRole
    });
  } catch (err) {
    console.error('Assign org role to student error:', err);
    res.status(500).json({
      success: false,
      message: 'Error assigning organization role to student',
      error: err.message
    });
  }
};

module.exports = exports;
