import * as E from 'fp-ts/lib/Either';
import { CustomError, customErrorFactory } from 'ts-custom-error';

export class BaseError extends CustomError {
  public readonly payload: any;
  // TODO: find a way to put in custom payload in these errors!
  constructor(message?: string, payload?: any) {
    super(message);
    this.payload = payload;
  }
}

const fromError = (message?: string) => (error: Error) => {
  const baseError = new BaseError(message);
  baseError.stack = error.stack;
  return baseError;
};

export const toBaseError = (message?: string) => (from: unknown): BaseError => {
  if (from instanceof BaseError) {
    return from;
  } else if (from instanceof Error) {
    return fromError(message)(from);
  } else {
    return new BaseError(message, from);
  }
};
