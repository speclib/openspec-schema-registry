import { runAssembleSite } from './assemble-site-cli.js';

process.exitCode = runAssembleSite(process.argv.slice(2), (line) => {
  process.stdout.write(`${line}\n`);
});
