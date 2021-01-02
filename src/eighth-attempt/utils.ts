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

// type UnwrappedPromiseRecursive<T> = T extends PromiseLike<infer U>
//   ? UnwrappedPromiseRecursive<U>
//   : T;

/**
 * What can be returned:
 *
 * 1. The value directly
 * 2. A function that returns the value
 * 3. A promise that resolves to the value
 * 4. A function that returns a promise that resolves to the value
 * 5. A promise that resolves to a promise that resolves to the value (infinitely)
 * 6. A function that returns a promise that resolves to a promise that resolves to the value (infinitely)
 *
 * More specifically:
 *
 * 1. You can thunk only once, and only in the begining. Meaning, it's okay to return a function that
 * returns something that eventually resolves to whatever.
 *
 * 2. However, never a function that returns a function, or a promise that resolves to a function that
 * when called returns the value. We're only allowed to thunk in the begining, and that's it.
 *
 * 3. The thunkable value is an infinitely nestable "promisable" that eventually resolves to the desired
 * value.
 */

export type RecursivePromisable<T> =
  | T
  | Promise<T>
  | Promise<RecursivePromisable<T>>;

export type ThenArgRecursive<T> = T extends PromiseLike<infer U>
  ? { 0: ThenArgRecursive<U>; 1: U }[U extends PromiseLike<any> ? 0 : 1]
  : T;

export type Promisable<T> = T | Promise<T>;

interface Branded {
  __BRAND__: string;
}

type BrandOf<T extends Branded> = T['__BRAND__'];

export const brandOf = <T extends Branded>(t: T): BrandOf<T> => {
  return t.__BRAND__;
};
