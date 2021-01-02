import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLString,
  GraphQLType,
  ValueNode,
} from 'graphql';
import {
  brandOf,
  Maybe,
  Promisable,
  ThenArgRecursive,
  Thunkable,
  unthunk,
  Unthunked,
} from './utils';
import { forEach, mapValues } from 'lodash';

interface StringKeys<T> {
  [key: string]: T;
}

type GraphQLContext = StringKeys<unknown>;

type ContextGetter<C extends GraphQLContext> = Thunkable<C>;

type AnyType = BaseType<any, any>;

type AnyTypeContainer = TypeContainer<any>;

type FallbackGraphQLTypeFn = (typeContainer: AnyTypeContainer) => GraphQLType;

type ResolverFnOf<R extends OutputRealizedType, S, A, C> = (
  source: S,
  args: A,
  context: C,
) => Promisable<ResolverReturnTypeOf<R>>;

type RootQueryField<
  R extends OutputRealizedType,
  A extends StringKeys<unknown>,
  C extends GraphQLContext
> = {
  type: OutputRealizedType;
  args: A; // TODO: fix
  resolve: ResolverFnOf<R, undefined, A, C>;
};

export class TypeContainer<C extends GraphQLContext> {
  private readonly contextGetter: ContextGetter<C>;
  private readonly internalGraphQLTypes: StringKeys<GraphQLType> = {};
  private readonly rootQueries: StringKeys<RootQueryField<any, any, C>> = {};

  constructor(params: { contextGetter: ContextGetter<C> }) {
    this.contextGetter = params.contextGetter;
  }

  public getInternalGraphQLType(
    type: AnyType,
    fallback: FallbackGraphQLTypeFn,
  ): GraphQLType {
    const existingType = this.internalGraphQLTypes[type.name];
    if (existingType) {
      return existingType;
    } else {
      const newType = fallback(this);
      this.internalGraphQLTypes[type.name] = newType;
      return this.getInternalGraphQLType(type, fallback);
    }
  }

  public query(fields: StringKeys<RootQueryField<any, any, C>>): void {
    forEach(fields, (field, key) => {
      this.rootQueries[key] = field;
    });
  }
}

abstract class BaseType<N extends string, I> {
  public readonly name: N;
  public readonly __INTERNAL_TYPE__!: I;

  constructor(params: { name: N }) {
    this.name = params.name;
  }

  protected abstract getFreshInternalGraphQLType(
    typeContainer: AnyTypeContainer,
  ): GraphQLType;

  public getInternalGraphQLType = (
    typeContainer: AnyTypeContainer,
  ): GraphQLType => {
    const fallback = this.getFreshInternalGraphQLType.bind(this);
    return typeContainer.getInternalGraphQLType(this, fallback);
  };
}

class RealizedType<T extends AnyType, N extends boolean = false> {
  public readonly internalType: T;
  public readonly isNullable: N;
  public __BRAND__!: 'realizedtype';

  public constructor(params: { internalType: T; isNullable: N }) {
    this.internalType = params.internalType;
    this.isNullable = params.isNullable;
  }

  public get nullable(): RealizedType<T, true> {
    return new RealizedType({
      internalType: this.internalType,
      isNullable: true,
    });
  }

  public getGraphQLType(typeContainer: AnyTypeContainer): GraphQLType {
    const internalGraphQLType = this.internalType.getInternalGraphQLType(
      typeContainer,
    );
    const externalGraphQLType = this.isNullable
      ? internalGraphQLType
      : new GraphQLNonNull(internalGraphQLType);

    return externalGraphQLType;
  }
}

type ScalarSerializer<TInternal> = (value: TInternal) => Maybe<any>;
type ScalarValueParser<TInternal> = (value: unknown) => Maybe<TInternal>;
type ScalarLiteralParser<TInternal> = (
  valueNode: ValueNode,
  variables: Maybe<{ [key: string]: any }>, // TODO: try a better type for serializers
) => Maybe<TInternal>;

interface IScalarTypeConstructorParams<N extends string, I> {
  name: N;
  description?: Maybe<string>;
  specifiedByUrl?: Maybe<string>;
  serialize: ScalarType<N, I>['serializer'];
  parseValue: ScalarType<N, I>['valueParser'];
  parseLiteral: ScalarType<N, I>['literalParser'];
}

class ScalarType<N extends string, I> extends BaseType<N, I> {
  public readonly description?: Maybe<string>;
  public readonly specifiedByUrl?: Maybe<string>;

