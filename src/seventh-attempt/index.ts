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
  GraphQLFieldConfig,
} from 'graphql';
import { clone, mapValues } from 'lodash';
import { Maybe, Thunk, Unthunked, unthunk, Thunkable } from './utils';

type FallbackGraphQLTypeFn = (typeContext: TypeContext) => GraphQLType;

export class TypeContext {
  private readonly internalGraphQLTypes = new Map<string, GraphQLType>([
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
    const existingType = this.internalGraphQLTypes.get(type.name);
    if (existingType) {
      return existingType;
    } else {
      const newType = fallback(this);
      this.internalGraphQLTypes.set(type.name, newType);
      return this.getInternalGraphQLType(type, fallback);
    }
  }
}

type AnyType = BaseType<any, any>;

const nullable = <T>(t: BaseType<any, T>): BaseType<any, Maybe<T>> => {
  const cloned: any = clone(t);
  cloned.isNullable = true;
  return cloned;
};

export abstract class BaseType<N extends string, T> {
  public readonly name: N;
  public readonly isNullable = false; // TODO: understand why this isn't getting set to true when looked from within.
  public readonly __T!: T;
  public readonly __B = 'basetype';

  public constructor(params: { name: N }) {
    this.name = params.name;
  }

  protected abstract getFreshInternalGraphQLType(
    typeContext: TypeContext,
  ): GraphQLType;

  public getInternalGraphQLType = (typeContext: TypeContext): GraphQLType => {
    const fallback = this.getFreshInternalGraphQLType.bind(this);
    return typeContext.getInternalGraphQLType(this, fallback);
  };

  public abstract get nullable(): BaseType<N, Maybe<T>>;
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

  public get nullable(): ScalarType<N, Maybe<T>> {
    return nullable(this) as any;
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

type OutputType<T, N extends string = any> = BaseType<N, T> &
  ScalarType<any, T>;

class BaseOutputField<T> {
  public readonly __B = 'outputfield';

  public readonly type: OutputType<T>;

  public constructor(params: { type: OutputType<T> }) {
    this.type = params.type;
  }

  public getGraphQLFieldConfig(
    typeContext: TypeContext,
  ): GraphQLFieldConfig<any, any, any> {
    const internalGraphQLType = this.type.getInternalGraphQLType(typeContext);
    const externalGraphQLType = this.type.isNullable
      ? internalGraphQLType
      : new GraphQLNonNull(internalGraphQLType);
    return {
      type: externalGraphQLType as any,
      // deprecationReason: 123, // TODO: implement
      // description: 123,
      // resolve: 123,
    };
  }
}

interface OutputFieldsMap {
  [key: string]: BaseOutputField<any>;
}

type TypeOf<T extends BaseType<any, any>> = T['__T'];
interface Branded {
  __B: string;
}

type BrandOf<T extends Branded> = T['__B'];

const brandOf = <T extends Branded>(t: T): BrandOf<T> => {
  return t.__B;
};

type OutputFieldConstructorArg<T> = OutputType<T> | BaseOutputField<T>;

interface OutputFieldConstructorArgsMap {
  [key: string]: Thunkable<OutputFieldConstructorArg<any>>;
}

type OutputFieldOfType<T extends OutputType<any>> = BaseOutputField<TypeOf<T>>;

type OutputFieldOfFieldConstructorArg<
  T extends OutputFieldConstructorArg<T>
> = T extends OutputType<any>
  ? OutputFieldOfType<T>
  : T extends BaseOutputField<any>
  ? T
  : never;

type OutputFieldConstructorArgsMapToOutputFieldsMap<
  F extends OutputFieldConstructorArgsMap
> = {
  [K in keyof F]: OutputFieldOfFieldConstructorArg<Unthunked<F[K]>>;
};

type TypeOfOutputFieldConstructorArgsMap<
  F extends OutputFieldConstructorArgsMap
> = {
  [K in keyof F]: TypeOf<
    OutputFieldOfFieldConstructorArg<Unthunked<F[K]>>['type']
  >;
};

const toBaseOutputField = <T>(
  a: OutputFieldConstructorArg<T>,
): BaseOutputField<T> => {
  if (brandOf(a) == 'basetype') {
    return new BaseOutputField({ type: a as any });
  } else if (brandOf(a) == 'outputfield') {
    return a as any;
  } else {
    throw new Error(`Unrecognized brand: ${brandOf(a)}`);
  }
};

class OutputObject<
  N extends string,
  T,
  F extends OutputFieldsMap
> extends BaseType<N, T> {
  public readonly fields: F;

  private constructor(params: { name: N; fields: F }) {
    super(params);
    this.fields = params.fields;
  }

  protected getFreshInternalGraphQLType(typeContext: TypeContext): GraphQLType {
    return new GraphQLObjectType({
      name: this.name,
      fields: mapValues(this.fields, (field) =>
        field.getGraphQLFieldConfig(typeContext),
      ),
    });
  }

  public get nullable(): OutputObject<N, Maybe<T>, F> {
    return nullable(this) as any;
  }

  public static init<
    N extends string,
    F extends OutputFieldConstructorArgsMap
  >(params: {
    name: N;
    fields: F;
  }): OutputObject<
    N,
    TypeOfOutputFieldConstructorArgsMap<F>,
    OutputFieldConstructorArgsMapToOutputFieldsMap<F>
  > {
    return new OutputObject({
      name: params.name,
      fields: mapValues(params.fields, (thunkedFieldConstructor) => {
        const unthunkedFieldConstructor = unthunk(thunkedFieldConstructor);
        return toBaseOutputField(unthunkedFieldConstructor);
      }),
    }) as any;
  }
}

const User = OutputObject.init({
  name: 'User',
  fields: {
    a: () => String.nullable,
    b: Float,
    c: String.nullable,
    d: () => new BaseOutputField({ type: ID.nullable }),
  },
});

type D = TypeOf<typeof User>;

// TODO: current problem: isNullable doesnt get set to true from within, even though it appears to be
// set to true from outside.

const typeContextObject = new TypeContext();

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
        type: User.getInternalGraphQLType(typeContextObject) as any,
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
