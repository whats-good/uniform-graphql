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
import { clone, forEach, mapValues } from 'lodash';
import {
  Maybe,
  Unthunked,
  unthunk,
  Thunkable,
  RecursivePromisable,
} from './utils';

type AnyTypeContext = TypeContext<any>;
type FallbackGraphQLTypeFn = (typeContext: AnyTypeContext) => GraphQLType;

// TODO: find a better name than TypeContext, because it's easily confused with GraphQLContext.

type StringKeys<T = unknown> = { [key: string]: T };
type GraphQLContext = StringKeys;
type ContextGetter<C extends GraphQLContext> = (args: any) => C;

// TODO: make the args use the Argsmap type once it's ready
interface RootQueryField<
  T extends OutputType<any>,
  A,
  C extends GraphQLContext
> {
  type: T;
  args: A; // TODO: handle args map
  resolve: ResolverFn<undefined, A, RealizedTypeOf<T>, C>;
}

export class TypeContext<C extends GraphQLContext> {
  public readonly __C!: C; // the context
  public readonly getContext: ContextGetter<C>;

  private readonly internalGraphQLTypes = new Map<string, GraphQLType>([
    // TODO: find a better solution than this. this is done to circumvent the "Schema must contain uniquely names types" error
    ['String', GraphQLString],
    ['Float', GraphQLFloat],
    ['Int', GraphQLInt],
    ['ID', GraphQLID],
    ['Boolean', GraphQLBoolean],
  ]);

  private readonly rootQueryFields: StringKeys<
    RootQueryField<OutputType<any>, any, C>
  > = {};

  public constructor(params: { getContext: TypeContext<C>['getContext'] }) {
    this.getContext = params.getContext;
  }

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

  public query<T extends OutputType<any>, A>(
    params: StringKeys<RootQueryField<T, A, C>>,
  ): void {
    forEach(params, (value, key) => {
      this.rootQueryFields[key] = value;
    });
  }

  // TODO: optional name params for the root query
  public getSchema(): GraphQLSchema {
    return new GraphQLSchema({
      query: new GraphQLObjectType({
        name: 'Query',
        fields: () =>
          mapValues(this.rootQueryFields, (field) => {
            return <GraphQLFieldConfig<any, any>>{
              type: field.type.getInternalGraphQLType(this) as any,
              args: field.args,
              resolve: field.resolve,
              // deprecationReason // TODO: add / implement
              // description
            };
          }),
      }),
    });
  }
}

type AnyType = BaseType<any, any, any>;

const nullable = <T>(t: BaseType<any, T, any>): BaseType<any, T, Maybe<T>> => {
  const cloned: any = clone(t);
  cloned.isNullable = true;
  return cloned;
};

export abstract class BaseType<N extends string, I, R = I> {
  public readonly name: N;
  public readonly isNullable = false; // TODO: understand why this isn't getting set to true when looked from within.
  public readonly __I!: I;
  public readonly __R!: R;
  public readonly __B = 'basetype';

  public constructor(params: { name: N }) {
    this.name = params.name;
  }

  protected abstract getFreshInternalGraphQLType(
    typeContext: AnyTypeContext,
  ): GraphQLType;

  public getInternalGraphQLType = (
    typeContext: AnyTypeContext,
  ): GraphQLType => {
    const fallback = this.getFreshInternalGraphQLType.bind(this);
    return typeContext.getInternalGraphQLType(this, fallback);
  };

  public abstract get nullable(): BaseType<N, I, Maybe<I>>;
}

type ScalarSerializer<TInternal> = (value: TInternal) => Maybe<any>;
type ScalarValueParser<TInternal> = (value: unknown) => Maybe<TInternal>;
type ScalarLiteralParser<TInternal> = (
  valueNode: ValueNode,
  variables: Maybe<{ [key: string]: any }>, // TODO: try a better type for serializers
) => Maybe<TInternal>;

interface IScalarSemiTypeConstructor<N extends string, T, R = T> {
  name: N;
  description?: Maybe<string>;
  specifiedByUrl?: Maybe<string>;
  serialize: ScalarType<N, T, R>['serializer'];
  parseValue: ScalarType<N, T, R>['valueParser'];
  parseLiteral: ScalarType<N, T, R>['literalParser'];
}

export class ScalarType<N extends string, I, R = I> extends BaseType<N, I, R> {
  public readonly description?: Maybe<string>;
  public readonly specifiedByUrl?: Maybe<string>;

  private readonly serializer: ScalarSerializer<I>;
  private readonly valueParser: ScalarValueParser<I>;
  private readonly literalParser: ScalarLiteralParser<I>;

