// // type InnerGenericType<T> = T extends SemiBrick<infer A, infer O, infer G>

// // type Wrapped<T, I extends string> = { [K in keyof T]: { [key in I]: T[K] } };
// interface MyGenericClass<T> {
//   someField: T;
//   someOtherField: Promise<T>;
// }

// type InnerGenericType<T> = T extends MyGenericClass<infer U> ? U : never;

// type Foo<T> = T extends { a: infer U; b: infer U } ? U : never;
// type T10 = Foo<{ a: string; b: string }>; // string
// type T11 = Foo<{ a: string; b: number }>; // string | number

// type MyMappedType<T> = {
//   [P in keyof T]: T[P] extends SemiBrick<infer A, infer O, infer G>
//     ? SemiBrick<A, O, G>
//     : never;
// };

// type MyBetterType = MyMappedType<typeof core>;

// const betterCore: MyBetterType = core;

// const yo = pipe(core, (cur) => {
//   type N = typeof nullable;
//   type SemiBrickMapped<T> = {
//     [P in keyof T]: T[P] extends SemiBrick<infer A, infer B, infer C>
//       ? ReturnType<typeof nullable>
//       : never;
//   };
//   return cur as SemiBrickMapped;
// });

// interface UnionableBrick<A, O, G extends GraphqlType>
//   extends AbstractBrick<A, O, G, 'pending', 'struct'> {}

// interface AnyUnionableBrick extends UnionableBrick<any, any, any> {}
// export interface UnionC<
//   CS extends [AnyUnionableBrick, AnyUnionableBrick, ...Array<AnyUnionableBrick>]
// > extends SemiBrick<
//     SemiBrick<CS[number], any, any, any>,
//     OutputOf<CS[number]>,
//     any,
//     'union'
//   > {}
// export declare const union: <CS extends [
//   AnyUnionableBrick,
//   AnyUnionableBrick,
//   // AnyUnionableBrick[],
// ]>(
//   codecs: CS,
//   name?: string,
// ) => UnionC<CS>;

// const d = union([person, animal]);
// type A2 = OutputOf<typeof person>;

// interface AnyOutputFieldConfig<
//   SB extends OutputObjectSemiBrick<any, any, any>,
//   K extends keyof SB['bricks']
// > extends OutputFieldConfig<SB, K, any> {}

// type ARGSOF<T extends InputProps> = {
//   [P in keyof T]: T[P]['B_A'];
// };

// type FieldResolveFn<
//   SB extends OutputObjectSemiBrick<any, any, any>,
//   K extends keyof SB['bricks'],
//   I extends InputProps
// > = (
//   root: SB['S_A'],
//   args: ARGSOF<I>,
//   context: any,
// ) => SB['bricks'][K]['B_A'] | Promise<SB['bricks'][K]['B_A']>;

// class SemiOutputFieldConfig<
//   SB extends OutputObjectSemiBrick<any, any, any>,
//   K extends keyof SB['bricks']
// > {
//   public readonly root: SB;
//   public readonly key: K;
//   public readonly fieldBrick: SB['bricks'][K];

//   constructor(params: { root: SB; key: K; resolvedBrick: SB['bricks'][K] }) {
//     this.root = params.root;
//     this.key = params.key;
//     this.fieldBrick = params.resolvedBrick;
//   }
// }

// class OutputFieldConfig<
//   SB extends OutputObjectSemiBrick<any, any, any>,
//   K extends keyof SB['bricks'],
//   I extends InputProps
// > extends SemiOutputFieldConfig<SB, K> {
//   public readonly args: I;
//   public readonly resolve: FieldResolveFn<SB, K, I>;

//   constructor(params: {
//     root: SB;
//     key: K;
//     args: I;
//     resolve: FieldResolveFn<SB, K, I>;
//   }) {
//     super({
//       key: params.key,
//       resolvedBrick: params.root.bricks[params.key],
//       root: params.root,
//     });
//     this.args = params.args;
//     this.resolve = params.resolve;
//   }

//   public static initFromSemiConfig = <
//     SC extends SemiOutputFieldConfig<any, any>
//   >(
//     sc: SC,
//   ) => <I extends InputProps>(
//     args: I,
//     resolve: FieldResolveFn<SC['root'], SC['key'], I>,
//   ) => {
//     return new OutputFieldConfig({
//       args,
//       key: sc.key,
//       resolve,
//       root: <SC['root']>sc.root,
//     });
//   };

//   getFieldConfig = () => {
//     return {
//       type: this.fieldBrick.graphQLType,
//       args: _.mapValues(this.args, (arg) => ({
//         type: arg.graphQLType,
//       })),
//       resolve: this.resolve,
//     };
//   };
// }

// class SemiOutputFieldConfigsMap<
//   SB extends OutputObjectSemiBrick<any, any, any>,
//   F
// > {
//   public readonly root: SB;
//   public readonly fields: F;

//   constructor(params: { root: SB; fields: F }) {
//     this.root = params.root;
//     this.fields = params.fields;
//   }
// }

// interface SemiOutputFieldConfigsMapOf<
//   SB extends OutputObjectSemiBrick<any, any, any>
// > extends SemiOutputFieldConfigsMap<
//     SB,
//     {
//       [K in keyof SB['bricks']]: SemiOutputFieldConfig<SB, K>;
//     }
//   > {}

// const semiConfigs = <SB extends OutputObjectSemiBrick<any, any, any>>(
//   root: SB,
// ): SemiOutputFieldConfigsMapOf<SB> => {
//   type Fields = SemiOutputFieldConfigsMapOf<SB>['fields'];
//   const mapped = _.mapValues(root.bricks, (resolvedBrick, key) => {
//     return new SemiOutputFieldConfig({
//       root,
//       key,
//       resolvedBrick,
//     });
//   });
//   return new SemiOutputFieldConfigsMap({
//     root,
//     fields: mapped as Fields, // TODO: is there a way out of doing this fields AS?
//   });
// };

// const s = semiConfigs(personobject);
// const d = s.fields.firstName.fieldBrick.codec.encode('abc');
// const a = s.fields.firstName.key;
