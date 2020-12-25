import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLString,
  GraphQLType,
  Kind,
  ValueNode,
} from 'graphql';

import { ApolloServer } from 'apollo-server-express';
import express from 'express';

export class TypeContext {
  public readonly savedSemiGraphQLTypes = new Map<string, GraphQLType>();
}

export abstract class SemiType<N extends string, T> {
  public readonly name: N;
  public readonly __T!: T;

  public constructor(params: { name: N }) {
    this.name = params.name;
  }

  // public abstract nullable(): Type<N, Maybe<T>, R>;
  // public abstract nonNullable(): Type<N, T, R>;

  protected abstract getFreshSemiGraphQLType(
    typeContext: TypeContext,
  ): GraphQLType;

  // TODO: handle recursive types to avoid infinite loops
  public getSemiGraphQLType(typeContext: TypeContext): GraphQLType {
    const existingType = typeContext.savedSemiGraphQLTypes.get(this.name);
    if (existingType) {
      return existingType;
    } else {
      const newType = this.getFreshSemiGraphQLType(typeContext);
      typeContext.savedSemiGraphQLTypes.set(this.name, newType);
      return newType;
    }
  }

  get nullable(): RealizedType<N, Maybe<T>> {
    return new RealizedType({
      name: this.name,
      nullable: true,
      semiType: this,
    });
  }

  get nonNullable(): RealizedType<N, T> {
    return new RealizedType({
      name: this.name,
      nullable: false,
      semiType: this,
    });
  }
}

type AnySemiType = SemiType<any, any>;
type AnyRealizedType = RealizedType<any, any>;
type NameOf<T> = T extends AnyRealizedType
  ? T['name']
  : T extends AnySemiType
  ? T['name']
  : never;
type TypeOf<T> = T extends AnyRealizedType
  ? T['__T']
  : T extends AnySemiType
  ? T['__T']
  : never;

class RealizedType<N extends string, T> {
  public readonly name: N;
  public readonly nullable: boolean;
  public readonly semiType: SemiType<N, any>;
  public readonly __T!: T;

  constructor(params: {
    name: N;
    nullable: boolean;
    semiType: SemiType<N, any>;
  }) {
    this.name = params.name;
    this.nullable = params.nullable;
    this.semiType = params.semiType;
  }

  public getGraphQLType(typeContext: TypeContext): GraphQLType {
    const semiGraphQLType = this.semiType.getSemiGraphQLType(typeContext);
    if (this.nullable) {
      return semiGraphQLType;
    } else {
      return new GraphQLNonNull(semiGraphQLType);
    }
  }
}

export type Maybe<T> = T | null | undefined;

type ScalarSerializer<TInternal> = (value: TInternal) => Maybe<any>;
type ScalarValueParser<TInternal> = (value: unknown) => Maybe<TInternal>;
type ScalarLiteralParser<TInternal> = (
  valueNode: ValueNode,
  variables: Maybe<{ [key: string]: any }>, // TODO: try a better type for serializers
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

export class ScalarSemiType<N extends string, T> extends SemiType<N, T> {
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

  protected getFreshSemiGraphQLType = (): GraphQLScalarType => {
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

const string = new ScalarSemiType<'String', string>({
  name: 'String',
  parseLiteral: GraphQLString.parseLiteral,
  parseValue: GraphQLString.parseValue,
  serialize: GraphQLString.serialize,
  description: GraphQLString.description,
  specifiedByUrl: GraphQLString.specifiedByUrl,
});

const int = new ScalarSemiType<'Int', number>({
  name: 'Int',
  parseLiteral: GraphQLInt.parseLiteral,
  parseValue: GraphQLInt.parseValue,
  serialize: GraphQLInt.serialize,
  description: GraphQLInt.description,
  specifiedByUrl: GraphQLInt.specifiedByUrl,
});

const boolean = new ScalarSemiType<'Boolean', boolean>({
  name: 'Boolean',
  parseLiteral: GraphQLBoolean.parseLiteral,
  parseValue: GraphQLBoolean.parseValue,
  serialize: GraphQLBoolean.serialize,
  description: GraphQLBoolean.description,
  specifiedByUrl: GraphQLBoolean.specifiedByUrl,
});

const float = new ScalarSemiType<'Float', number>({
  name: 'Float',
  parseLiteral: GraphQLFloat.parseLiteral,
  parseValue: GraphQLFloat.parseValue,
  serialize: GraphQLFloat.serialize,
  description: GraphQLFloat.description,
  specifiedByUrl: GraphQLFloat.specifiedByUrl,
});

const id = new ScalarSemiType<'ID', number | string>({
  name: 'ID',
  parseLiteral: GraphQLID.parseLiteral,
  parseValue: GraphQLID.parseValue,
  serialize: GraphQLID.serialize,
  description: GraphQLID.description,
  specifiedByUrl: GraphQLID.specifiedByUrl,
});

export const datetime = new ScalarSemiType<'Datetime', Date>({
  name: 'Datetime',
  parseLiteral: (ast) => {
    if (ast.kind === Kind.STRING) {
      return new Date(Date.parse(ast.value));
    }
    return null;
  },
  parseValue: (value) => {
    if (typeof value === 'string') {
      return new Date(value);
    }
    return null;
  },
  serialize: (value) => {
    return value.toISOString();
  },
  description: 'A datetime wrapper for the Date class',
});

const typeContext = new TypeContext();

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'RootQuery',
    fields: {
      id: {
        type: id.getSemiGraphQLType(typeContext) as any,
      },
      datetime: {
        type: datetime.getSemiGraphQLType(typeContext) as any,
        resolve: (a, b, c) => {
          return new Date();
        },
      },
      dateAsInput: {
        type: new GraphQLNonNull(
          datetime.getSemiGraphQLType(typeContext) as any,
        ),
        args: {
          x: {
            type: datetime.getSemiGraphQLType(typeContext) as any,
          },
        },
        resolve: (a, b, c) => {
          return b.x;
        },
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

  // const url = id.getFreshSemiGraphQLType().specifiedByUrl;
  app.listen({ port: PORT }, () => {
    console.log(
      `🚀 Server ready at http://localhost:${PORT}${apolloServer.graphqlPath}`,
    );
  });
};

start();