  private readonly serializer: ScalarSerializer<I>;
  private readonly valueParser: ScalarValueParser<I>;
  private readonly literalParser: ScalarLiteralParser<I>;

  constructor(params: IScalarTypeConstructorParams<N, I>) {
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

const scalar = <N extends string, I>(
  params: IScalarTypeConstructorParams<N, I>,
): RealizedType<ScalarType<N, I>> => {
  const scalarType = new ScalarType(params);
  return new RealizedType({
    internalType: scalarType,
    isNullable: false,
  });
};

const String = scalar<'String', string>({
  name: 'String',
  parseLiteral: GraphQLString.parseLiteral,
  parseValue: GraphQLString.parseValue,
  serialize: GraphQLString.serialize,
  description: GraphQLString.description,
  specifiedByUrl: GraphQLString.specifiedByUrl,
});

const Int = scalar<'Int', number>({
  name: 'Int',
  parseLiteral: GraphQLInt.parseLiteral,
  parseValue: GraphQLInt.parseValue,
  serialize: GraphQLInt.serialize,
  description: GraphQLInt.description,
  specifiedByUrl: GraphQLInt.specifiedByUrl,
});

const Boolean = scalar<'Boolean', boolean>({
  name: 'Boolean',
  parseLiteral: GraphQLBoolean.parseLiteral,
  parseValue: GraphQLBoolean.parseValue,
  serialize: GraphQLBoolean.serialize,
  description: GraphQLBoolean.description,
  specifiedByUrl: GraphQLBoolean.specifiedByUrl,
});

const Float = scalar<'Float', number>({
  name: 'Float',
  parseLiteral: GraphQLFloat.parseLiteral,
  parseValue: GraphQLFloat.parseValue,
  serialize: GraphQLFloat.serialize,
  description: GraphQLFloat.description,
  specifiedByUrl: GraphQLFloat.specifiedByUrl,
});

const ID = scalar<'ID', number | string>({
  name: 'ID',
  parseLiteral: GraphQLID.parseLiteral,
  parseValue: GraphQLID.parseValue,
  serialize: GraphQLID.serialize,
  description: GraphQLID.description,
  specifiedByUrl: GraphQLID.specifiedByUrl,
});

type OutputType = ScalarType<any, any> | ObjectType<any, any>;
type OutputRealizedType = RealizedType<OutputType, boolean>;

class ObjectField<R extends OutputRealizedType> {
  public readonly type: R;
  public readonly __BRAND__!: 'objectfield';

  constructor(params: { type: R }) {
    this.type = params.type;
  }

  public getGraphQLFieldConfig(
    typeContainer: AnyTypeContainer,
  ): GraphQLFieldConfig<any, any, any> {
    return {
      type: this.type.getGraphQLType(typeContainer) as any,
      // deprecationReason: 123, // TODO: implement
      // description: 123,
      // resolve: 123,
    };
  }
}

type OutputFieldConstructorArg = OutputRealizedType | ObjectField<any>;

type OutputFieldConstructorArgsMapValueOf<
  R extends OutputRealizedType
> = Thunkable<R | ObjectField<R>>;

interface OutputFieldConstructorArgsMap {
  [key: string]: Thunkable<OutputFieldConstructorArg>;
}

interface IObjectTypeConstructorParams<
  N extends string,
  F extends OutputFieldConstructorArgsMap
> {
  name: N;
  fields: F;
}

type TypeInOutputFieldConstructorArg<
  A extends OutputFieldConstructorArg
> = A extends OutputRealizedType
  ? A
  : A extends ObjectField<any>
  ? A['type']
  : never;

type ObjectFieldInOutputFieldConstructorArg<
  A extends OutputFieldConstructorArg
> = ObjectField<TypeInOutputFieldConstructorArg<A>>;

const toObjectField = <A extends OutputFieldConstructorArg>(
  a: A,
): ObjectFieldInOutputFieldConstructorArg<A> => {
  if (brandOf(a) == 'realizedtype') {
    return new ObjectField({ type: a as any });
  } else if (brandOf(a) == 'objectfield') {
    return a as any;
  } else {
    throw new Error(`Unrecognized brand: ${brandOf(a)}`);
  }
};

type ExternalTypeOf<
  R extends RealizedType<any, any>
> = R['isNullable'] extends true
  ? Maybe<R['internalType']['__INTERNAL_TYPE__']>
  : R['internalType']['__INTERNAL_TYPE__'];

class ObjectType<
  N extends string,
  F extends OutputFieldConstructorArgsMap
> extends BaseType<N, TypeOfTypeStruct<TypeStructOf<F>>> {
  public readonly fields: F;

  constructor(params: IObjectTypeConstructorParams<N, F>) {
    super(params);
    this.fields = params.fields;
  }

  protected getFreshInternalGraphQLType(
    typeContainer: AnyTypeContainer,
  ): GraphQLType {
    return new GraphQLObjectType({
      name: this.name,
      fields: () =>
        mapValues(this.fields, (field) => {
          const unthunkedField = unthunk(field);
          const baseOutputField = toObjectField(unthunkedField);
          return baseOutputField.getGraphQLFieldConfig(typeContainer);
        }),
    });
  }
}

type RealizedObjectType<
  N extends string,
  F extends OutputFieldConstructorArgsMap
> = RealizedType<ObjectType<N, F>>;

const objectType = <N extends string, F extends OutputFieldConstructorArgsMap>(
  params: IObjectTypeConstructorParams<N, F>,
): RealizedObjectType<N, F> => {
  const internalType = new ObjectType(params);
  return new RealizedType({
    internalType,
    isNullable: false,
  });
};

type TypeStruct = StringKeys<OutputRealizedType>;

type TypeStructOf<F extends OutputFieldConstructorArgsMap> = {
  [K in keyof F]: TypeInOutputFieldConstructorArg<Unthunked<F[K]>>;
};

type TypeOfTypeStruct<S extends TypeStruct> = {
  [K in keyof S]: ExternalTypeOf<S[K]>;
};

const innerType = new ObjectType({
  name: 'InnerType',
  fields: {
    // id: ID,
    // idNullable: String.nullable,
    // idField: toObjectField(ID),
    // idNullableField: toObjectField(ID.nullable),
    idThunk: () => ID,
    // idThunkNullable: () => String.nullable,
    // idThunkField: () => toObjectField(ID),
    idThunkNullableField: () => toObjectField(ID.nullable),
  },
});

const InnerType = new RealizedType({
  internalType: innerType,
  isNullable: false,
});

type D = ExternalTypeOf<typeof InnerType>;

type ResolverReturnTypeOfTypeStruct<S extends TypeStruct> = {
  [K in keyof S]: Thunkable<Promisable<ResolverReturnTypeOf<S[K]>>>;
};

type ResolverReturnTypeOf<
  R extends OutputRealizedType
> = R extends RealizedType<ObjectType<any, any>>
  ? ResolverReturnTypeOfTypeStruct<TypeStructOf<R['internalType']['fields']>>
  : ExternalTypeOf<R>;

type E1 = ResolverReturnTypeOf<typeof String>;
type E2 = ResolverReturnTypeOf<typeof String['nullable']>;
type E3 = ResolverReturnTypeOf<typeof InnerType>;

type UserFields = {
  id: typeof ID;
  firstName: typeof String;
  // TODO: find a way to make sure nonNullables arent assignable for nullables. Treat them as completely different things.
  lastName: typeof String['nullable'];
  bestFriend: OutputFieldConstructorArgsMapValueOf<UserType>;
  pet: OutputFieldConstructorArgsMapValueOf<AnimalType>;
};

type UserType = RealizedObjectType<'User', UserFields>;

type E4 = ResolverReturnTypeOf<UserType>;
type E44 = ThenArgRecursive<
  Unthunked<ThenArgRecursive<Unthunked<E4['bestFriend']>>['bestFriend']>
>['bestFriend'];

const userType: UserType = objectType({
  name: 'User',
  fields: {
    id: ID,
    firstName: String,
    lastName: String['nullable'],
    bestFriend: () => userType,
    pet: () => animalType,
  },
});

type F = ExternalTypeOf<typeof userType>;
type G = F['bestFriend']['bestFriend']['bestFriend'];

type AnimalType = RealizedObjectType<
  'Animal',
  {
    id: typeof String;
    name: typeof String;
    owner: OutputFieldConstructorArgsMapValueOf<UserType>; // TODO: make these generics simpler.
  }
>;

const animalType: AnimalType = objectType({
  name: 'Animal',
  fields: {
    id: String,
    name: String,
    owner: () => userType,
  },
});

type H = ExternalTypeOf<typeof animalType>;
type HH = H['owner']['bestFriend']['pet']['owner']['bestFriend'];
