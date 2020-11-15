import * as O from 'fp-ts/lib/Option';
import { StringType } from 'io-ts';

/* eslint @typescript-eslint/no-unused-vars: 0 */
/* eslint @typescript-eslint/no-explicit-any: 0 */
/* eslint @typescript-eslint/no-empty-interface: 0 */

type Properties = 'propA' | 'propB';
type MyMappedType<Props extends string | number | symbol> = {
  [P in Properties]: P;
};
type MyNewType = MyMappedType<'propA' | 'propB'>;

type MyOtherMappedType<T> = {
  [P in keyof T]: T[P];
};
enum SomeEnum {
  first = 'first',
  second = 'second',
  third = 'third',
}
type SomeBsType = { a: 'some literal'; b: string; c: SomeEnum };
type Ex2 = MyOtherMappedType<SomeBsType>;

type MyOptionMappedType<T> = {
  [P in keyof T]: O.Option<P>;
};
type Ex3 = MyOptionMappedType<SomeBsType>;

type Pick1<T, Properties extends keyof T> = {
  [P in Properties]: T[P];
};
type Ex4 = Pick1<SomeBsType, 'a'>;
type Ex5 = Pick1<SomeBsType, 'b' | 'c'>;

// Note: What's a "list" in code world, is a "union" in type world.

type Record1<K extends keyof any, T> = {
  [P in K]: T;
};
// Note: [P in K] is a great way to iterate over the potential keys of a given type, to enable us to map over it
const ex6: Record1<string, SomeEnum> = {
  firstKey: SomeEnum.first,
  someOtherKey: SomeEnum.third,
};
// Note: keyof any -> resolves to "string | number | symbol"
const ex7: Record1<number, SomeEnum> = {
  [1]: SomeEnum.first,
};
const ex8: Record1<SomeEnum, string> = {
  [SomeEnum.first]: 'here’s a string',
  [SomeEnum.second]: 'here’s another string',
  [SomeEnum.third]: 'here’s yet another string',
};
// Note: If you put an enum as the key of a secord, you need to make sure that all the enums are exhausted as keys

type Exclude1<T, U> = T extends U ? never : T;
type SomeListOfThings = 'literal a' | 'literal b' | 0 | boolean;
type Ex9 = Exclude1<SomeListOfThings, number>;
// TODO: find out why this exclusion doesnt work.
function divide(dividend: number, divisor: Exclude1<number, 0>) {
  return dividend / divisor;
}
const divEx1 = divide(10, 2);
const divEx2 = divide(10, 0 as const);

/**
 * Note: The difference between Records and
 * index signatures is what can be assigned as
 * a type to the key. Index signatures can only be "string | number | symbol"
 * whereas Records can have many union types as their keys.
 */

type Partial1<T> = {
  [P in keyof T]?: T[P];
};

type M1 = Partial1<{ kerem: string; kazan: number }>;
const exm1: M1 = {};

type PartialRecord<K extends keyof any, T> = Partial1<Record1<K, T>>;

const maybifiedExample1: PartialRecord<SomeEnum, string> = {
  [SomeEnum.first]: 'yo',
  [SomeEnum.second]: 'yo',
};

//

type Maybe<T> = null | undefined | T;
