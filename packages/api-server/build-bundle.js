const fs = require('fs');
const path = require('path');

// Bundle script to prepare Lambda function for deployment
const sourceDir = path.join(__dirname, 'dist');
const bundleDir = path.join(__dirname, '../../build-artifacts');

// Create bundle directory if it doesn't exist
if (!fs.existsSync(bundleDir)) {
  fs.mkdirSync(bundleDir, { recursive: true });
}

// Copy all compiled files to bundle
console.log('Bundling Lambda function...');

// Ensure dist directory exists
if (!fs.existsSync(sourceDir)) {
  console.warn('Dist directory does not exist yet. Skipping bundle.');
  process.exit(0);
}

// Copy dist contents
const files = fs.readdirSync(sourceDir);
files.forEach(file => {
  const src = path.join(sourceDir, file);
  const dest = path.join(bundleDir, file);
  
  if (fs.statSync(src).isDirectory()) {
    fs.cpSync(src, dest, { recursive: true });
  } else {
    fs.copyFileSync(src, dest);
  }
});

console.log('✓ Bundle created at:', bundleDir);
