import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLString,
  GraphQLType,
  ValueNode,
} from 'graphql';
import { Type } from '../Type';

import { ApolloServer } from 'apollo-server-express';
import express from 'express';

export class TypeContext {
  __k?: string;
}

export abstract class SemiType<N extends string, T, R = T> {
  public readonly name: N;
  public readonly _T!: T;
  public readonly _R!: R;

  public constructor(params: { name: N }) {
    this.name = params.name;
  }

  public abstract getSemiGraphQLType(typeContext: TypeContext): GraphQLType;
}

export type Maybe<T> = T | null | undefined;

type ScalarSerializer<TInternal> = (value: TInternal) => Maybe<JSON>;
type ScalarValueParser<TInternal> = (value: unknown) => Maybe<TInternal>;
type ScalarLiteralParser<TInternal> = (
  valueNode: ValueNode,
  variables: Maybe<{ [key: string]: any }>,
) => Maybe<TInternal>;

// serialize: GraphQLScalarSerializer<any>;
// parseValue: GraphQLScalarValueParser<any>;
// parseLiteral: GraphQLScalarLiteralParser<any>;

interface IScalarSemiTypeConstructor<N extends string, T> {
  name: N;
  description?: Maybe<string>;
  specifiedByUrl?: Maybe<string>;
  serialize: ScalarSemiType<N, T>['serializer'];
  parseValue: ScalarSemiType<N, T>['valueParser'];
  parseLiteral: ScalarSemiType<N, T>['literalParser'];
}

export class ScalarSemiType<N extends string, T> extends SemiType<N, T, T> {
  public readonly description?: Maybe<string>;
  public readonly specifiedByUrl?: Maybe<string>;

  private readonly serializer: ScalarSerializer<T>;
  private readonly valueParser: ScalarValueParser<T>;
  private readonly literalParser: ScalarLiteralParser<T>;

  constructor(params: IScalarSemiTypeConstructor<N, T>) {
    super(params);
    this.description = params.description;
    this.specifiedByUrl = params.specifiedByUrl;
    this.serializer = params.serialize;
    this.valueParser = params.parseValue;
    this.literalParser = params.parseLiteral;
  }

  getSemiGraphQLType = (): GraphQLScalarType => {
    return new GraphQLScalarType({
      name: this.name,
      description: this.description,
      specifiedByUrl: this.specifiedByUrl,
      serialize: this.serializer,
      parseValue: this.valueParser,
      parseLiteral: this.literalParser,
    });
  };
}

export const string = new ScalarSemiType<'String', string>({
  name: 'String',
  parseLiteral: GraphQLString.parseLiteral,
  parseValue: GraphQLString.parseValue,
  serialize: GraphQLString.serialize,
  description: GraphQLString.description,
  specifiedByUrl: GraphQLString.specifiedByUrl,
});

export const int = new ScalarSemiType<'Int', number>({
  name: 'Int',
  parseLiteral: GraphQLInt.parseLiteral,
  parseValue: GraphQLInt.parseValue,
  serialize: GraphQLInt.serialize,
  description: GraphQLInt.description,
  specifiedByUrl: GraphQLInt.specifiedByUrl,
});

export const boolean = new ScalarSemiType<'Boolean', boolean>({
  name: 'Boolean',
  parseLiteral: GraphQLBoolean.parseLiteral,
  parseValue: GraphQLBoolean.parseValue,
  serialize: GraphQLBoolean.serialize,
  description: GraphQLBoolean.description,
  specifiedByUrl: GraphQLBoolean.specifiedByUrl,
});

export const float = new ScalarSemiType<'Float', number>({
  name: 'Float',
  parseLiteral: GraphQLFloat.parseLiteral,
  parseValue: GraphQLFloat.parseValue,
  serialize: GraphQLFloat.serialize,
  description: GraphQLFloat.description,
  specifiedByUrl: GraphQLFloat.specifiedByUrl,
});

export const id = new ScalarSemiType<'ID', number>({
  name: 'ID',
  parseLiteral: GraphQLID.parseLiteral,
  parseValue: GraphQLID.parseValue,
  serialize: GraphQLID.serialize,
  description: GraphQLID.description,
  specifiedByUrl: GraphQLID.specifiedByUrl,
});

const typeContext = new TypeContext();

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'RootQuery',
    fields: {
      id: {
        type: id.getSemiGraphQLType(),
      },
    },
  }),
});

const apolloServer = new ApolloServer({
  schema,
});

const PORT = 4001;

const start = () => {
  const app = express();
  apolloServer.applyMiddleware({ app });
  app.listen({ port: PORT }, () => {
    console.log(
      `🚀 Server ready at http://localhost:${PORT}${apolloServer.graphqlPath}`,
    );
  });
};

start();
