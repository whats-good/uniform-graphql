import execa from 'execa';
import { series } from 'gulp';
import * as websiteTasks from './docs-src/gulpfile';
import * as coreTasks from './packages/core/gulpfile';

// Propagates readme down into the core package
export async function readme(): Promise<void> {
  await execa('cp', ['./README.md', './packages/core/README.md']);
}

// Propagates the documentation from the packages/website directory into the /docs directory
export async function docs(): Promise<void> {
  await execa('rm', ['-rf', './docs']);
  await execa('cp', ['-a', './docs-src/public', './docs']);
  await execa('cp', ['./CNAME', './docs/CNAME']);
}

export const prepublish = series(
  readme,
  coreTasks.build,
  websiteTasks.build,
  docs,
);
