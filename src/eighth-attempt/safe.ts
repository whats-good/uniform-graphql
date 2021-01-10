import {
  GraphQLArgumentConfig,
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFieldConfigArgumentMap,
  GraphQLFloat,
  GraphQLID,
  GraphQLInputFieldConfig,
  GraphQLInputFieldMap,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLString,
  GraphQLType,
  isInputObjectType,
  ValueNode,
} from 'graphql';
import { brandOf, Maybe, Thunkable, unthunk, Unthunked } from './utils';
import mapValues from 'lodash/mapValues';
/**
 * Remaining items:
 *
 * TODO: Add the interface type
 * TODO: Add mutations
 * TODO: Add object field resolver utilities (i.e conversion from async thunkables to normal)
 * TODO: give the developer more flexibility in terms of determining the root type.
 * TODO: enable developers to omit the args
 * TODO: enable devleopers to omit nullable fields
 * TODO: implement all the deprecationReason & description fields
 * TODO: implement all the isTypeOf & resolveType methods for abstract type resolutions
 * TODO: make the objectfield more useful or remove it.
 *
 */

interface StringKeys<T> {
  [key: string]: T;
}

type GraphQLContext = StringKeys<unknown>;

type ContextGetter<C extends GraphQLContext> = () => C;

type AnyType = InternalType<any, any>;

type AnyTypeContainer = TypeContainer<any>;

type FallbackGraphQLTypeFn = (typeContainer: AnyTypeContainer) => GraphQLType;

export class TypeContainer<C extends GraphQLContext> {
  private readonly contextGetter: ContextGetter<C>;
  private readonly internalGraphQLTypes: StringKeys<GraphQLType> = {
    String: GraphQLString,
    Float: GraphQLFloat,
    Int: GraphQLInt,
    Boolean: GraphQLBoolean,
    ID: GraphQLID,
  };

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

abstract class InternalType<N extends string, I> {
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

class RealizedType<T extends AnyType, N extends boolean> {
  public readonly internalType: T;
  public readonly isNullable: N;
  public __BRAND__ = 'realizedtype';

  public constructor(params: { internalType: T; isNullable: N }) {
    this.internalType = params.internalType;
    this.isNullable = params.isNullable;
  }

