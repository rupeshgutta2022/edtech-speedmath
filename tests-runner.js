/**
 * Zero-dependency native Node test runner for SpeedMath Pro
 */
const { spawn } = require('child_process');

console.log('================ Running SpeedMath Unit Tests ================\n');

const child = spawn(process.execPath, ['--test', 'test/*.test.js'], {
  cwd: __dirname,
  stdio: 'inherit'
});

child.on('exit', (code) => {
  if (code === 0) {
    console.log('\n========================================');
    console.log('All SpeedMath tests passed successfully!');
    console.log('========================================\n');
    process.exit(0);
  } else {
    console.error('\nTests failed with exit code', code);
    process.exit(code);
  }
});
