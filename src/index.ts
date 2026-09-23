export { loadRegistry, readRegistryDocument, RegistryLoadError } from './core/registry.js';
export { validateRegistry, defaultSchemaPath } from './core/validate.js';
export { formatProblems } from './core/problem.js';
export { compareAgainstUpstream, formatDrift, isRealDrift } from './core/drift.js';
export { parseUpstreamSchema, UpstreamSchemaError } from './core/schema-yaml.js';
export type { Registry, RegistryEntry } from './core/registry.js';
export type { Problem } from './core/problem.js';
export type { Drift, DriftClass } from './core/drift.js';
export type { UpstreamSchema } from './core/schema-yaml.js';
