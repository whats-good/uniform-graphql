import { GraphQLScalarType, GraphQLType } from 'graphql';
import * as t from 'io-ts';

type Codec<A, O> = t.Type<A, O, unknown>;

type Kind =
  | 'scalar'
  | 'outputobject'
  | 'interface'
  | 'union'
  | 'enum'
  | 'inputobject'
  | 'outputlist'
  | 'inputlist';

interface AbstractBrick<SB_A, SB_O, SB_G extends GraphQLType, K extends Kind> {
  readonly name: string;
  readonly semiCodec: Codec<SB_A, SB_O>;
  readonly semiGraphQLType: SB_G;
  readonly kind: K;
}

interface SemiBrick<SB_A, SB_O, SB_G extends GraphQLType, K extends Kind>
  extends AbstractBrick<SB_A, SB_O, SB_G, K> {
  // TODO: find a way to make a generic / abstract nullable version.
}

class Brick<
  SB_A,
  SB_O,
  SB_G extends GraphQLType,
  B_A,
  B_O,
  B_G extends GraphQLType,
  K extends Kind
> implements AbstractBrick<SB_A, SB_O, SB_G, K> {
  public readonly name: string;
  public readonly semiCodec: Codec<SB_A, SB_O>;
  public readonly semiGraphQLType: SB_G;
  public readonly kind: K;
  public readonly codec: Codec<B_A, B_O>;
  public readonly graphQLType: B_G;

  constructor(params: {
    name: string;
    semiCodec: Codec<SB_A, SB_O>;
    semiGraphQLType: SB_G;
    kind: K;
    codec: Codec<B_A, B_O>;
    graphQLType: B_G;
  }) {
    this.name = params.name;
    this.semiCodec = params.semiCodec;
    this.semiGraphQLType = params.semiGraphQLType;
    this.kind = params.kind;
    this.codec = params.codec;
    this.graphQLType = params.graphQLType;
  }
}

export class ScalarSemiBrick<SB_A, SB_O, SB_G extends GraphQLScalarType>
  implements SemiBrick<SB_A, SB_O, SB_G, 'scalar'> {
  public readonly name: string;
  public readonly semiCodec: Codec<SB_A, SB_O>;
  public readonly semiGraphQLType: SB_G;
  public readonly kind = 'scalar' as const;

  constructor(params: {
    name: string;
    semiCodec: Codec<SB_A, SB_O>;
    semiGraphQLType: SB_G;
  }) {
    this.name = params.name;
    this.semiCodec = params.semiCodec;
    this.semiGraphQLType = params.semiGraphQLType;
  }
}
