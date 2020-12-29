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
import { mapValues } from 'lodash';
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

  protected abstract getFreshInternalGraphQLType(
    typeContext: TypeContext,
  ): GraphQLType;

  private getInternalGraphQLType = (typeContext: TypeContext): GraphQLType => {
    const fallback = this.getFreshInternalGraphQLType.bind(this);
    return typeContext.getInternalGraphQLType(this, fallback);
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

  protected getFreshInternalGraphQLType(): GraphQLScalarType {
    return new GraphQLScalarType({
      name: this.name,
      description: this.description,
      specifiedByUrl: this.specifiedByUrl,
      serialize: this.serializer,
      parseValue: this.valueParser,
      parseLiteral: this.literalParser,
    });
  }
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

type OutputType<T> = Type<any, T> & ScalarType<any, any>;

const typeContextObject = new TypeContext();
const x = Boolean.nullable;
const y = x.getGraphQLType(typeContextObject);
y;

interface IOutputObjectField<T> {
  type: OutputType<T>;
}

class BaseOutputObjectField<T> implements IOutputObjectField<T> {
  public readonly type: OutputType<T>;

  constructor(params: { type: BaseOutputObjectField<T>['type'] }) {
    this.type = params.type;
  }
}

type OutputObjectFieldParams<T> = OutputType<T>; // TODO: expand this

const toOutputObjectField = <T>(
  type: OutputObjectFieldParams<T>,
): IOutputObjectField<T> => {
  // TODO: add type guards to determine if the given input is a Base<any, any> or something else
  return new BaseOutputObjectField({ type });
};

interface OutputObjectFieldParamsMap {
  [key: string]: OutputObjectFieldParams<any>;
}

interface OutputObjectFieldsMap {
  [key: string]: IOutputObjectField<any>;
}

type TypeOf<T extends BaseType<any, any>> = T['__T'];
type TypeOfOutputObjectFieldsMap<F extends OutputObjectFieldsMap> = {
  [K in keyof F]: F[K];
};

class OutputObjectType<
  N extends string,
  F extends OutputObjectFieldsMap,
  T
> extends BaseType<N, T> {
  public readonly fields: OutputObjectFieldsMap;
  public readonly description?: string;

  private constructor(params: {
    name: OutputObjectType<N, F, T>['name'];
    fields: OutputObjectFieldsMap;
  }) {
    super(params);
    this.fields = params.fields;
  }

  protected getFreshInternalGraphQLType(typeContext: TypeContext): GraphQLType {
    // TODO: implement
    return new GraphQLObjectType({
      name: this.name,
      description: this.description,
      // interfaces: this.interfaces,
      // isTypeOf: this.isTypeOf,
      // resolveObject: this.resolveObject,
      fields: mapValues(this.fields, (field) => {
        return {
          type: field.type.getGraphQLType(typeContext),
          // TODO: find a way to get the description, deprecation reason and etc
        } as any;
      }),
    });
  }

  public static init<
    N extends string,
    F extends OutputObjectFieldsMap,
    T extends TypeOfOutputObjectFieldsMap<F>
  >(params: {
    name: OutputObjectType<N, F, T>['name'];
    fields: OutputObjectFieldParamsMap;
  }) {
    return new OutputObjectType({
      name: params.name,
      fields: mapValues(params.fields, (field) => {
        return { type: field };
      }),
    });
  }
}

const User = OutputObjectType.init({
  name: 'User',
  fields: {
    a: String,
    b: Float,
    c: String,
    d: ID,
  },
});

// TODO: current problem: isNullable doesnt get set to true from within, even though it appears to be
// set to true from outside.

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      // id: { type: ID.getGraphQLType(typeContextObject) as any },
      // string: { type: String.getGraphQLType(typeContextObject) as any },
      // float: { type: Float.getGraphQLType(typeContextObject) as any },
      // int: { type: Int.getGraphQLType(typeContextObject) as any },
      // boolean: {
      //   type: Boolean.nullable.getGraphQLType(typeContextObject) as any,
      // },
      b: {
        type: User.getGraphQLType(typeContextObject) as any,
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
