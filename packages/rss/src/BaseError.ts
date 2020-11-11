import * as E from 'fp-ts/lib/Either';

interface IBaseError extends Error {
  tag: string;
}

// TODO: see if there's a way to do this without mutation.
export const toBaseError = (tag: string) => (from: unknown): IBaseError => {
  // TODO: see if there are better ways to parse out the error
  const error = from instanceof Error ? from : E.toError(from);
  const baseError = error as IBaseError;
  if (!baseError.tag) {
    baseError.tag = tag;
  }
  return baseError;
};
