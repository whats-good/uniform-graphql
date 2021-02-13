import lodashMapValues from 'lodash/mapValues';
import lodashForEach from 'lodash/forEach';

// TODO: get rid of all lodash functions and use locally implemented util functions instead.

export const forEach = lodashForEach;
export const mapValues = lodashMapValues;

export type Maybe<T> = T | null | undefined;

export type Thunk<T> = () => T;
export type Thunkable<T> = T | Thunk<T>;
export type Unthunked<T extends Thunkable<any>> = T extends Thunk<any>
  ? ReturnType<T>
  : T;

export const unthunk = <T extends Thunkable<any>>(t: T): Unthunked<T> => {
  if (typeof t === 'function') {
    return t();
  } else {
    return t as any;
  }
};

export interface StringKeys<T> {
  [key: string]: T;
}

export type RecursivePromisable<T> =
  | T
  | Promise<T>
  | Promise<RecursivePromisable<T>>;

export type ThenArgRecursive<T> = T extends PromiseLike<infer U>
  ? { 0: ThenArgRecursive<U>; 1: U }[U extends PromiseLike<any> ? 0 : 1]
  : T;

export type Promisable<T> = T | Promise<T>;

interface Branded {
  __BRAND__?: string;
}

type BrandOf<T extends Branded> = T['__BRAND__'];

export const brandOf = <T extends Branded>(t: T): BrandOf<T> => {
  return t.__BRAND__;
};
