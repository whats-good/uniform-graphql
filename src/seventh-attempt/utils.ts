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
