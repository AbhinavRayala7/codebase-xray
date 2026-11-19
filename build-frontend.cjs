const fs = require('fs');
const path = require('path');
const cp = require('child_process');

let targetDir = '.';
if (fs.existsSync('frontend/package.json')) {
  targetDir = 'frontend';
} else if (fs.existsSync('../frontend/package.json')) {
  targetDir = '../frontend';
}

console.log(`[Vercel Build] Building frontend in directory: ${targetDir}`);
cp.execSync('npm --prefix ' + targetDir + ' run build', {
  env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=4096' },
  stdio: 'inherit'
});

// Mirror dist to root if built in subdirectory
const subDist = path.resolve(targetDir, 'dist');
const rootDist = path.resolve('dist');
if (fs.existsSync(subDist) && subDist !== rootDist) {
  try {
    fs.cpSync(subDist, rootDist, { recursive: true });
    console.log(`[Vercel Build] Mirrored output to root /dist`);
  } catch (e) {}
}

console.log(`[Vercel Build] Build complete.`);
