import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import {
  GraphQLType,
  GraphQLString,
  GraphQLFloat,
  GraphQLInt,
  GraphQLID,
  GraphQLBoolean,
  GraphQLNonNull,
  ValueNode,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLObjectType,
} from 'graphql';
import { forEach, mapValues } from 'lodash';
import { Maybe } from './utils';

type FallbackGraphQLTypeFn = (typeContext: TypeContext) => GraphQLType;

export class TypeContext {
  private readonly savedSemiGraphQLTypes = new Map<string, GraphQLType>([
    // TODO: find a better solution than this. this is done to circumvent the "Schema must contain uniquely names types" error
    ['String', GraphQLString],
    ['Float', GraphQLFloat],
    ['Int', GraphQLInt],
    ['ID', GraphQLID],
    ['Boolean', GraphQLBoolean],
  ]);

  public getInternalGraphQLType(
    type: AnyType,
    fallback: FallbackGraphQLTypeFn,
  ): GraphQLType {
    const existingType = this.savedSemiGraphQLTypes.get(type.name);
    if (existingType) {
      return existingType;
    } else {
      const newType = fallback(this);
      this.savedSemiGraphQLTypes.set(type.name, newType);
      return this.getInternalGraphQLType(type, fallback);
    }
  }
}

interface Type<N extends string, T> {
  readonly name: N;
  readonly isNullable: boolean;
  readonly __T: T;
  getGraphQLType(typeContext: TypeContext): GraphQLType;
}

type AnyType = Type<any, any>;

export abstract class BaseType<N extends string, T> implements Type<N, T> {
  public readonly name: N;
  public readonly isNullable = false; // TODO: understand why this isn't getting set to true when looked from within.
  public readonly __T!: T;

  public constructor(params: { name: N }) {
    this.name = params.name;
  }

  // public abstract nullable(): Type<N, Maybe<T>, R>;
  // public abstract nonNullable(): Type<N, T, R>;

  protected abstract getFreshInternalGraphQLType(
    typeContext: TypeContext,
  ): GraphQLType;

  private getInternalGraphQLType = (typeContext: TypeContext): GraphQLType => {
    return typeContext.getInternalGraphQLType(
      this,
      this.getFreshInternalGraphQLType,
    );
  };

  public getGraphQLType = (typeContext: TypeContext): GraphQLType => {
    const internalGraphQLType = this.getInternalGraphQLType(typeContext);
    if (this.isNullable) {
      return internalGraphQLType;
    } else {
      return new GraphQLNonNull(internalGraphQLType);
    }
  };

  public get nullable(): Type<N, Maybe<T>> {
    const x = Object.assign({}, this);
    return x;
  }
}

type ScalarSerializer<TInternal> = (value: TInternal) => Maybe<any>;
type ScalarValueParser<TInternal> = (value: unknown) => Maybe<TInternal>;
type ScalarLiteralParser<TInternal> = (
  valueNode: ValueNode,
  variables: Maybe<{ [key: string]: any }>, // TODO: try a better type for serializers
) => Maybe<TInternal>;

interface IScalarSemiTypeConstructor<N extends string, T> {
  name: N;
  description?: Maybe<string>;
  specifiedByUrl?: Maybe<string>;
  serialize: ScalarType<N, T>['serializer'];
  parseValue: ScalarType<N, T>['valueParser'];
  parseLiteral: ScalarType<N, T>['literalParser'];
}

export class ScalarType<N extends string, T> extends BaseType<N, T> {
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

  protected getFreshInternalGraphQLType = (): GraphQLScalarType => {
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

const String = new ScalarType<'String', string>({
  name: 'String',
  parseLiteral: GraphQLString.parseLiteral,
  parseValue: GraphQLString.parseValue,
  serialize: GraphQLString.serialize,
  description: GraphQLString.description,
  specifiedByUrl: GraphQLString.specifiedByUrl,
});

const Int = new ScalarType<'Int', number>({
  name: 'Int',
  parseLiteral: GraphQLInt.parseLiteral,
  parseValue: GraphQLInt.parseValue,
  serialize: GraphQLInt.serialize,
  description: GraphQLInt.description,
  specifiedByUrl: GraphQLInt.specifiedByUrl,
});

const Boolean = new ScalarType<'Boolean', boolean>({
  name: 'Boolean',
  parseLiteral: GraphQLBoolean.parseLiteral,
  parseValue: GraphQLBoolean.parseValue,
  serialize: GraphQLBoolean.serialize,
  description: GraphQLBoolean.description,
  specifiedByUrl: GraphQLBoolean.specifiedByUrl,
});

const Float = new ScalarType<'Float', number>({
  name: 'Float',
  parseLiteral: GraphQLFloat.parseLiteral,
  parseValue: GraphQLFloat.parseValue,
  serialize: GraphQLFloat.serialize,
  description: GraphQLFloat.description,
  specifiedByUrl: GraphQLFloat.specifiedByUrl,
});

const ID = new ScalarType<'ID', number | string>({
  name: 'ID',
  parseLiteral: GraphQLID.parseLiteral,
  parseValue: GraphQLID.parseValue,
  serialize: GraphQLID.serialize,
  description: GraphQLID.description,
  specifiedByUrl: GraphQLID.specifiedByUrl,
});

const typeContextObject = new TypeContext();
const x = Boolean.nullable;
const y = x.getGraphQLType(typeContextObject);
y;

// TODO: current problem: isNullable doesnt get set to true from within, even though it appears to be
// set to true from outside.

// const schema = new GraphQLSchema({
//   query: new GraphQLObjectType({
//     name: 'Query',
//     fields: {
//       // id: { type: ID.getGraphQLType(typeContextObject) as any },
//       // string: { type: String.getGraphQLType(typeContextObject) as any },
//       // float: { type: Float.getGraphQLType(typeContextObject) as any },
//       // int: { type: Int.getGraphQLType(typeContextObject) as any },
//       boolean: {
//         type: Boolean.nullable.getGraphQLType(typeContextObject) as any,
//       },
//     },
//   }),
// });

// const apolloServer = new ApolloServer({
//   schema,
// });

// const PORT = 4001;

// const start = () => {
//   const app = express();
//   apolloServer.applyMiddleware({ app });

//   // const url = id.getFreshSemiGraphQLType().specifiedByUrl;
//   app.listen({ port: PORT }, () => {
//     console.log(
//       `🚀 Server ready at http://localhost:${PORT}${apolloServer.graphqlPath}`,
//     );
//   });
// };

// start();
