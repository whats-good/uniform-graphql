import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLScalarType,
  GraphQLString,
  GraphQLType,
  ValueNode,
} from 'graphql';
import { Maybe } from './utils';

interface StringKeys<T> {
  [key: string]: T;
}

type GraphQLContext = StringKeys<unknown>;

type ContextGetter<C extends GraphQLContext> = (args: any) => C;

type AnyType = BaseType<any, any>;

type AnyTypeContainer = TypeContainer<any>;

type FallbackGraphQLTypeFn = (typeContext: AnyTypeContainer) => GraphQLType;

class TypeContainer<C extends GraphQLContext> {
  private readonly contextGetter: ContextGetter<C>;
  private readonly internalGraphQLTypes: StringKeys<GraphQLType> = {};

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
}

abstract class BaseType<N extends string, I> {
  public readonly name: N;
  public readonly __I!: I;

  constructor(params: { name: N }) {
    this.name = params.name;
  }

  protected abstract getFreshInternalGraphQLType(
    typeContext: AnyTypeContainer,
  ): GraphQLType;

  public getInternalGraphQLType = (
    typeContext: AnyTypeContainer,
  ): GraphQLType => {
    const fallback = this.getFreshInternalGraphQLType.bind(this);
    return typeContext.getInternalGraphQLType(this, fallback);
  };
}

class RealizedType<T extends BaseType<any, any>, N extends boolean = false> {
  public readonly internalType: T;
  public readonly isNullable: N;

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
}

type ScalarSerializer<TInternal> = (value: TInternal) => Maybe<any>;
type ScalarValueParser<TInternal> = (value: unknown) => Maybe<TInternal>;
type ScalarLiteralParser<TInternal> = (
  valueNode: ValueNode,
  variables: Maybe<{ [key: string]: any }>, // TODO: try a better type for serializers
) => Maybe<TInternal>;

interface IScalarTypeConstructor<N extends string, I> {
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

  constructor(params: IScalarTypeConstructor<N, I>) {
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
  params: IScalarTypeConstructor<N, I>,
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

type AnyRealizedType = RealizedType<any, any>;

type InternalTypeOf<T extends AnyRealizedType> = T['internalType']['__I'];
type FieldTypeOf<T extends AnyRealizedType> = T['isNullable'] extends true
  ? Maybe<InternalTypeOf<T>>
  : InternalTypeOf<T>;

type D = InternalTypeOf<typeof ID>;
type E = FieldTypeOf<typeof ID>;
type F = FieldTypeOf<typeof ID['nullable']>;
