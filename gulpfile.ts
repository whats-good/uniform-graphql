import execa from 'execa';
import { series } from 'gulp';
import * as websiteTasks from './packages/website/gulpfile';

// Propagates readme down into the core package
export async function readme(): Promise<void> {
  await execa('cp', ['./README.md', './packages/core/README.md']);
}

export async function docs(): Promise<void> {
  await execa('rm', ['-rf', './docs']);
  await execa('cp', ['-a', './packages/website/public', './docs']);
}

export const publish = series(readme, websiteTasks.build, docs);
