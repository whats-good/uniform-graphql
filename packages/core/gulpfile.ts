import { series } from 'gulp';
import execa from 'execa';

export async function clean(): Promise<void> {
  await execa('rm', ['-rf', './build'], {
    cwd: __dirname,
  });
}

export async function quickBuild(): Promise<void> {
  await execa('npm', ['run', 'rebuild'], {
    cwd: __dirname,
  });
}

export const build = series(clean, quickBuild);
