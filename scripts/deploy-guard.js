
import fs from 'fs';
import path from 'path';

console.log('\n[DEPLOY GUARD] 🛡️  Initiating Deployment Safety Protocol...');

// 1. DETECT BUILD ARTIFACTS
const BUILD_DIRS = ['dist', 'build'];
let buildDir = null;

// process.cwd() works in ESM, so no need for __dirname shim here
for (const dir of BUILD_DIRS) {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    buildDir = fullPath;
    break;
  }
}

if (!buildDir) {
  console.error('[DEPLOY GUARD] ❌ CRITICAL FAIL: No build output found (dist/build). Deployment Aborted.');
  // Exit code 1 forces Netlify to mark the build as FAILED and stop deployment.
  process.exit(1); 
}

console.log(`[DEPLOY GUARD] ✅ Build directory verified: ${path.basename(buildDir)}`);

// 2. VALIDATE CRITICAL FILES
const indexHtml = path.join(buildDir, 'index.html');
const assetsDir = path.join(buildDir, 'assets');

if (!fs.existsSync(indexHtml)) {
  console.error('[DEPLOY GUARD] ❌ CRITICAL FAIL: index.html missing. White screen risk. Deployment Aborted.');
  process.exit(1);
}

// 3. HEURISTIC INTEGRITY CHECK
// A suspiciously small index.html often means a build error resulted in an empty file.
const stats = fs.statSync(indexHtml);
if (stats.size < 400) {
  console.error(`[DEPLOY GUARD] ❌ CRITICAL FAIL: index.html is dangerously small (${stats.size} bytes). Potential corruption.`);
  process.exit(1);
}

// 4. ASSET VERIFICATION
// Ensure JS/CSS assets were actually generated
if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    if (files.length === 0) {
        console.error('[DEPLOY GUARD] ⚠️  WARNING: Assets directory is empty.');
    } else {
        console.log(`[DEPLOY GUARD] ✅ Assets verified: ${files.length} files generated.`);
    }
}

// 5. SUCCESS
console.log(`[DEPLOY GUARD] ✅ Core files verified. index.html size: ${stats.size} bytes.`);
console.log('[DEPLOY GUARD] 🚀 System integrity confirmed. Releasing lock for Netlify deployment.\n');
process.exit(0);
