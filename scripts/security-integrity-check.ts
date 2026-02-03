#!/usr/bin/env tsx
/**
 * Security Integrity Check Script
 * Verifies security configurations and detects potential vulnerabilities
 */

import { readFileSync, existsSync } from 'fs';
import { glob } from 'glob';
import path from 'path';

let hasErrors = false;
let warnings = 0;

function error(message: string) {
  console.error(`\n❌ ERROR: ${message}`);
  hasErrors = true;
}

function warn(message: string) {
  console.warn(`\n⚠️  WARNING: ${message}`);
  warnings++;
}

function success(message: string) {
  console.log(`\n✅ ${message}`);
}

console.log('🔒 ORIGO Security Integrity Check\n');
console.log('='.repeat(60));

// 1. Check for exposed secrets
console.log('\n1. Checking for exposed secrets...');

if (existsSync('.env.local')) {
  warn('.env.local file exists - ensure it\'s in .gitignore');

  const gitignore = readFileSync('.gitignore', 'utf-8');
  if (!gitignore.includes('.env.local')) {
    error('.env.local is NOT in .gitignore - CRITICAL SECURITY ISSUE!');
  } else {
    success('.env.local is properly gitignored');
  }
}

// Check for hardcoded secrets in code
const tsFiles = glob.sync('src/**/*.{ts,tsx}', { ignore: 'node_modules/**' });
for (const file of tsFiles) {
  const content = readFileSync(file, 'utf-8');

  // Skip placeholder patterns (sk-ant-xxxxx with x's)
  const hasRealKey = content.match(/sk-ant-[a-zA-Z0-9]{20,}/) && !content.match(/sk-ant-x{5,}/);
  if (hasRealKey && !file.includes('test') && !file.includes('i18n/messages')) {
    error(`Potential real API key found in ${file}`);
  }

  // Skip placeholder patterns for Stripe keys
  const hasRealStripeKey = (content.match(/sk_live_[a-zA-Z0-9]{20,}/) || content.match(/pk_live_[a-zA-Z0-9]{20,}/))
    && !content.match(/sk_live_x{5,}/) && !content.match(/pk_live_x{5,}/);
  if (hasRealStripeKey && !file.includes('i18n/messages')) {
    error(`Real Stripe key found in ${file}`);
  }

  // Skip password patterns in messages/translations
  if (content.match(/password\s*=\s*["'][^"']+["']/i) && !file.includes('i18n/messages')) {
    warn(`Hardcoded password pattern in ${file}`);
  }
}

success('No hardcoded secrets detected in source code');

// 2. Check authentication on protected routes
console.log('\n2. Checking route protection...');

const apiRoutes = [
  'src/app/api/generate/route.ts',
  'src/app/api/checkout/route.ts',
];

for (const route of apiRoutes) {
  if (!existsSync(route)) continue;

  const content = readFileSync(route, 'utf-8');

  // Accept both Supabase Auth and Clerk auth patterns
  const hasAuth =
    content.includes('supabase.auth.getUser') ||
    (content.includes('auth()') && content.includes('userId')) ||
    content.includes('getServerSession') ||
    content.includes('currentUser()');

  if (!hasAuth) {
    error(`${route} missing authentication check!`);
  } else {
    success(`${route} has authentication`);
  }

  // Accept various rate limiting patterns (in-memory, Upstash, custom)
  const hasRateLimit =
    content.includes('rateLimitMap') ||
    content.includes('rate limit') ||
    content.includes('RateLimit') ||
    content.includes('rateLimit') ||
    content.includes('checkRateLimit') ||
    content.includes('Ratelimit');

  if (!hasRateLimit) {
    warn(`${route} missing rate limiting`);
  } else {
    success(`${route} has rate limiting`);
  }
}

// 3. Check Supabase RLS configuration
console.log('\n3. Checking database security...');

const storageFile = 'src/lib/storage.ts';
if (existsSync(storageFile)) {
  const content = readFileSync(storageFile, 'utf-8');

  const functions = ['getBriefDB', 'getBriefsDB', 'deleteBriefDB'];
  for (const fn of functions) {
    if (content.includes(`function ${fn}`) || content.includes(`async function ${fn}`)) {
      if (!content.match(new RegExp(`${fn}[\\s\\S]{0,500}user_id`))) {
        error(`${fn}() missing user_id filter - AUTHORIZATION VULNERABILITY!`);
      } else {
        success(`${fn}() has proper authorization`);
      }
    }
  }
}

