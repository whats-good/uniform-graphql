import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLNullableType,
  GraphQLObjectType,
  GraphQLString,
  GraphQLType,
  LoneSchemaDefinitionRule,
} from 'graphql';
import * as t from 'io-ts';

type Codec<A, O> = t.Type<A, O, unknown>;

class SemiBrick<A, O, G extends GraphQLNullableType> {
  public readonly name: string;
  public readonly semiGraphQLType: G;
  public readonly semiCodec: Codec<A, O>;

  constructor(params: {
    name: string;
    semiGraphQLType: G;
    semiCodec: Codec<A, O>;
  }) {
    this.name = params.name;
    this.semiGraphQLType = params.semiGraphQLType;
    this.semiCodec = params.semiCodec;
  }
}

class Brick<
  S_A,
  S_O,
  S_G extends GraphQLNullableType,
  B_A,
  B_O,
  B_G extends GraphQLType
> extends SemiBrick<S_A, S_O, S_G> {
  public readonly graphQLType: B_G;
  public readonly codec: Codec<B_A, B_O>;

  constructor(params: {
    name: string;
    semiGraphQLType: S_G;
    semiCodec: Codec<S_A, S_O>;
    graphQLType: B_G;
    codec: Codec<B_A, B_O>;
  }) {
    super(params);
    this.graphQLType = params.graphQLType;
    this.codec = params.codec;
  }

  private static fromNullableSemiBrick = <
    S_A,
    S_O,
    S_G extends GraphQLNullableType
  >(
    sb: SemiBrick<S_A, S_O, S_G>,
  ) => {
    return new Brick({
      ...sb,
      codec: t.union([sb.semiCodec, t.undefined, t.null]),
      graphQLType: sb.semiGraphQLType,
    });
  };

  private static fromNonNullableSemiBrick = <
    S_A,
    S_O,
    S_G extends GraphQLNullableType
  >(
    sb: SemiBrick<S_A, S_O, S_G>,
  ) => {
    return new Brick({
      ...sb,
      codec: sb.semiCodec,
      graphQLType: new GraphQLNonNull(sb.semiGraphQLType),
    });
  };

  public static lift = <S_A, S_O, S_G extends GraphQLNullableType>(
    sb: SemiBrick<S_A, S_O, S_G>,
  ) => {
    return {
      ...Brick.fromNonNullableSemiBrick(sb),
      nullable: Brick.fromNullableSemiBrick(sb),
    };
  };
}

const id = new SemiBrick({
  name: 'ID',
  semiCodec: t.union([t.string, t.number]),
  semiGraphQLType: GraphQLID,
});

const string = new SemiBrick({
  name: 'String' as const,
  semiCodec: t.string,
  semiGraphQLType: GraphQLString,
});

const float = new SemiBrick({
  name: 'Float' as const,
  semiCodec: t.number,
  semiGraphQLType: GraphQLFloat,
});

const int = new SemiBrick({
  name: 'Int' as const,
  semiCodec: t.Int,
  semiGraphQLType: GraphQLInt,
});

const boolean = new SemiBrick({
  name: 'Boolean' as const,
  semiCodec: t.boolean,
  semiGraphQLType: GraphQLBoolean,
});

const scalars = {
  id: Brick.lift(id),
  string: Brick.lift(string),
  float: Brick.lift(float),
  int: Brick.lift(int),
  boolean: Brick.lift(boolean),
};
