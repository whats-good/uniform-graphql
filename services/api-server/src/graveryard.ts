// type InnerGenericType<T> = T extends SemiBrick<infer A, infer O, infer G>

// type Wrapped<T, I extends string> = { [K in keyof T]: { [key in I]: T[K] } };
interface MyGenericClass<T> {
  someField: T;
  someOtherField: Promise<T>;
}

type InnerGenericType<T> = T extends MyGenericClass<infer U> ? U : never;

type Foo<T> = T extends { a: infer U; b: infer U } ? U : never;
type T10 = Foo<{ a: string; b: string }>; // string
type T11 = Foo<{ a: string; b: number }>; // string | number

type MyMappedType<T> = {
  [P in keyof T]: T[P] extends SemiBrick<infer A, infer O, infer G>
    ? SemiBrick<A, O, G>
    : never;
};

type MyBetterType = MyMappedType<typeof core>;

const betterCore: MyBetterType = core;

const yo = pipe(core, (cur) => {
  type N = typeof nullable;
  type SemiBrickMapped<T> = {
    [P in keyof T]: T[P] extends SemiBrick<infer A, infer B, infer C>
      ? ReturnType<typeof nullable>
      : never;
  };
  return cur as SemiBrickMapped;
});

interface UnionableBrick<A, O, G extends GraphqlType>
  extends AbstractBrick<A, O, G, 'pending', 'struct'> {}

interface AnyUnionableBrick extends UnionableBrick<any, any, any> {}
export interface UnionC<
  CS extends [AnyUnionableBrick, AnyUnionableBrick, ...Array<AnyUnionableBrick>]
> extends SemiBrick<
    SemiBrick<CS[number], any, any, any>,
    OutputOf<CS[number]>,
    any,
    'union'
  > {}
export declare const union: <CS extends [
  AnyUnionableBrick,
  AnyUnionableBrick,
  // AnyUnionableBrick[],
]>(
  codecs: CS,
  name?: string,
) => UnionC<CS>;

const d = union([person, animal]);
type A2 = OutputOf<typeof person>;