  public get name() {
    return this.internalType.name;
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
  serialize: ScalarInternalType<N, I>['serializer'];
  parseValue: ScalarInternalType<N, I>['valueParser'];
  parseLiteral: ScalarInternalType<N, I>['literalParser'];
}

class ScalarInternalType<N extends string, I> extends InternalType<N, I> {
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

type ScalarType<
  N extends string,
  I,
  NULLABLE extends boolean = false
> = RealizedType<ScalarInternalType<N, I>, NULLABLE>;

const scalar = <N extends string, I>(
  params: IScalarTypeConstructorParams<N, I>,
): ScalarType<N, I, false> => {
  const scalarType = new ScalarInternalType(params);
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

interface IEnumValue {
  deprecationReason?: string;
  description?: string;
}

type EnumValuesMap = StringKeys<IEnumValue | null>;

interface IEnumTypeConstructorParams<
  N extends string,
  D extends EnumValuesMap
> {
  name: N;
  description?: string;
  values: D;
}

class EnumInternalType<
  N extends string,
  D extends EnumValuesMap
> extends InternalType<N, keyof D> {
  public readonly description?: string;
  public readonly valuesConfig: D;

  public constructor(params: IEnumTypeConstructorParams<N, D>) {
    super(params);
    this.description = params.description;
    this.valuesConfig = params.values;
  }

  public get values(): { [K in keyof D]: K } {
    return mapValues(this.valuesConfig, (value, key) => key) as any;
  }

  protected getFreshInternalGraphQLType(): GraphQLEnumType {
    return new GraphQLEnumType({
      name: this.name,
      description: this.description,
      values: mapValues(this.valuesConfig, (value, key) => {
        return {
          value: key,
          description: value?.description,
          deprecationReason: value?.deprecationReason,
        };
      }),
    });
  }
}

export type EnumType<
  N extends string,
  D extends EnumValuesMap,
  NULLABLE extends boolean = false
> = RealizedType<EnumInternalType<N, D>, NULLABLE>;

export const enu = <N extends string, D extends EnumValuesMap>(
  params: IEnumTypeConstructorParams<N, D>,
): EnumType<N, D, false> => {
  const internalType = new EnumInternalType(params);
  return new RealizedType({
    internalType,
    isNullable: false,
  });
};

type OutputInternalType =
  | ScalarInternalType<any, any>
  | EnumInternalType<any, any>
  | ListInternalType<OutputRealizedType>;

type InputInternalType =
  | ScalarInternalType<any, any>
  | EnumInternalType<any, any>
  | InputObjectInternalType<any, any>
  | ListInternalType<InputRealizedType>;

type OutputRealizedType = RealizedType<OutputInternalType, any>;
type InputRealizedType = RealizedType<InputInternalType, any>;

class ListInternalType<
  T extends RealizedType<InternalType<any, any>, any>
> extends InternalType<string, T> {
  public readonly type: T;

  constructor(params: { type: T }) {
    super({ name: `List<${params.type.name}>` });
    this.type = params.type;
  }

  protected getFreshInternalGraphQLType(
    typeContainer: AnyTypeContainer,
  ): GraphQLList<any> {
    return new GraphQLList(this.type.getGraphQLType(typeContainer));
  }
}

const __list = <T extends RealizedType<any, any>>(type: T) => {
  const internalType = new ListInternalType({
    type,
  });
  return new RealizedType({
    internalType,
    isNullable: false,
  });
};

type ListType<
  T extends OutputRealizedType,
  NULLABLE extends boolean = false
> = RealizedType<ListInternalType<T>, NULLABLE>;

type InputListType<
  T extends InputRealizedType,
  NULLABLE extends boolean = false
> = RealizedType<ListInternalType<T>, NULLABLE>;

export const list = <T extends OutputRealizedType>(
  type: T,
): ListType<T, false> => {
  return __list(type);
};

export const inputlist = <T extends InputRealizedType>(
  type: T,
): InputListType<T, false> => {
  return __list(type);
};

type ExternalTypeOf<R extends RealizedType<any, any>> = TypeRealization<
  R,
  R['internalType']['__INTERNAL_TYPE__']
>;

type TypeRealization<
  R extends OutputRealizedType,
  T
> = R['isNullable'] extends true ? Maybe<T> : T;

interface InputFieldConstructorParams<R extends InputRealizedType> {
  type: R;
  deprecationReason?: string;
  description?: string;
}

class InputField<R extends InputRealizedType> {
  public readonly type: R;
  public readonly deprecationReason?: string;
  public readonly description?: string;

  constructor(params: InputFieldConstructorParams<R>) {
    this.type = params.type;
    this.deprecationReason = params.deprecationReason;
    this.description = params.description;
  }

  getGraphQLInputFieldConfig(
    typeContainer: AnyTypeContainer,
  ): GraphQLInputFieldConfig {
    return {
      type: this.type.getGraphQLType(typeContainer) as any,
      deprecationReason: this.deprecationReason,
      description: this.description,
    };
  }
}

type InputFieldsMapValue<R extends InputRealizedType> =
  | R
  | InputFieldConstructorParams<R>;

type TypeInInputMapValue<
  V extends InputFieldsMapValue<any>
> = V extends InputRealizedType
  ? V
  : V extends InputFieldConstructorParams<any>
  ? V['type']
  : never;

type InputFieldConstructorParamsInInputMapValue<
  V extends InputFieldsMapValue<InputRealizedType>
> = InputFieldConstructorParams<TypeInInputMapValue<V>>;

type InputFieldsMap = StringKeys<
  Thunkable<InputFieldsMapValue<InputRealizedType>>
>;

type ObfuscatedInputFieldsMap<M extends InputFieldsMap> = {
  [K in keyof M]:
    | M[K]
    | Thunkable<
        | TypeInInputMapValue<Unthunked<M[K]>>
        | InputFieldConstructorParamsInInputMapValue<Unthunked<M[K]>>
      >;
};

type TypeOfInputFieldsMap<M extends InputFieldsMap> = {
  [K in keyof M]: ExternalTypeOf<TypeInInputMapValue<Unthunked<M[K]>>>;
};

interface IInputObjectInternalTypeConstructorParams<
  N extends string,
  M extends InputFieldsMap
> {
  name: N;
  fields: M;
  description?: string;
}

const toInputField = <V extends InputFieldsMapValue<any>>(
  v: V,
): InputField<TypeInInputMapValue<V>> => {
  if (brandOf(v as any) == 'realizedtype') {
    return new InputField({ type: v as any });
  } else {
    return new InputField(v as any);
  }
};

class InputObjectInternalType<
  N extends string,
  M extends InputFieldsMap
> extends InternalType<N, TypeOfInputFieldsMap<M>> {
  public readonly fields: M;
  public readonly description?: string;

  constructor(params: IInputObjectInternalTypeConstructorParams<N, M>) {
    super(params);
    this.fields = params.fields;
    this.description = params.description;
  }

  protected getFreshInternalGraphQLType(
    typeContainer: AnyTypeContainer,
  ): GraphQLInputObjectType {
    return new GraphQLInputObjectType({
      name: this.name,
      description: this.description,
      fields: () =>
        mapValues(this.fields, (protoField) => {
          const unthunkedProtoField = unthunk(protoField);
          const inputField = toInputField(unthunkedProtoField);
          return inputField.getGraphQLInputFieldConfig(typeContainer);
        }),
    });
  }
}

type InputObjectType<
  N extends string,
  M extends InputFieldsMap,
  NULLABLE extends boolean = false
> = RealizedType<
  InputObjectInternalType<N, ObfuscatedInputFieldsMap<M>>,
  NULLABLE
>;

const inputObject = <N extends string, M extends InputFieldsMap>(
  params: IInputObjectInternalTypeConstructorParams<N, M>,
): InputObjectType<N, M> => {
  const internalType: InputObjectInternalType<
    N,
    ObfuscatedInputFieldsMap<M>
  > = new InputObjectInternalType(params);
  return new RealizedType({
    internalType,
    isNullable: false,
  });
};

type ABC = InputObjectType<
  'ABC',
  {
    x: typeof String;
    y: typeof Float;
    z: ABC;
  }
>;

const abc: ABC = inputObject({
  name: 'ABC',
  fields: {
    x: () => String,
    y: () => ({
      type: Float,
    }),
    z: () => abc,
  },
});

const obj = new GraphQLObjectType({
  name: 'yo',
  fields: {
    id: {
      type: GraphQLID,
      args: {
        a: {
          type: GraphQLString,
          deprecationReason: 'yo',
          description: 'x',
        },
      },
    },
  },
});

type ArgsMap = StringKeys<InputFieldsMapValue<InputRealizedType>>;

/**
 * TODO: Make an output field class that takes arguments into consideration.
 */
