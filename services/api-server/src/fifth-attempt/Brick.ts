import { GraphQLNonNull, GraphQLNullableType, GraphQLType } from 'graphql';
import * as t from 'io-ts';

export type Codec<A, O = A, I = unknown> = t.Type<A, O, I>;

export type Kind =
  | 'scalar'
  | 'outputobject'
  | 'interface'
  | 'union'
  | 'enum'
  | 'inputobject'
  | 'outputlist'
  | 'inputlist';

export interface SemiBrick<
  K extends Kind,
  SB_G extends GraphQLNullableType,
  SB_A, // TODO: make sure this cant be null or undefined
  SB_O = SB_A // TODO: make sure this cant be null or undefined
> {
  readonly name: string;
  readonly semiCodec: Codec<SB_A, SB_O>;
  readonly semiGraphQLType: SB_G;
  readonly kind: K;

  readonly nullable: Brick<
    K,
    SB_G,
    SemiBrick<K, SB_G, SB_A, SB_O>,
    SB_A | null | undefined,
    SB_O | null | undefined
  >;
  readonly nonNullable: Brick<
    K,
    GraphQLNonNull<any>,
    SemiBrick<K, SB_G, SB_A, SB_O>,
    SB_A,
    SB_O
  >;
}

export type AnySemiBrick<K extends Kind = any> = SemiBrick<K, any, any, any>;
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
export type SemiTypeOf<SB extends AnySemiBrick> = SB['semiCodec']['_A'];
export type SemiOutputTypeOf<SB extends AnySemiBrick> = SB['semiCodec']['_O'];
export type SemiGraphQLTypeOf<SB extends AnySemiBrick> = SB['semiGraphQLType'];
export type TypeOf<B extends AnyBrick> = B['codec']['_A'];
export type OutputTypeOf<B extends AnyBrick> = B['codec']['_O'];
export type GraphQLTypeOf<B extends AnyBrick> = B['graphQLType'];

export type NullableBrickOf<SB extends AnySemiBrick> = Brick<
  KindOf<SB>,
  SemiGraphQLTypeOf<SB>,
  SB,
  SemiTypeOf<SB> | null | undefined,
  SemiOutputTypeOf<SB> | null | undefined
>;

export type NonNullableBrickOf<SB extends AnySemiBrick> = Brick<
  KindOf<SB>,
  GraphQLNonNull<any>,
  SB,
  SemiTypeOf<SB>,
  SemiOutputTypeOf<SB>
>;

export class Brick<
  K extends Kind,
  B_G extends GraphQLType,
  SB extends AnySemiBrick<K>,
  B_A,
  B_O = B_A
> {
  public readonly name: string;
  public readonly kind: K;
  public readonly codec: Codec<B_A, B_O>;
  public readonly graphQLType: B_G;
  public readonly semiBrick: SB;

  constructor(params: {
    name: string;
    kind: K;
    codec: Codec<B_A, B_O>;
    graphQLType: B_G;
    semiBrick: SB;
  }) {
    this.name = params.name;
    this.kind = params.kind;
    this.codec = params.codec;
    this.graphQLType = params.graphQLType;
    this.semiBrick = params.semiBrick;
  }

  static initNullable<SB extends AnySemiBrick>(sb: SB): NullableBrickOf<SB> {
    return new Brick({
      name: sb.name,
      kind: sb.kind,
      codec: t.union([sb.semiCodec, t.null, t.undefined]),
      graphQLType: sb.semiGraphQLType,
      semiBrick: sb,
    });
  }

  static initNonNullable<SB extends AnySemiBrick>(
    sb: SB,
  ): NonNullableBrickOf<SB> {
    return new Brick({
      name: sb.name,
      codec: sb.semiCodec,
      graphQLType: new GraphQLNonNull(sb.semiGraphQLType),
      kind: sb.kind,
      semiBrick: sb,
    });
  }
}
