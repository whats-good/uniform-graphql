import { taskEitherSeq } from 'fp-ts/lib/TaskEither';
import {
  GraphQLNonNull,
  GraphQLNullableType,
  GraphQLScalarType,
  GraphQLType,
} from 'graphql';
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

interface AbstractBrick<
  SB_A,
  SB_O,
  SB_G extends GraphQLNullableType,
  K extends Kind
> {
  readonly name: string;
  readonly semiCodec: Codec<SB_A, SB_O>;
  readonly semiGraphQLType: SB_G;
  readonly kind: K;
}

interface SemiBrick<
  SB_A,
  SB_O,
  SB_G extends GraphQLNullableType,
  K extends Kind
> extends AbstractBrick<SB_A, SB_O, SB_G, K> {
  nullable(): Brick<any, any, any, K, SemiBrick<SB_A, SB_O, SB_G, K>>;
}

class Brick<
  B_A,
  B_O,
  B_G extends GraphQLType,
  K extends Kind,
  SB extends SemiBrick<any, any, any, K>
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

  nullable(): Brick<
    SB_A | null | undefined,
    SB_O | null | undefined,
    GraphQLScalarType,
    'scalar',
    ScalarSemiBrick<SB_A, SB_O, SB_G>
  > {
    return new Brick({
      name: this.name,
      codec: t.union([t.null, t.undefined, this.semiCodec]),
      graphQLType: this.semiGraphQLType,
      kind: this.kind,
      semiBrick: this,
    });
  }

  nonNullable(): Brick<
    SB_A,
    SB_O,
    GraphQLNonNull<any>,
    'scalar',
    ScalarSemiBrick<SB_A, SB_O, SB_G>
  > {
    return new Brick({
      name: this.name,
      codec: this.semiCodec,
      graphQLType: new GraphQLNonNull(this.semiGraphQLType),
      kind: this.kind,
      semiBrick: this,
    });
  }
}
