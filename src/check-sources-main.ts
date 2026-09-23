import { runCheckSources } from './check-sources-cli.js';

process.exitCode = await runCheckSources(process.argv.slice(2));
