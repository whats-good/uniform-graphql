import { GraphQLNonNull, GraphQLNullableType, GraphQLType } from 'graphql';
import { SemiBrickFactory } from './SemiBrickFactory';

export type Kind =
  | 'scalar'
  | 'outputobject'
  | 'interface' // TODO: make the resolvers return with the resolved brick or at least the brick name.
  | 'union' // TODO: make the resolvers return with the resolved brick or at least the brick name.
  | 'enum'
  | 'inputobject'
  | 'outputlist'
  | 'inputlist';

export abstract class SemiBrick<
  K extends Kind,
  SB_G extends GraphQLNullableType,
  // TODO: make sure this cant be null or undefined
  SB_A,
  SB_R = SB_A
> {
  SB_G!: SB_G; // the semi-graphql type
  SB_A!: SB_A; // the actual static type
  SB_R!: SB_R; // the resolve type. It will be almost always equal to the static type, but not always.
  readonly name: string;
  readonly semiBrickFactory: SemiBrickFactory;
  abstract kind: K;
  abstract getFreshSemiGraphQLType(): SB_G;

  abstract readonly nullable: NullableBrickOf<SemiBrick<K, SB_G, SB_A>>;
  abstract readonly nonNullable: NonNullableBrickOf<SemiBrick<K, SB_G, SB_A>>;
  // TODO: find a way for this "resolveAs" method to handle promises and thunks

  // public resolveAs = async (x: SB_A) => {
  //   const resolvedX = await x;
  //   return {
  //     ...resolvedX,
  //     __typename: this.name,
  //   };
  // };

  public getSemiGraphQLType = (): SB_G => {
    return this.semiBrickFactory.getSemiGraphQLTypeOf(
      this,
      this.getFreshSemiGraphQLType,
    );
  };

  constructor(params: { name: string; semiBrickFactory: SemiBrickFactory }) {
    this.name = params.name;
    this.semiBrickFactory = params.semiBrickFactory;
  }
}

export type AnySemiBrick<K extends Kind = any> = SemiBrick<K, any, any>;
export type AnyBrick<K extends Kind = any> = Brick<
  K,
  any,
  AnySemiBrick<K>,
  any,
  any
>;
interface Kinded {
  kind: Kind;
}
export type KindOf<T extends Kinded> = T['kind'];
export type SemiTypeOf<SB extends AnySemiBrick> = SB['SB_A'];
export type SemiGraphQLTypeOf<SB extends AnySemiBrick> = ReturnType<
  SB['getSemiGraphQLType']
>;
export type TypeOf<B extends AnyBrick> = B['B_A'];
export type GraphQLTypeOf<B extends AnyBrick> = B['B_G'];

export type NullableBrickOf<SB extends AnySemiBrick> = Brick<
  KindOf<SB>,
  SemiGraphQLTypeOf<SB>,
  SB,
  SemiTypeOf<SB> | null | undefined,
  SB['SB_R'] | null | undefined
>;

export type NonNullableBrickOf<SB extends AnySemiBrick> = Brick<
  KindOf<SB>,
  GraphQLNonNull<any>,
  SB,
  SemiTypeOf<SB>,
  SB['SB_R']
>;

export class Brick<
  K extends Kind,
  B_G extends GraphQLType,
  SB extends AnySemiBrick<K>,
  B_A,
  B_R
> {
  B_A!: B_A;
  B_G!: B_G;
  B_R!: B_R;

  public readonly name: string;
  public readonly kind: K;
  public readonly semiBrick: SB;
  public readonly getGraphQLType: () => B_G;

  constructor(params: {
    name: string;
    kind: K;
    getGraphQLType: () => B_G;
    semiBrick: SB;
  }) {
    this.name = params.name;
    this.kind = params.kind;
    this.getGraphQLType = params.getGraphQLType;
    this.semiBrick = params.semiBrick;
  }

  static initNullable<SB extends AnySemiBrick>(sb: SB): NullableBrickOf<SB> {
    return new Brick({
      name: sb.name,
      kind: sb.kind,
      getGraphQLType: sb.getSemiGraphQLType,
      semiBrick: sb,
    });
  }

  static initNonNullable<SB extends AnySemiBrick>(
    sb: SB,
  ): NonNullableBrickOf<SB> {
    return new Brick({
      name: sb.name,
      getGraphQLType: () => new GraphQLNonNull(sb.getSemiGraphQLType()),
      kind: sb.kind,
      semiBrick: sb,
    });
  }
}
