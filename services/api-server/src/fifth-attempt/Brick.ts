import {
  GraphQLID,
  GraphQLNonNull,
  GraphQLNullableType,
  GraphQLScalarType,
  GraphQLType,
} from 'graphql';
import * as t from 'io-ts';

export type Codec<A, O> = t.Type<A, O, unknown>;

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
  SB_A,
  SB_O,
  SB_G extends GraphQLNullableType,
  K extends Kind
> {
  readonly name: string;
  readonly semiCodec: Codec<SB_A, SB_O>;
  readonly semiGraphQLType: SB_G;
  readonly kind: K;
  nullable(): Brick<
    SB_A | null | undefined,
    SB_O | null | undefined,
    SB_G,
    K,
    SemiBrick<SB_A, SB_O, SB_G, K>
  >;
  nonNullable(): Brick<
    SB_A,
    SB_O,
    GraphQLNonNull<any>,
    K,
    SemiBrick<SB_A, SB_O, SB_G, K>
  >;
}

export type AnySemiBrick<K extends Kind = any> = SemiBrick<any, any, any, K>;
export type SemiTypeOf<SB extends AnySemiBrick> = SB['semiCodec']['_A'];
export type SemiOutputTypeOf<SB extends AnySemiBrick> = SB['semiCodec']['_O'];
export type SemiGraphQLTypeOf<SB extends AnySemiBrick> = SB['semiGraphQLType'];
export type KindOf<SB extends AnySemiBrick> = SB['kind'];

export class Brick<
  B_A,
  B_O,
  B_G extends GraphQLType,
  K extends Kind,
  SB extends AnySemiBrick<K>
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
