import { series } from 'gulp';
import execa from 'execa';

export async function clean(): Promise<void> {
  // await execa('rm', ['-rf']);
  await execa('gatsby', ['clean']);
}

export async function quickBuild(): Promise<void> {
  await execa('gatsby', ['build']);
}

export const build = series(clean, quickBuild);
