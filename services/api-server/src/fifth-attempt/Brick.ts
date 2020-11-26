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
  SB_A,
  SB_O = SB_A
> {
  readonly name: string;
  readonly semiCodec: Codec<SB_A, SB_O>;
  readonly semiGraphQLType: SB_G;
  readonly kind: K;

  nullable(): Brick<
    K,
    SB_G,
    SemiBrick<K, SB_G, SB_A, SB_O>,
    SB_A | null | undefined,
    SB_O | null | undefined
  >;

  nonNullable(): Brick<
    K,
    GraphQLNonNull<any>,
    SemiBrick<K, SB_G, SB_A, SB_O>,
    SB_A,
    SB_O
  >;
}

export type AnySemiBrick<K extends Kind = any> = SemiBrick<K, any, any, any>;
export type SemiTypeOf<SB extends AnySemiBrick> = SB['semiCodec']['_A'];
export type SemiOutputTypeOf<SB extends AnySemiBrick> = SB['semiCodec']['_O'];
export type SemiGraphQLTypeOf<SB extends AnySemiBrick> = SB['semiGraphQLType'];
export type KindOf<SB extends AnySemiBrick> = SB['kind'];

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
}
