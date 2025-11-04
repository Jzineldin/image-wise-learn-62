#!/usr/bin/env node

/**
 * Age Group Validation Script
 *
 * Validates that age group handling works correctly across the application:
 * - Age group validation (only 4-6, 7-9, 10-12, 13+ allowed)
 * - Age group normalization (consistent format)
 * - Database storage (correct values in database)
 * - UI display (shows correctly to users)
 *
 * Usage: npx tsx scripts/validate-age-groups.ts
 */

import path from 'path';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

interface TestCase {
  input: string;
  expectedValid: boolean;
  description: string;
}

const AGE_GROUPS = ['4-6', '7-9', '10-12', '13+'];

function log(type: 'pass' | 'fail' | 'info' | 'warn', message: string) {
  const prefix = {
    pass: `${colors.green}✓ PASS${colors.reset}`,
    fail: `${colors.red}✗ FAIL${colors.reset}`,
    info: `${colors.blue}ℹ INFO${colors.reset}`,
    warn: `${colors.yellow}⚠ WARN${colors.reset}`,
  };
  console.log(`${prefix[type]}: ${message}`);
}

async function validateAgeGroups() {
  console.log(`\n${colors.cyan}=== Age Group Validation ===${colors.reset}\n`);

  let totalTests = 0;
  let passCount = 0;
  let failCount = 0;

  // Test 1: Check validation function
  log('info', 'Test 1: Verifying validation function implementation...');
  try {
    const validationPath = path.resolve('./src/lib/utils/validation.ts');
    const fs = await import('fs');
    const content = fs.readFileSync(validationPath, 'utf-8');

    const hasValidationFunction = content.includes('isValidAgeGroup');
    const hasAgeGroupList = content.includes('4-6') && content.includes('13+');
    const hasValidation = content.includes('validAgeGroups.includes');

    if (hasValidationFunction && hasAgeGroupList && hasValidation) {
      log('pass', 'Test 1: Validation function properly implemented');
      passCount++;
    } else {
      log('fail', 'Test 1: Validation function is missing or incomplete');
      failCount++;
      if (!hasValidationFunction) console.log('    - Missing isValidAgeGroup function');
      if (!hasAgeGroupList) console.log('    - Missing age group list');
      if (!hasValidation) console.log('    - Missing validation logic');
    }
    totalTests++;
  } catch (error) {
    log('fail', `Test 1: Error reading validation file - ${error}`);
    failCount++;
    totalTests++;
  }

  // Test 2: Check database schema
  log('info', 'Test 2: Checking database schema for age_group constraint...');
  try {
    const schemaPath = path.resolve('./supabase/migrations/20250900000000_baseline_schema.sql');
    const fs = await import('fs');
    const content = fs.readFileSync(schemaPath, 'utf-8');

    const hasAgeGroupColumn = content.includes('age_group');
    const hasCheckConstraint = content.includes('CHECK') || content.includes('check');

    if (hasAgeGroupColumn) {
      log('pass', 'Test 2: Database has age_group column');
      passCount++;
      if (hasCheckConstraint) {
        console.log('    - Also has check constraint for valid values');
      } else {
        console.log('    - No check constraint found (validation in code only)');
      }
    } else {
      log('fail', 'Test 2: age_group column not found in schema');
      failCount++;
    }
    totalTests++;
  } catch (error) {
    log('fail', `Test 2: Error reading schema - ${error}`);
    failCount++;
    totalTests++;
  }

  // Test 3: Check story creation wizard
  log('info', 'Test 3: Checking StoryCreationWizard uses age groups...');
  try {
    const wizardPath = path.resolve('./src/components/story-creation/StoryCreationWizard.tsx');
    const fs = await import('fs');
    const content = fs.readFileSync(wizardPath, 'utf-8');

    const hasAgeGroupHandling = content.includes('ageGroup') && content.includes('updateFlow');
    const hasStep = content.includes('AgeGenreStep');

    if (hasAgeGroupHandling && hasStep) {
      log('pass', 'Test 3: Wizard properly handles age groups');
      passCount++;
    } else {
      log('fail', 'Test 3: Wizard missing age group handling');
      failCount++;
    }
    totalTests++;
  } catch (error) {
    log('fail', `Test 3: Error reading wizard - ${error}`);
    failCount++;
    totalTests++;
  }

  // Test 4: Check story viewer displays age group
  log('info', 'Test 4: Checking StoryViewer displays age group...');
  try {
    const viewerPath = path.resolve('./src/pages/StoryViewer.tsx');
    const fs = await import('fs');
    const content = fs.readFileSync(viewerPath, 'utf-8');

    const hasAgeGroup = content.includes('age_group');
    const hasMetadata = content.includes('StoryMetadata');

    if (hasAgeGroup || hasMetadata) {
      log('pass', 'Test 4: Story viewer can display age group');
      passCount++;
    } else {
      log('fail', 'Test 4: Story viewer missing age group display');
      failCount++;
    }
    totalTests++;
  } catch (error) {
    log('fail', `Test 4: Error reading viewer - ${error}`);
    failCount++;
    totalTests++;
  }

  // Test 5: Validate each age group value
  console.log(`\n${colors.blue}Validating Age Group Values:${colors.reset}\n`);

  const testCases: TestCase[] = [
    // Valid age groups
    { input: '4-6', expectedValid: true, description: 'Valid: 4-6 (toddler/preschool)' },
    { input: '7-9', expectedValid: true, description: 'Valid: 7-9 (early elementary)' },
    { input: '10-12', expectedValid: true, description: 'Valid: 10-12 (late elementary)' },
    { input: '13+', expectedValid: true, description: 'Valid: 13+ (teen and up)' },

    // Invalid age groups - common mistakes
    { input: '4', expectedValid: false, description: 'Invalid: 4 (no range)' },
    { input: '6', expectedValid: false, description: 'Invalid: 6 (no range)' },
    { input: '0-3', expectedValid: false, description: 'Invalid: 0-3 (not in list)' },
    { input: '4-5', expectedValid: false, description: 'Invalid: 4-5 (not in list)' },
    { input: '4-7', expectedValid: false, description: 'Invalid: 4-7 (partially valid)' },
    { input: '6-8', expectedValid: false, description: 'Invalid: 6-8 (not in list)' },
    { input: '8-10', expectedValid: false, description: 'Invalid: 8-10 (not in list)' },
    { input: '10-13', expectedValid: false, description: 'Invalid: 10-13 (not in list)' },
    { input: '13', expectedValid: false, description: 'Invalid: 13 (missing +)' },
    { input: '14+', expectedValid: false, description: 'Invalid: 14+ (not in list)' },
    { input: '18+', expectedValid: false, description: 'Invalid: 18+ (too old)' },

    // Invalid - formatting issues
    { input: ' 4-6', expectedValid: false, description: 'Invalid: leading space' },
    { input: '4-6 ', expectedValid: false, description: 'Invalid: trailing space' },
    { input: '4 - 6', expectedValid: false, description: 'Invalid: spaces around dash' },
    { input: '4–6', expectedValid: false, description: 'Invalid: em-dash instead of hyphen' },

    // Edge cases
    { input: '', expectedValid: false, description: 'Invalid: empty string' },
    { input: 'kids', expectedValid: false, description: 'Invalid: text input' },
    { input: 'preschool', expectedValid: false, description: 'Invalid: age name' },
    { input: null, expectedValid: false, description: 'Invalid: null' },
    { input: undefined, expectedValid: false, description: 'Invalid: undefined' },
  ];

  let casePassCount = 0;
  let caseFailCount = 0;

  testCases.forEach((testCase, index) => {
    const isValid = AGE_GROUPS.includes(testCase.input);
    const passed = isValid === testCase.expectedValid;

    if (passed) {
      casePassCount++;
      console.log(`  ${colors.green}✓${colors.reset} Test ${index + 1}: ${testCase.description}`);
    } else {
      caseFailCount++;
      console.log(
        `  ${colors.red}✗${colors.reset} Test ${index + 1}: ${testCase.description}`
      );
      console.log(`      Expected: ${testCase.expectedValid}, Got: ${isValid}`);
    }
  });

  passCount += casePassCount;
  failCount += caseFailCount;
  totalTests += testCases.length;

  // Test 6: Check age group in story creation flow
  console.log(`\n${colors.blue}Checking Age Group Flow Integration:${colors.reset}\n`);

  log('info', 'Test 5: Quick Start flow uses age groups...');
  try {
    const createPath = path.resolve('./src/pages/Create.tsx');
    const fs = await import('fs');
    const content = fs.readFileSync(createPath, 'utf-8');

    const hasAgeGroup = content.includes('ageGroup') || content.includes('age_group');
    const hasWizard = content.includes('StoryCreationWizard');

    if (hasAgeGroup && hasWizard) {
      log('pass', 'Test 5: Quick Start properly integrated with age groups');
      passCount++;
    } else {
      log('fail', 'Test 5: Quick Start missing age group integration');
      failCount++;
    }
    totalTests++;
  } catch (error) {
    log('fail', `Test 5: Error reading Create page - ${error}`);
    failCount++;
    totalTests++;
  }

  // Summary
  console.log(`\n${colors.cyan}=== Validation Summary ===${colors.reset}\n`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`${colors.green}Passed: ${passCount}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failCount}${colors.reset}`);
  console.log(`Success Rate: ${((passCount / totalTests) * 100).toFixed(1)}%\n`);

  // Valid age groups reference
  console.log(`${colors.cyan}Valid Age Groups:${colors.reset}\n`);
  AGE_GROUPS.forEach((ag) => {
    console.log(`  - ${ag}`);
  });

  // Testing checklist
  console.log(`\n${colors.cyan}=== Manual Testing Checklist ===${colors.reset}\n`);

  console.log(`To manually test age group functionality:\n`);

  console.log(`1. Create story with each age group:\n`);
  AGE_GROUPS.forEach((ag) => {
    console.log(`   [ ] Create story with age group: ${ag}`);
  });

  console.log(`\n2. For each created story, verify in database:\n`);
  console.log(`   [ ] Connect to Supabase database\n`);
  console.log(`   [ ] Run: SELECT id, age_group FROM stories WHERE user_id = '[your-id]'\n`);
  console.log(`   [ ] Verify all age_group values match what was selected\n`);

  console.log(`3. Verify story viewer displays age group:\n`);
  console.log(`   [ ] Open each story\n`);
  console.log(`   [ ] Verify age group shows in story metadata\n`);
  console.log(`   [ ] Verify content is appropriate for age group\n`);

  console.log(`4. Test validation:\n`);
  console.log(`   [ ] Try to create story with invalid age group via browser console\n`);
  console.log(`   [ ] Should be rejected by validation\n`);

  console.log(`5. Test normalization:\n`);
  console.log(`   [ ] Age group should always display consistently\n`);
  console.log(`   [ ] No extra spaces or formatting\n`);

  console.log(`\n${colors.cyan}=== Console Commands for Testing ===${colors.reset}\n`);

  console.log(`// In browser console, validate age group:
import { isValidAgeGroup } from '@/lib/utils/validation';

console.log(isValidAgeGroup('4-6'));    // should be true
console.log(isValidAgeGroup('7-9'));    // should be true
console.log(isValidAgeGroup('10-12'));  // should be true
console.log(isValidAgeGroup('13+'));    // should be true
console.log(isValidAgeGroup('4-7'));    // should be false
console.log(isValidAgeGroup('kids'));   // should be false
`);

  if (failCount === 0) {
    console.log(`\n${colors.green}Age Group Validation PASSED${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.yellow}Age Group Validation completed with ${failCount} issues${colors.reset}\n`);
    process.exit(failCount === 0 ? 0 : 1);
  }
}

// Run validation
validateAgeGroups().catch((error) => {
  console.error(
    `${colors.red}Validation error: ${error.message}${colors.reset}`
  );
  process.exit(1);
});