  constructor(params: IScalarSemiTypeConstructor<N, I, R>) {
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

  public get nullable(): ScalarType<N, I, Maybe<I>> {
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

type OutputType<R> = ScalarType<any, any, R> | ObjectType<any, any, R>;

class BaseOutputField<R> {
  public readonly __B = 'outputfield';

  public readonly type: OutputType<R>;

  public constructor(params: { type: OutputType<R> }) {
    this.type = params.type;
  }

  public getGraphQLFieldConfig(
    typeContext: AnyTypeContext,
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

type InternalTypeOf<T extends BaseType<any, any, any>> = T['__I'];
type RealizedTypeOf<T extends BaseType<any, any, any>> = T['__R'];
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

type OutputFieldOfFieldConstructorArg<
  C extends OutputFieldConstructorArg<any>
> = C extends OutputType<any>
  ? BaseOutputField<C['__R']>
  : // BaseOutputField<TypeOf<C>> TODO: understand why this one doesnt work but the other one works?
  C extends BaseOutputField<any>
  ? C
  : never;

type TypeOfOutputFieldConstructorArgsMap<
  F extends OutputFieldConstructorArgsMap
> = {
  [K in keyof F]: RealizedTypeOf<
    OutputFieldOfFieldConstructorArg<Unthunked<F[K]>>['type']
  >;
};

const toBaseOutputField = <R>(
  a: OutputFieldConstructorArg<R>,
): BaseOutputField<R> => {
  if (brandOf(a) == 'basetype') {
    return new BaseOutputField({ type: a as any });
  } else if (brandOf(a) == 'outputfield') {
    return a as any;
  } else {
    throw new Error(`Unrecognized brand: ${brandOf(a)}`);
  }
};

class ObjectType<
  N extends string,
  I extends StringKeys,
  R = I
> extends BaseType<N, I, R> {
  public readonly fields: OutputFieldConstructorArgsMap;

  private constructor(params: {
    name: N;
    fields: OutputFieldConstructorArgsMap;
  }) {
    super(params);
    this.fields = params.fields;
  }

  protected getFreshInternalGraphQLType(
    typeContext: AnyTypeContext,
  ): GraphQLType {
    return new GraphQLObjectType({
      name: this.name,
      fields: () =>
        mapValues(this.fields, (field) => {
          const unthunkedField = unthunk(field);
          const baseOutputField = toBaseOutputField(unthunkedField);
          return baseOutputField.getGraphQLFieldConfig(typeContext);
        }),
    });
  }

  public get nullable(): ObjectType<N, I, Maybe<I>> {
    return nullable(this) as any;
  }

  public static init<
    N extends string,
    F extends OutputFieldConstructorArgsMap
  >(params: {
    name: N;
    fields: F;
  }): ObjectType<
    N,
    TypeOfOutputFieldConstructorArgsMap<F>,
    TypeOfOutputFieldConstructorArgsMap<F>
  > {
    return new ObjectType({
      name: params.name,
      fields: params.fields,
    });
  }
}

type UserType = ObjectType<
  'User',
  {
    a: RealizedTypeOf<typeof String>;
    b: RealizedTypeOf<typeof ID>;
    c: RealizedTypeOf<typeof String['nullable']>;
    d: RealizedTypeOf<typeof ID['nullable']>;
    e: RealizedTypeOf<UserType>;
    f: RealizedTypeOf<typeof String>;
  }
>;

const User: UserType = ObjectType.init({
  name: 'User',
  fields: {
    a: () => String,
    b: ID,
    c: String.nullable,
    d: () => new BaseOutputField({ type: ID.nullable }),
    e: () => User,
    f: () => String,
  },
});

type ResolverReturnValue<T> = Thunkable<RecursivePromisable<T>>;

type ResolverFn<R, A, T, C> = (
  root: R,
  args: A,
  context: C,
) => ResolverReturnValue<T>;

const typeContextObject = new TypeContext({
  getContext: () => ({ kerem: 'kazan', kazan: 123 }),
});

typeContextObject.query({
  currentUser: {
    type: User.nullable,
    // args: { firstName: 'kerem' },
    args: {}, // TODO: enable empty objects and undefined
    resolve: (root, args, context) => {
      // TODO: if the returned value is an output object, allow the devs to further async
      // thunk the fields.
      return {
        a: 'a',
        b: 'b',
        c: 'c',
        d: 'd',
        get e() {
          return this;
        },
        f: 'f',
      };
      // return {
      //   a: () => 'a',
      //   b: () => {
      //     return new Promise((resolve) => {
      //       resolve('b');
      //     });
      //   },
      //   c: () =>
      //     new Promise((resolve) => {
      //       const p1 = new Promise((resolve2) => {
      //         const p2 = new Promise((resolve3) => {
      //           resolve3('c4');
      //         });
      //         resolve2(p2);
      //       });
      //       resolve(p1);
      //     }),
      //   d: new Promise((resolve) => {
      //     resolve('d');
      //   }),
      //   get e() {
      //     return this;
      //   },
      //   f: () =>
      //     new Promise((resolve) => {
      //       resolve(
      //         new Promise((resolve2) => {
      //           resolve2('f2');
      //         }),
      //       );
      //     }),
      // };
    },
  },
});

// const schema = new GraphQLSchema({
//   query: new GraphQLObjectType({
//     name: 'Query',
//     fields: {
//       // id: { type: ID.getGraphQLType(typeContextObject) as any },
//       // string: { type: String.getGraphQLType(typeContextObject) as any },
//       // float: { type: Float.getGraphQLType(typeContextObject) as any },
//       // int: { type: Int.getGraphQLType(typeContextObject) as any },
//       // boolean: {
//       //   type: Boolean.nullable.getGraphQLType(typeContextObject) as any,
//       // },
//       currentUser: {
//         type: User.getInternalGraphQLType(typeContextObject) as any,
//         resolve: () => ,
//       },
//     },
//   }),
// });

const schema = typeContextObject.getSchema();

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
