import execa from 'execa';

// Propagates readme down into the core package
export async function readme(): Promise<void> {
  await execa('cp', ['./README.md', './packages/core/README.md']);
}
