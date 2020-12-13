import { GraphQLNonNull, GraphQLNullableType, GraphQLType } from 'graphql';
import { SemiStaticGraphQLTypeFactory } from './SemiStaticGraphQLTypeFactory';

export type Kind =
  | 'scalar'
  | 'outputobject'
  | 'interface'
  | 'union'
  | 'enum'
  | 'inputobject'
  | 'outputlist'
  | 'inputlist';

export abstract class SemiStaticGraphQLType<
  K extends Kind,
  N extends string,
  SB_G extends GraphQLNullableType,
  // TODO: make sure this cant be null or undefined
  SB_A,
  SB_R = SB_A
> {
  SB_G!: SB_G; // the semi-graphql type
  SB_A!: SB_A; // the actual static type
  SB_R!: SB_R; // the resolve type. It will be almost always equal to the static type, but not always.
  readonly name: N;
  readonly semiStaticGraphQLTypeFactory: SemiStaticGraphQLTypeFactory;
  abstract kind: K;
  abstract getFreshSemiGraphQLType(): SB_G;

  abstract readonly nullable: NullableStaticGraphQLTypeOf<
    SemiStaticGraphQLType<K, N, SB_G, SB_A>
  >;
  abstract readonly nonNullable: NonNullableStaticGraphQLTypeOf<
    SemiStaticGraphQLType<K, N, SB_G, SB_A>
  >;
  // TODO: find a way for this "resolveAs" method to handle promises and thunks

  // public resolveAs = async (x: SB_A) => {
  //   const resolvedX = await x;
  //   return {
  //     ...resolvedX,
  //     __typename: this.name,
  //   };
  // };

  public getSemiGraphQLType = (): SB_G => {
    return this.semiStaticGraphQLTypeFactory.getSemiGraphQLTypeOf(
      this,
      this.getFreshSemiGraphQLType,
    );
  };

  constructor(params: {
    name: N;
    semiStaticGraphQLTypeFactory: SemiStaticGraphQLTypeFactory;
  }) {
    this.name = params.name;
    this.semiStaticGraphQLTypeFactory = params.semiStaticGraphQLTypeFactory;
  }
}

export type AnySemiStaticGraphQLType<
  K extends Kind = any
> = SemiStaticGraphQLType<K, any, any, any>;
export type AnyStaticGraphQLType<K extends Kind = any> = StaticGraphQLType<
  K,
  any,
  any,
  AnySemiStaticGraphQLType<K>,
  any,
  any
>;
interface Kinded {
  kind: Kind;
}
interface Named {
  name: string;
}
export type NameOf<T extends Named> = T['name'];
export type KindOf<T extends Kinded> = T['kind'];
export type SemiTypeOf<SB extends AnySemiStaticGraphQLType> = SB['SB_A'];
export type SemiGraphQLTypeOf<SB extends AnySemiStaticGraphQLType> = ReturnType<
  SB['getSemiGraphQLType']
>;
export type TypeOf<B extends AnyStaticGraphQLType> = B['B_A'];
export type GraphQLTypeOf<B extends AnyStaticGraphQLType> = B['B_G'];

export type NullableStaticGraphQLTypeOf<
  SB extends AnySemiStaticGraphQLType
> = StaticGraphQLType<
  KindOf<SB>,
  SB['name'],
  SemiGraphQLTypeOf<SB>,
  SB,
  SemiTypeOf<SB> | null | undefined,
  SB['SB_R'] | null | undefined
>;

export type NonNullableStaticGraphQLTypeOf<
  SB extends AnySemiStaticGraphQLType
> = StaticGraphQLType<
  KindOf<SB>,
  SB['name'],
  GraphQLNonNull<any>,
  SB,
  SemiTypeOf<SB>,
  SB['SB_R']
>;

export class StaticGraphQLType<
  K extends Kind,
  N extends SB['name'],
  B_G extends GraphQLType,
  SB extends AnySemiStaticGraphQLType<K>,
  B_A,
  B_R
> {
  B_A!: B_A;
  B_G!: B_G;
  B_R!: B_R;

  public readonly name: N;
  public readonly kind: K;
  public readonly semiStaticGraphQLType: SB;
  public readonly getGraphQLType: () => B_G;

  constructor(params: {
    name: SB['name'];
    kind: K;
    getGraphQLType: () => B_G;
    semiStaticGraphQLType: SB;
  }) {
    this.name = params.name;
    this.kind = params.kind;
    this.getGraphQLType = params.getGraphQLType;
    this.semiStaticGraphQLType = params.semiStaticGraphQLType;
  }

  static initNullable<SB extends AnySemiStaticGraphQLType>(
    sb: SB,
  ): NullableStaticGraphQLTypeOf<SB> {
    return new StaticGraphQLType({
      name: sb.name,
      kind: sb.kind,
      getGraphQLType: sb.getSemiGraphQLType,
      semiStaticGraphQLType: sb,
    });
  }

  static initNonNullable<SB extends AnySemiStaticGraphQLType>(
    sb: SB,
  ): NonNullableStaticGraphQLTypeOf<SB> {
    return new StaticGraphQLType({
      name: sb.name,
      getGraphQLType: () => new GraphQLNonNull(sb.getSemiGraphQLType()),
      kind: sb.kind,
      semiStaticGraphQLType: sb,
    });
  }
}
