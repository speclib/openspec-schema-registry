import { runValidate } from './validate-cli.js';

process.exitCode = runValidate(process.argv.slice(2), (line) => {
  process.stdout.write(`${line}\n`);
});
