const {npath} = require('@yarnpkg/fslib');
const cp = require('child_process');

/**
 * @param {string} command
 * @param {string[]|undefined} args
 * @param {import('@yarnpkg/fslib').PortablePath} cwd
 * @returns {Promise<void>}
 */
exports.exec = function exec(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = cp.spawn(command, args, {
      cwd: npath.fromPortablePath(cwd),
      stdio: ['ignore', 'inherit', 'inherit'],
    });

    child.addListener('error', reject);
    child.addListener('close', code => {
      if (code) {
        reject(new Error(`Child exited with code ${code}`));
      } else {
        resolve();
      }
    });
  });
};

/**
 * @param {string} command
 * @param {string[]|undefined} args
 * @param {import('@yarnpkg/fslib').PortablePath} cwd
 * @returns {Promise<string>}
 */
exports.pipe = function pipe(command, args, cwd) {
  return new Promise((resolve, reject) => {
    /** @type {Buffer[]} */
    const output = [];

    const child = cp.spawn(command, args, {
      cwd: npath.fromPortablePath(cwd),
      stdio: ['ignore', 'pipe', 'inherit'],
    });

    child.stdout.on('data', buff => output.push(buff));

    child.addListener('error', reject);
    child.addListener('close', code => {
      if (code) {
        reject(new Error(`Child exited with code ${code}`));
      } else {
        resolve(Buffer.concat(output).toString('utf8'));
      }
    });
  });
};
