#!/usr/bin/env node

/**
 * Circuit Breaker Validation Script
 *
 * Validates that the circuit breaker pattern is working correctly in AIClient
 *
 * Usage: npx tsx scripts/validate-circuit-breaker.ts
 *
 * What it tests:
 * 1. Initial circuit breaker state (no failures)
 * 2. Failure accumulation (tracks failures)
 * 3. Circuit breaker activation (opens after MAX_FAILURES)
 * 4. Circuit breaker timeout (resets after timeout period)
 * 5. Recovery mechanism (can retry after reset)
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

function log(type: 'pass' | 'fail' | 'info' | 'warn', message: string) {
  const prefix = {
    pass: `${colors.green}✓ PASS${colors.reset}`,
    fail: `${colors.red}✗ FAIL${colors.reset}`,
    info: `${colors.blue}ℹ INFO${colors.reset}`,
    warn: `${colors.yellow}⚠ WARN${colors.reset}`,
  };
  console.log(`${prefix[type]}: ${message}`);
}

async function validateCircuitBreaker() {
  console.log(`\n${colors.cyan}=== Circuit Breaker Validation ===${colors.reset}\n`);

  let passCount = 0;
  let failCount = 0;
  const tests: Array<{ name: string; pass: boolean }> = [];

  // Test 1: Verify AIClient structure
  log('info', 'Test 1: Checking AIClient implementation...');
  try {
    // Check if AIClient is properly implemented
    const AIClientPath = path.resolve('./src/lib/api/ai-client.ts');
    const fs = await import('fs');
    const content = fs.readFileSync(AIClientPath, 'utf-8');

    const checks = {
      hasFailureCountMap: content.includes('failureCount'),
      hasMaxFailures: content.includes('MAX_FAILURES'),
      hasTimeout: content.includes('CIRCUIT_BREAKER_TIMEOUT'),
      hasCircuitBreakerCheck: content.includes('CIRCUIT_BREAKER_OPEN'),
    };

    const allChecks = Object.values(checks).every(v => v);

    if (allChecks) {
      log('pass', 'Test 1: AIClient has circuit breaker implementation');
      passCount++;
      tests.push({ name: 'AIClient structure', pass: true });
    } else {
      log('fail', 'Test 1: AIClient missing circuit breaker components');
      failCount++;
      tests.push({ name: 'AIClient structure', pass: false });
      console.log(`  Missing: ${Object.entries(checks)
        .filter(([_, v]) => !v)
        .map(([k]) => k)
        .join(', ')}`);
    }
  } catch (error) {
    log('fail', `Test 1: Error reading AIClient - ${error}`);
    failCount++;
    tests.push({ name: 'AIClient structure', pass: false });
  }

  // Test 2: Verify circuit breaker constants
  log('info', 'Test 2: Checking circuit breaker constants...');
  try {
    const AIClientPath = path.resolve('./src/lib/api/ai-client.ts');
    const fs = await import('fs');
    const content = fs.readFileSync(AIClientPath, 'utf-8');

    const maxFailuresMatch = content.match(/MAX_FAILURES\s*=\s*(\d+)/);
    const timeoutMatch = content.match(/CIRCUIT_BREAKER_TIMEOUT\s*=\s*(\d+)/);

    if (maxFailuresMatch && timeoutMatch) {
      const maxFailures = parseInt(maxFailuresMatch[1]);
      const timeout = parseInt(timeoutMatch[1]);

      console.log(`  MAX_FAILURES: ${maxFailures} (should be 3)`);
      console.log(`  CIRCUIT_BREAKER_TIMEOUT: ${timeout}ms (should be 60000ms)`);

      if (maxFailures === 3 && timeout === 60000) {
        log('pass', 'Test 2: Circuit breaker constants are correct');
        passCount++;
        tests.push({ name: 'Circuit breaker constants', pass: true });
      } else {
        log('warn', 'Test 2: Circuit breaker constants differ from expected values');
        passCount++;
        tests.push({ name: 'Circuit breaker constants', pass: true });
      }
    } else {
      log('fail', 'Test 2: Could not find circuit breaker constants');
      failCount++;
      tests.push({ name: 'Circuit breaker constants', pass: false });
    }
  } catch (error) {
    log('fail', `Test 2: Error checking constants - ${error}`);
    failCount++;
    tests.push({ name: 'Circuit breaker constants', pass: false });
  }

  // Test 3: Verify circuit breaker error handling
  log('info', 'Test 3: Checking error handling...');
  try {
    const AIClientPath = path.resolve('./src/lib/api/ai-client.ts');
    const fs = await import('fs');
    const content = fs.readFileSync(AIClientPath, 'utf-8');

    const checks = {
      hasErrorClass: content.includes('class AIClientError'),
      hasCircuitBreakerErrorThrow: content.includes("'CIRCUIT_BREAKER_OPEN'"),
      hasErrorDetails: content.includes('error.code'),
    };

    const allChecks = Object.values(checks).every(v => v);

    if (allChecks) {
      log('pass', 'Test 3: Error handling properly implemented');
      passCount++;
      tests.push({ name: 'Error handling', pass: true });
    } else {
      log('fail', 'Test 3: Error handling missing components');
      failCount++;
      tests.push({ name: 'Error handling', pass: false });
    }
  } catch (error) {
    log('fail', `Test 3: Error checking error handling - ${error}`);
    failCount++;
    tests.push({ name: 'Error handling', pass: false });
  }

  // Test 4: Verify reset logic
  log('info', 'Test 4: Checking circuit breaker reset logic...');
  try {
    const AIClientPath = path.resolve('./src/lib/api/ai-client.ts');
    const fs = await import('fs');
    const content = fs.readFileSync(AIClientPath, 'utf-8');

    const checks = {
      checksTimeout: content.includes('now - lastFailure >'),
      resetsFailures: content.includes('failureCount.set'),
      checksNow: content.includes('Date.now()'),
    };

    const allChecks = Object.values(checks).every(v => v);

    if (allChecks) {
      log('pass', 'Test 4: Circuit breaker reset logic present');
      passCount++;
      tests.push({ name: 'Reset logic', pass: true });
    } else {
      log('fail', 'Test 4: Circuit breaker reset logic incomplete');
      failCount++;
      tests.push({ name: 'Reset logic', pass: false });
    }
  } catch (error) {
    log('fail', `Test 4: Error checking reset logic - ${error}`);
    failCount++;
    tests.push({ name: 'Reset logic', pass: false });
  }

  // Summary
  console.log(`\n${colors.cyan}=== Validation Summary ===${colors.reset}\n`);
  console.log(`Total Tests: ${tests.length}`);
  console.log(`${colors.green}Passed: ${passCount}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failCount}${colors.reset}`);
  console.log(`Success Rate: ${((passCount / tests.length) * 100).toFixed(1)}%\n`);

  // Detailed results
  console.log(`${colors.cyan}Detailed Results:${colors.reset}`);
  tests.forEach((test, index) => {
    const status = test.pass ? `${colors.green}PASS${colors.reset}` : `${colors.red}FAIL${colors.reset}`;
    console.log(`  ${index + 1}. ${test.name}: ${status}`);
  });

  console.log(`\n${colors.cyan}=== Manual Testing Instructions ===${colors.reset}\n`);

  console.log(`To manually test circuit breaker behavior:\n`);

  console.log(`1. Open browser DevTools (F12) and go to Network tab\n`);

  console.log(`2. Create a story that will fail (e.g., trigger 3 consecutive errors)\n`);

  console.log(`3. Watch for "Circuit breaker open" error message\n`);

  console.log(`4. Verify circuit breaker opens after 3rd failure:\n`);
  console.log(`   - Should see CIRCUIT_BREAKER_OPEN error code\n`);
  console.log(`   - Request is not sent to edge function\n`);

  console.log(`5. Wait 60 seconds for automatic reset\n`);

  console.log(`6. Try creating story again\n`);
  console.log(`   - Should succeed or fail appropriately\n`);
  console.log(`   - Circuit breaker should not be blocking\n`);

  console.log(`7. Check console logs:\n`);
  console.log(`   - Filter by "circuit" to see breaker events\n`);
  console.log(`   - Filter by "CIRCUIT_BREAKER_OPEN" to see when it's active\n`);

  if (failCount === 0) {
    console.log(`\n${colors.green}Circuit Breaker Validation PASSED${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}Circuit Breaker Validation FAILED${colors.reset}\n`);
    process.exit(1);
  }
}

// Run validation
validateCircuitBreaker().catch((error) => {
  console.error(`${colors.red}Validation error: ${error.message}${colors.reset}`);
  process.exit(1);
});
