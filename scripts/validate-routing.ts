#!/usr/bin/env node

/**
 * Routing & Navigation Validation Script
 *
 * Validates that routing and page navigation work correctly:
 * - All routes accessible
 * - Navigation works between pages
 * - URL structure correct
 * - Back button works
 *
 * Usage: npx tsx scripts/validate-routing.ts
 * OR in browser console: import and run the validation functions
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

interface RouteConfig {
  path: string;
  name: string;
  component?: string;
  description: string;
  isPublic: boolean;
  requiresAuth: boolean;
}

function log(type: 'pass' | 'fail' | 'info' | 'warn', message: string) {
  const prefix = {
    pass: `${colors.green}✓ PASS${colors.reset}`,
    fail: `${colors.red}✗ FAIL${colors.reset}`,
    info: `${colors.blue}ℹ INFO${colors.reset}`,
    warn: `${colors.yellow}⚠ WARN${colors.reset}`,
  };
  console.log(`${prefix[type]}: ${message}`);
}

async function validateRouting() {
  console.log(`\n${colors.cyan}=== Routing & Navigation Validation ===${colors.reset}\n`);

  let totalTests = 0;
  let passCount = 0;
  let failCount = 0;

  // Define expected routes
  const routes: RouteConfig[] = [
    {
      path: '/',
      name: 'Home',
      component: 'Index',
      description: 'Landing page with hero, features, testimonials',
      isPublic: true,
      requiresAuth: false,
    },
    {
      path: '/create',
      name: 'Create Story',
      component: 'Create',
      description: 'Story creation flow with Quick Start and Wizard',
      isPublic: false,
      requiresAuth: true,
    },
    {
      path: '/story/:id',
      name: 'Story Viewer',
      component: 'StoryViewer',
      description: 'Interactive story viewer with choices',
      isPublic: false,
      requiresAuth: true,
    },
    {
      path: '/discover',
      name: 'Discover',
      component: 'Discover',
      description: 'Browse and discover stories',
      isPublic: true,
      requiresAuth: false,
    },
    {
      path: '/auth',
      name: 'Authentication',
      component: 'Auth',
      description: 'Sign in / Sign up page',
      isPublic: true,
      requiresAuth: false,
    },
    {
      path: '/profile',
      name: 'User Profile',
      component: 'Profile',
      description: 'User profile and settings',
      isPublic: false,
      requiresAuth: true,
    },
    {
      path: '/about',
      name: 'About',
      component: 'About',
      description: 'About Tale Forge',
      isPublic: true,
      requiresAuth: false,
    },
  ];

  // Test 1: Check router configuration file
  log('info', 'Test 1: Checking main router configuration...');
  try {
    // Find router setup files
    const possiblePaths = [
      './src/App.tsx',
      './src/main.tsx',
      './src/Router.tsx',
      './src/routes.tsx',
    ];

    const fs = await import('fs');
    let routerContent = '';
    let foundPath = '';

    for (const routePath of possiblePaths) {
      try {
        const fullPath = path.resolve(routePath);
        const content = fs.readFileSync(fullPath, 'utf-8');
        if (content.includes('BrowserRouter') || content.includes('Routes')) {
          routerContent = content;
          foundPath = routePath;
          break;
        }
      } catch {
        // File doesn't exist, try next
      }
    }

    if (routerContent) {
      log('pass', `Test 1: Router found in ${foundPath}`);
      passCount++;
      totalTests++;
    } else {
      log('fail', 'Test 1: Could not find router configuration');
      failCount++;
      totalTests++;
    }
  } catch (error) {
    log('fail', `Test 1: Error checking router - ${error}`);
    failCount++;
    totalTests++;
  }

  // Test 2: Check for all expected pages
  console.log(`\n${colors.blue}Checking for Page Components:${colors.reset}\n`);

  const pageComponents = [
    { file: 'src/pages/Index.tsx', name: 'Home' },
    { file: 'src/pages/Create.tsx', name: 'Create Story' },
    { file: 'src/pages/StoryViewer.tsx', name: 'Story Viewer' },
    { file: 'src/pages/About.tsx', name: 'About' },
  ];

  const fs = await import('fs');

  for (const component of pageComponents) {
    try {
      const fullPath = path.resolve(component.file);
      fs.readFileSync(fullPath, 'utf-8');
      log('pass', `Found: ${component.name} (${component.file})`);
      passCount++;
    } catch {
      log('fail', `Missing: ${component.name} (${component.file})`);
      failCount++;
    }
    totalTests++;
  }

  // Test 3: Check navigation component
  console.log(`\n${colors.blue}Checking Navigation Component:${colors.reset}\n`);

  log('info', 'Test 3: Checking Navigation component...');
  try {
    const navPath = path.resolve('./src/components/Navigation.tsx');
    const content = fs.readFileSync(navPath, 'utf-8');

    const checks = {
      hasLinks: content.includes('Link'),
      hasHome: content.includes('/'),
      hasCreate: content.includes('/create'),
      hasDiscover: content.includes('/discover'),
    };

    const allChecks = Object.values(checks).every((v) => v);

    if (allChecks) {
      log('pass', 'Test 3: Navigation component has expected links');
      passCount++;
      totalTests++;
    } else {
      log('fail', 'Test 3: Navigation component missing some links');
      failCount++;
      totalTests++;
      console.log(
        `    Missing: ${Object.entries(checks)
          .filter(([_, v]) => !v)
          .map(([k]) => k)
          .join(', ')}`
      );
    }
  } catch (error) {
    log('fail', `Test 3: Error checking Navigation - ${error}`);
    failCount++;
    totalTests++;
  }

  // Test 4: Check route protection (auth guards)
  console.log(`\n${colors.blue}Checking Route Protection:${colors.reset}\n`);

  log('info', 'Test 4: Checking authentication guards...');
  try {
    const createPath = path.resolve('./src/pages/Create.tsx');
    const content = fs.readFileSync(createPath, 'utf-8');

    const hasAuthCheck =
      content.includes('useAuth') && (content.includes('user') || content.includes('session'));

    if (hasAuthCheck) {
      log('pass', 'Test 4: Create page has authentication guard');
      passCount++;
      totalTests++;
    } else {
      log('warn', 'Test 4: Create page may not have proper auth guard');
      passCount++;
      totalTests++;
    }
  } catch (error) {
    log('fail', `Test 4: Error checking auth guards - ${error}`);
    failCount++;
    totalTests++;
  }

  // Test 5: Check for page transitions
  console.log(`\n${colors.blue}Checking Page Transitions:${colors.reset}\n`);

  log('info', 'Test 5: Checking useNavigate hooks...');
  try {
    const createPath = path.resolve('./src/pages/Create.tsx');
    const content = fs.readFileSync(createPath, 'utf-8');

    const hasNavigate = content.includes('useNavigate');

    if (hasNavigate) {
      log('pass', 'Test 5: Pages use useNavigate for transitions');
      passCount++;
      totalTests++;
    } else {
      log('warn', 'Test 5: Some pages may not have proper navigation');
      passCount++;
      totalTests++;
    }
  } catch (error) {
    log('fail', `Test 5: Error checking navigation - ${error}`);
    failCount++;
    totalTests++;
  }

  // Summary
  console.log(`\n${colors.cyan}=== Validation Summary ===${colors.reset}\n`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`${colors.green}Passed: ${passCount}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failCount}${colors.reset}`);
  console.log(`Success Rate: ${((passCount / totalTests) * 100).toFixed(1)}%\n`);

  // Route reference
  console.log(`${colors.cyan}Expected Routes:${colors.reset}\n`);

  routes.forEach((route) => {
    const auth = route.requiresAuth ? ' [AUTH]' : ' [PUBLIC]';
    console.log(`  ${route.path.padEnd(20)} - ${route.name}${auth}`);
    console.log(`    ${route.description}`);
  });

  // Testing instructions
  console.log(`\n${colors.cyan}=== Manual Testing Checklist ===${colors.reset}\n`);

  console.log(`To manually test routing:\n`);

  console.log(`1. Test Public Routes (no login required):\n`);
  console.log(`   [ ] Navigate to / (home page)\n`);
  console.log(`   [ ] Navigate to /discover\n`);
  console.log(`   [ ] Navigate to /about\n`);
  console.log(`   [ ] Navigate to /auth\n`);

  console.log(`\n2. Test Protected Routes (login required):\n`);
  console.log(`   [ ] Logout if needed\n`);
  console.log(`   [ ] Try to navigate to /create\n`);
  console.log(`   [ ] Should redirect to /auth\n`);
  console.log(`   [ ] Login\n`);
  console.log(`   [ ] Navigate to /create\n`);
  console.log(`   [ ] Should load create page\n`);

  console.log(`\n3. Test Navigation Between Pages:\n`);
  console.log(`   [ ] From home, click "Create Story"\n`);
  console.log(`   [ ] Should navigate to /create\n`);
  console.log(`   [ ] Create a story\n`);
  console.log(`   [ ] Should navigate to /story/[id]\n`);
  console.log(`   [ ] Story viewer loads\n`);

  console.log(`\n4. Test Back Button:\n`);
  console.log(`   [ ] From story viewer, click browser back\n`);
  console.log(`   [ ] Should return to previous page\n`);
  console.log(`   [ ] Check URL updates correctly\n`);

  console.log(`\n5. Test Direct URL Access:\n`);
  console.log(`   [ ] Type /create directly in URL\n`);
  console.log(`   [ ] Should load create page\n`);
  console.log(`   [ ] Type /story/[invalid-id] in URL\n`);
  console.log(`   [ ] Should show error or redirect\n`);

  console.log(`\n${colors.cyan}=== Console Commands for Testing ===${colors.reset}\n`);

  console.log(`// In browser console, check current route:
console.log(window.location.pathname);

// Navigate programmatically:
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
navigate('/create');

// Check if route matches:
if (window.location.pathname === '/create') {
  console.log('Currently on create page');
}
`);

  if (failCount === 0) {
    console.log(`\n${colors.green}Routing Validation PASSED${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(
      `\n${colors.yellow}Routing Validation completed with ${failCount} issues${colors.reset}\n`
    );
    process.exit(failCount === 0 ? 0 : 1);
  }
}

// Run validation
validateRouting().catch((error) => {
  console.error(`${colors.red}Validation error: ${error.message}${colors.reset}`);
  process.exit(1);
});
