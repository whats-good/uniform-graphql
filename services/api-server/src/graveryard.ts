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
