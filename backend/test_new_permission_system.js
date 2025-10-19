/**
 * Test script for the new permission system
 * Tests: user_role → role_action + user_action_override
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const User = require('./src/models/user.model');
const Role = require('./src/models/role.model');
const Action = require('./src/models/action.model');
const UserRole = require('./src/models/user_role.model');
const RoleAction = require('./src/models/role_action.model');
const UserActionOverride = require('./src/models/user_action_override.model');
const StudentProfile = require('./src/models/student_profile.model');
const OrgUnit = require('./src/models/org_unit.model');

// Import permission utilities
const {
  hasPermission,
  getUserActions,
  isClassMonitor,
  getAllUserPermissions
} = require('./src/utils/permission.util');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function testNewPermissionSystem() {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('🧪 TEST NEW PERMISSION SYSTEM');
    console.log('='.repeat(70) + '\n');

    // Connect to database
    console.log(`${colors.cyan}⏳ Connecting to MongoDB...${colors.reset}`);
    await mongoose.connect(process.env.MONGODB_URI, { 
      dbName: 'Community_Activity_Management' 
    });
    console.log(`${colors.green}✅ Connected!${colors.reset}\n`);

    // Test 1: Check collections exist
    console.log(`${colors.cyan}Test 1: Verify collections exist${colors.reset}`);
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    const requiredCollections = [
      'user', 'role', 'action', 'user_role', 
      'role_action', 'user_action_override', 'student_profile'
    ];
    
    let allExist = true;
    for (const col of requiredCollections) {
      if (collectionNames.includes(col)) {
        console.log(`  ${colors.green}✓${colors.reset} ${col}`);
      } else {
        console.log(`  ${colors.red}✗${colors.reset} ${col} - MISSING`);
        allExist = false;
      }
    }
    
    if (!allExist) {
      console.log(`\n${colors.yellow}⚠️  Some collections are missing. Please seed the database first.${colors.reset}`);
    }
    console.log();

    // Test 2: Count documents
    console.log(`${colors.cyan}Test 2: Check document counts${colors.reset}`);
    const counts = {
      users: await User.countDocuments(),
      roles: await Role.countDocuments(),
      actions: await Action.countDocuments(),
      userRoles: await UserRole.countDocuments(),
      roleActions: await RoleAction.countDocuments(),
      overrides: await UserActionOverride.countDocuments(),
      studentProfiles: await StudentProfile.countDocuments()
    };
    
    console.log(`  Users: ${counts.users}`);
    console.log(`  Roles: ${counts.roles}`);
    console.log(`  Actions: ${counts.actions}`);
    console.log(`  User-Role mappings: ${counts.userRoles}`);
    console.log(`  Role-Action mappings: ${counts.roleActions}`);
    console.log(`  User overrides: ${counts.overrides}`);
    console.log(`  Student profiles: ${counts.studentProfiles}`);
    console.log();

    if (counts.users === 0 || counts.roles === 0 || counts.actions === 0) {
      console.log(`${colors.yellow}⚠️  Insufficient data for testing. Please seed the database.${colors.reset}\n`);
      return;
    }

    // Test 3: Sample data
    console.log(`${colors.cyan}Test 3: Sample data${colors.reset}`);
    
    const sampleUser = await User.findOne();
    console.log(`  Sample User: ${sampleUser ? sampleUser.username : 'None'}`);
    
    const sampleRole = await Role.findOne();
    console.log(`  Sample Role: ${sampleRole ? sampleRole.name : 'None'}`);
    
    const sampleAction = await Action.findOne();
    console.log(`  Sample Action: ${sampleAction ? `${sampleAction.resource}.${sampleAction.action_code}` : 'None'}`);
    console.log();

    // Test 4: Test permission utility functions
    if (sampleUser && sampleRole && sampleAction) {
      console.log(`${colors.cyan}Test 4: Test permission functions${colors.reset}`);
      
      // Test hasPermission
      console.log(`  Testing hasPermission(${sampleUser.username}, ${sampleAction.resource}, ${sampleAction.action_code})...`);
      const hasPerm = await hasPermission(sampleUser._id, sampleAction.resource, sampleAction.action_code);
      console.log(`    Result: ${hasPerm ? colors.green + 'ALLOWED' : colors.red + 'DENIED'}${colors.reset}`);
      
      // Test getUserActions
      console.log(`  Testing getUserActions(${sampleUser.username}, ${sampleAction.resource})...`);
      const userActions = await getUserActions(sampleUser._id, sampleAction.resource);
      console.log(`    Actions: [${userActions.join(', ')}]`);
      
      // Test isClassMonitor
      console.log(`  Testing isClassMonitor(${sampleUser.username})...`);
      const isMonitor = await isClassMonitor(sampleUser._id);
      console.log(`    Result: ${isMonitor ? colors.green + 'YES' : colors.yellow + 'NO'}${colors.reset}`);
      
      // Test getAllUserPermissions
      console.log(`  Testing getAllUserPermissions(${sampleUser.username})...`);
      const allPerms = await getAllUserPermissions(sampleUser._id);
      const resourceCount = Object.keys(allPerms).length;
      console.log(`    Resources: ${resourceCount}`);
      for (const [resource, actions] of Object.entries(allPerms)) {
        console.log(`      ${resource}: [${actions.join(', ')}]`);
      }
      console.log();
    }

    // Test 5: Test models' static methods
    console.log(`${colors.cyan}Test 5: Test model methods${colors.reset}`);
    
    if (counts.userRoles > 0) {
      const sampleUserRole = await UserRole.findOne().populate('user_id role_id');
      if (sampleUserRole && sampleUserRole.user_id && sampleUserRole.role_id) {
        console.log(`  UserRole.getRolesForUser(${sampleUserRole.user_id.username})...`);
        const roles = await UserRole.getRolesForUser(sampleUserRole.user_id._id);
        console.log(`    Found ${roles.length} role(s)`);
        
        console.log(`  UserRole.hasRole(${sampleUserRole.user_id.username}, ${sampleUserRole.role_id.name})...`);
        const hasRole = await UserRole.hasRole(sampleUserRole.user_id._id, sampleUserRole.role_id.name);
        console.log(`    Result: ${hasRole ? colors.green + 'YES' : colors.red + 'NO'}${colors.reset}`);
      }
    }
    
    if (counts.roleActions > 0) {
      const sampleRoleAction = await RoleAction.findOne().populate('role_id');
      if (sampleRoleAction && sampleRoleAction.role_id) {
        console.log(`  RoleAction.getActionsForRole(${sampleRoleAction.role_id.name})...`);
        const actions = await RoleAction.getActionsForRole(sampleRoleAction.role_id._id);
        console.log(`    Found ${actions.length} action(s)`);
      }
    }
    console.log();

    // Summary
    console.log('='.repeat(70));
    console.log(`${colors.green}✅ PERMISSION SYSTEM TEST COMPLETED${colors.reset}`);
    console.log('='.repeat(70));
    
    console.log('\n📋 USAGE EXAMPLES:');
    console.log('  // In your route/controller:');
    console.log('  const { checkPermission, checkClassMonitor } = require("./middlewares/check_permission.middleware");');
    console.log('');
    console.log('  // Check specific permission:');
    console.log('  router.post("/activities", checkPermission("activity", "CREATE"), createActivity);');
    console.log('');
    console.log('  // Check class monitor:');
    console.log('  router.post("/class/attendance", checkClassMonitor(), updateAttendance);');
    console.log('');
    console.log('  // Check in controller:');
    console.log('  const allowed = await hasPermission(userId, "activity", "UPDATE");');
    console.log('');
    console.log('  // Get user actions:');
    console.log('  const actions = await getUserActions(userId, "activity");');
    console.log('');
    
  } catch (error) {
    console.error(`\n${colors.red}❌ ERROR: ${error.message}${colors.reset}`);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log(`\n${colors.blue}👋 Connection closed${colors.reset}\n`);
  }
}

testNewPermissionSystem();