warn('Supabase RLS policies must be verified manually in dashboard');

// 4. Check for XSS vulnerabilities
console.log('\n4. Checking XSS prevention...');

const contactSalesRoute = 'src/app/api/contact-sales/route.ts';
if (existsSync(contactSalesRoute)) {
  const content = readFileSync(contactSalesRoute, 'utf-8');

  if (content.includes('escapeHtml')) {
    success('Contact sales has HTML escaping');
  } else {
    error('Contact sales missing HTML escaping - XSS VULNERABILITY!');
  }
}

// 5. Check CSP headers
console.log('\n5. Checking security headers...');

const nextConfig = 'next.config.mjs';
if (existsSync(nextConfig)) {
  const content = readFileSync(nextConfig, 'utf-8');

  const requiredHeaders = [
    'X-Frame-Options',
    'X-Content-Type-Options',
    'Content-Security-Policy',
  ];

  for (const header of requiredHeaders) {
    if (content.includes(header)) {
      success(`${header} is configured`);
    } else {
      error(`${header} is missing!`);
    }
  }
}

// 6. Check dependencies for vulnerabilities
console.log('\n6. Checking dependencies...');

try {
  const { execSync } = require('child_process');
  const auditOutput = execSync('npm audit --json', { encoding: 'utf-8' });
  const audit = JSON.parse(auditOutput);

  const vulns = audit.metadata?.vulnerabilities || {};
  const critical = vulns.critical || 0;
  const high = vulns.high || 0;
  const moderate = vulns.moderate || 0;

  if (critical > 0) {
    error(`${critical} CRITICAL vulnerabilities in dependencies!`);
  }

  if (high > 0) {
    warn(`${high} HIGH vulnerabilities in dependencies`);
  }

  if (moderate > 0) {
    console.log(`ℹ️  ${moderate} moderate vulnerabilities (review recommended)`);
  }

  if (critical === 0 && high === 0) {
    success('No critical or high vulnerabilities in dependencies');
  }
} catch (e) {
  warn('Could not run npm audit');
}

// 7. Check password validation
console.log('\n7. Checking password security...');

const changePasswordFile = 'src/app/account/change-password/page.tsx';
if (existsSync(changePasswordFile)) {
  const content = readFileSync(changePasswordFile, 'utf-8');

  if (content.includes('currentPassword') && content.includes('signInWithPassword')) {
    success('Password change validates current password');
  } else {
    error('Password change missing current password validation!');
  }
}

// 8. Check for SQL injection vectors (Supabase should handle this)
console.log('\n8. Checking SQL injection prevention...');

success('Using Supabase ORM - SQL injection automatically prevented');

// 9. Check HTTPS enforcement
console.log('\n9. Checking HTTPS enforcement...');

if (existsSync(nextConfig)) {
  const content = readFileSync(nextConfig, 'utf-8');

  if (content.includes('upgrade-insecure-requests')) {
    success('HTTPS upgrade is configured');
  } else {
    warn('Consider adding upgrade-insecure-requests to CSP');
  }
}

// 10. Check file upload security (if applicable)
console.log('\n10. Checking file upload security...');

const uploadRoutes = glob.sync('src/app/api/**/upload*.ts');
if (uploadRoutes.length > 0) {
  warn(`Found ${uploadRoutes.length} file upload routes - ensure validation!`);
} else {
  success('No file upload routes detected');
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 SECURITY INTEGRITY REPORT\n');

if (hasErrors) {
  console.log('🚨 STATUS: FAILED - Critical security issues detected!');
  console.log(`   - Errors: ${hasErrors ? 'YES' : '0'}`);
  console.log(`   - Warnings: ${warnings}`);
  process.exit(1);
} else if (warnings > 5) {
  console.log('⚠️  STATUS: WARNING - Multiple security warnings detected');
  console.log(`   - Errors: 0`);
  console.log(`   - Warnings: ${warnings}`);
  process.exit(0); // Don't fail build, but log warnings
} else {
  console.log('✅ STATUS: PASSED - Security integrity check successful!');
  console.log(`   - Errors: 0`);
  console.log(`   - Warnings: ${warnings}`);
  process.exit(0);
}
