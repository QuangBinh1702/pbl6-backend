/**
 * Test script for Admin Permission Management
 * 
 * Usage: node test_admin_permission.js
 * 
 * This script tests the permission admin utilities:
 * 1. buildUserPermissionMatrix
 * 2. grantPermissionToUser
 * 3. revokePermissionFromUser
 * 4. applyPermissionChanges
 */

const mongoose = require('mongoose');
require('./src/config/db');

const {
  buildUserPermissionMatrix,
  grantPermissionToUser,
  revokePermissionFromUser,
  deletePermissionOverride,
  applyPermissionChanges
} = require('./src/utils/permission_admin.util');

const User = require('./src/models/user.model');
const Role = require('./src/models/role.model');
const UserRole = require('./src/models/user_role.model');
const Action = require('./src/models/action.model');

async function runTests() {
  try {
    console.log('🚀 Starting Admin Permission Tests...\n');

    // Test 1: Get a user or create one
    console.log('📝 Test 1: Finding test user...');
    let testUser = await User.findOne({ username: 'student1' });
    
    if (!testUser) {
      console.log('   Creating test user...');
      testUser = await User.create({
        username: 'student1',
        email: 'student1@test.com',
        password_hash: 'hashed_password',
        name: 'Nguyễn Văn A'
      });
    }
    console.log(`   ✅ User found: ${testUser.name} (ID: ${testUser._id})\n`);

    // Test 2: Ensure user has a role
    console.log('📝 Test 2: Assigning roles to user...');
    const studentRole = await Role.findOne({ name: 'student' });
    
    if (!studentRole) {
      console.log('   ⚠️  No student role found, skipping role assignment');
    } else {
      const existingRole = await UserRole.findOne({
        user_id: testUser._id,
        role_id: studentRole._id
      });

      if (!existingRole) {
        const userRole = new UserRole({
          user_id: testUser._id,
          role_id: studentRole._id
        });
        await userRole.save();
        console.log(`   ✅ Assigned student role to user\n`);
      } else {
        console.log(`   ✅ User already has student role\n`);
      }
    }

    // Test 3: Build permission matrix
    console.log('📝 Test 3: Building permission matrix...');
    const matrix = await buildUserPermissionMatrix(testUser._id);
    console.log(`   ✅ Matrix built successfully`);
    console.log(`   📊 Summary:`);
    console.log(`      - Total Actions: ${matrix.summary.totalActions}`);
    console.log(`      - Effective Permissions: ${matrix.summary.effectiveCount}`);
    console.log(`      - Overrides: ${matrix.summary.overrideCount}`);
    console.log(`      - Granted Overrides: ${matrix.summary.grantedCount}`);
    console.log(`      - Revoked Overrides: ${matrix.summary.revokedCount}\n`);

    // Show some permissions
    console.log(`   📋 Sample Permissions (first 5):`);
    matrix.permissions.slice(0, 5).forEach(perm => {
      const status = perm.effective ? '✅' : '❌';
      const source = perm.viaRoles ? 'role' : 'override';
      console.log(`      ${status} ${perm.action_name} (${perm.action_code}) - via ${source}`);
    });
    console.log();

    // Test 4: Grant a permission
    console.log('📝 Test 4: Granting a permission...');
    
    // Find an activity action
    const activityAction = await Action.findOne({ resource: 'activity', action_code: 'DELETE' });
    
    if (activityAction) {
      const grantResult = await grantPermissionToUser(
        testUser._id,
        activityAction._id,
        testUser._id,
        'Testing permission grant'
      );
      console.log(`   ✅ Grant Result: ${grantResult.message}`);
      console.log(`      Action Taken: ${grantResult.actionTaken}\n`);
    } else {
      console.log('   ⚠️  No activity DELETE action found\n');
    }

    // Test 5: Build matrix again to see changes
    console.log('📝 Test 5: Verifying changes in matrix...');
    const updatedMatrix = await buildUserPermissionMatrix(testUser._id);
    console.log(`   ✅ Matrix updated`);
    console.log(`   📊 Updated Summary:`);
    console.log(`      - Effective Permissions: ${updatedMatrix.summary.effectiveCount}`);
    console.log(`      - Overrides: ${updatedMatrix.summary.overrideCount}`);
    console.log(`      - Granted Overrides: ${updatedMatrix.summary.grantedCount}\n`);

    // Test 6: Revoke a permission
    console.log('📝 Test 6: Revoking a permission...');
    
    // Find an activity:read action which should be via role
    const readAction = await Action.findOne({ resource: 'activity', action_code: 'READ' });
    
    if (readAction) {
      const revokeResult = await revokePermissionFromUser(
        testUser._id,
        readAction._id,
        testUser._id,
        'Testing permission revoke'
      );
      console.log(`   ✅ Revoke Result: ${revokeResult.message}`);
      console.log(`      Action Taken: ${revokeResult.actionTaken}\n`);
    }

    // Test 7: Apply multiple changes
    console.log('📝 Test 7: Applying multiple changes...');
    
    const createAction = await Action.findOne({ resource: 'activity', action_code: 'CREATE' });
    const updateAction = await Action.findOne({ resource: 'activity', action_code: 'UPDATE' });
    
    const changes = [];
    if (createAction) changes.push({ actionId: createAction._id, desiredEffective: true });
    if (updateAction) changes.push({ actionId: updateAction._id, desiredEffective: false });
    
    if (changes.length > 0) {
      const result = await applyPermissionChanges(testUser._id, changes, testUser._id);
      console.log(`   ✅ Applied ${result.changes.length} changes`);
      console.log(`   📊 Final Summary:`);
      console.log(`      - Effective Permissions: ${result.updatedMatrix.summary.effectiveCount}`);
      console.log(`      - Overrides: ${result.updatedMatrix.summary.overrideCount}\n`);
    }

    // Test 8: Display final matrix
    console.log('📝 Test 8: Final Permission Matrix');
    const finalMatrix = await buildUserPermissionMatrix(testUser._id);
    
    console.log(`\n   📋 User: ${finalMatrix.user.name}`);
    console.log(`   🔐 Roles: ${finalMatrix.roles.map(r => r.role_name).join(', ')}`);
    console.log(`\n   📊 Permission Summary:`);
    console.log(`      Total: ${finalMatrix.summary.totalActions}`);
    console.log(`      Effective: ${finalMatrix.summary.effectiveCount}`);
    console.log(`      Overrides: ${finalMatrix.summary.overrideCount}`);
    
    if (finalMatrix.summary.overrideCount > 0) {
      console.log(`\n   🔧 Current Overrides:`);
      finalMatrix.permissions
        .filter(p => p.overrideType)
        .forEach(perm => {
          const type = perm.overrideType === 'grant' ? '✚ GRANT' : '✕ DENY';
          console.log(`      ${type}: ${perm.action_name} (${perm.action_code})`);
          if (perm.overrideNote) console.log(`         Note: ${perm.overrideNote}`);
        });
    }

    console.log('\n✅ All tests completed successfully!\n');

  } catch (error) {
    console.error('❌ Test Error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run tests
runTests();
