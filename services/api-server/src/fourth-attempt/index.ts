import {
  GraphQLID,
  GraphQLNonNull,
  GraphQLNullableType,
  GraphQLObjectType,
  GraphQLString,
  GraphQLType,
} from 'graphql';
import * as t from 'io-ts';

type Codec<A> = t.Type<A, A, unknown>;

class SemiBrick<A, G extends GraphQLNullableType> {
  public readonly name: string;
  public readonly semiGraphQLType: G;
  public readonly semiCodec: Codec<A>;

  constructor(params: {
    name: string;
    semiGraphQLType: G;
    semiCodec: Codec<A>;
  }) {
    this.name = params.name;
    this.semiGraphQLType = params.semiGraphQLType;
    this.semiCodec = params.semiCodec;
  }
}

class Brick<
  S_A,
  S_G extends GraphQLNullableType,
  B_A,
  B_G extends GraphQLType
> extends SemiBrick<S_A, S_G> {
  public readonly graphQLType: B_G;
  public readonly codec: Codec<B_A>;

  constructor(params: {
    name: string;
    semiGraphQLType: S_G;
    semiCodec: Codec<S_A>;
    graphQLType: B_G;
    codec: Codec<B_A>;
  }) {
    super(params);
    this.graphQLType = params.graphQLType;
    this.codec = params.codec;
  }

  static fromNullableSemiBrick = <A, G extends GraphQLNullableType>(
    sb: SemiBrick<A, G>,
  ) => {
    return new Brick({
      ...sb,
      codec: t.union([sb.semiCodec, t.undefined, t.null]),
      graphQLType: sb.semiGraphQLType,
    });
  };

  static fromNonNullableSemiBrick = <S, G extends GraphQLNullableType>(
    sb: SemiBrick<S, G>,
  ) => {
    return new Brick({
      ...sb,
      codec: sb.semiCodec,
      graphQLType: new GraphQLNonNull(sb.semiGraphQLType),
    });
  };
}

const id = new SemiBrick({
  name: 'ID',
  semiCodec: t.union([t.string, t.number]),
  semiGraphQLType: GraphQLID,
});
