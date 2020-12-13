import { GraphQLNonNull, GraphQLNullableType, GraphQLType } from 'graphql';
import { SemiTypeFactory } from './SemiTypeFactory';

export type Kind =
  | 'scalar'
  | 'outputobject'
  | 'interface'
  | 'union'
  | 'enum'
  | 'inputobject'
  | 'outputlist'
  | 'inputlist';

export abstract class SemiType<
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
  readonly SemiTypeFactory: SemiTypeFactory;
  abstract kind: K;
  abstract getFreshSemiGraphQLType(): SB_G;

  abstract readonly nullable: NullableTypeOf<SemiType<K, N, SB_G, SB_A>>;
  abstract readonly nonNullable: NonNullableTypeOf<SemiType<K, N, SB_G, SB_A>>;
  // TODO: find a way for this "resolveAs" method to handle promises and thunks

  // public resolveAs = async (x: SB_A) => {
  //   const resolvedX = await x;
  //   return {
  //     ...resolvedX,
  //     __typename: this.name,
  //   };
  // };

  public getSemiGraphQLType = (): SB_G => {
    return this.SemiTypeFactory.getSemiGraphQLTypeOf(
      this,
      this.getFreshSemiGraphQLType,
    );
  };

  constructor(params: { name: N; SemiTypeFactory: SemiTypeFactory }) {
    this.name = params.name;
    this.SemiTypeFactory = params.SemiTypeFactory;
  }
}

export type AnySemiType<K extends Kind = any> = SemiType<K, any, any, any>;
export type AnyType<K extends Kind = any> = Type<
  K,
  any,
  any,
  AnySemiType<K>,
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
export type SemiTypeOf<SB extends AnySemiType> = SB['SB_A'];
export type SemiGraphQLTypeOf<SB extends AnySemiType> = ReturnType<
  SB['getSemiGraphQLType']
>;
export type TypeOf<B extends AnyType> = B['B_A'];
export type GraphQLTypeOf<B extends AnyType> = B['B_G'];

export type NullableTypeOf<SB extends AnySemiType> = Type<
  KindOf<SB>,
  SB['name'],
  SemiGraphQLTypeOf<SB>,
  SB,
  SemiTypeOf<SB> | null | undefined,
  SB['SB_R'] | null | undefined
>;

export type NonNullableTypeOf<SB extends AnySemiType> = Type<
  KindOf<SB>,
  SB['name'],
  GraphQLNonNull<any>,
  SB,
  SemiTypeOf<SB>,
  SB['SB_R']
>;

export class Type<
  K extends Kind,
  N extends SB['name'],
  B_G extends GraphQLType,
  SB extends AnySemiType<K>,
  B_A,
  B_R
> {
  B_A!: B_A;
  B_G!: B_G;
  B_R!: B_R;

  public readonly name: N;
  public readonly kind: K;
  public readonly semiType: SB;
  public readonly getGraphQLType: () => B_G;

  constructor(params: {
    name: SB['name'];
    kind: K;
    getGraphQLType: () => B_G;
    semiType: SB;
  }) {
    this.name = params.name;
    this.kind = params.kind;
    this.getGraphQLType = params.getGraphQLType;
    this.semiType = params.semiType;
  }

  static initNullable<SB extends AnySemiType>(sb: SB): NullableTypeOf<SB> {
    return new Type({
      name: sb.name,
      kind: sb.kind,
      getGraphQLType: sb.getSemiGraphQLType,
      semiType: sb,
    });
  }

  static initNonNullable<SB extends AnySemiType>(
    sb: SB,
  ): NonNullableTypeOf<SB> {
    return new Type({
      name: sb.name,
      getGraphQLType: () => new GraphQLNonNull(sb.getSemiGraphQLType()),
      kind: sb.kind,
      semiType: sb,
    });
  }
}
