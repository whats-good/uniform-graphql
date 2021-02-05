import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLFieldConfigMap,
  GraphQLFloat,
  GraphQLID,
  GraphQLInputFieldConfig,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLString,
  GraphQLType,
  GraphQLUnionType,
  ValueNode,
} from 'graphql';
import { brandOf, Maybe, Thunkable, unthunk, Unthunked } from './utils';
import mapValues from 'lodash/mapValues';
import { ApolloServer } from 'apollo-server-express';
import express from 'express';

/**
 * Remaining items:
 *
 * TODO: Add mutations
 * TODO: Add object field resolver utilities (i.e conversion from async thunkables to normal)
 * TODO: give the developer more flexibility in terms of determining the root type.
 * TODO: enable developers to omit the args
 * TODO: enable devleopers to omit nullable fields
 * TODO: implement all the deprecationReason & description fields
 * TODO: add resolveType to union types
 * TODO: implement all the isTypeOf & resolveType methods for abstract type resolutions
 * TODO: make the objectfield more useful or remove it.
 * TODO: make a better resolveType function for unions & interfaces
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
  private readonly implementedInterfaces: StringKeys<
    Set<InterfaceInternalType<any, any, any>>
  > = {};

  constructor(params: { contextGetter: ContextGetter<C> }) {
    this.contextGetter = params.contextGetter;
  }

  public getImplementedInterfaces(
    type: ObjectInternalType<any, any>,
  ): InterfaceInternalType<any, any, any>[] {
    const interfaces = this.implementedInterfaces[type.name];
    if (interfaces) {
      return Array.from(interfaces);
    }
    return [];
  }

  private registerImplementors(
    interfaceType: InterfaceInternalType<any, any, any>,
  ): void {
    const implementors: Implements<any>[] = unthunk(interfaceType.implementors);
    implementors.forEach((currentImplementor) => {
      if (!this.implementedInterfaces[currentImplementor.name]) {
        this.implementedInterfaces[currentImplementor.name] = new Set();
      }
      this.implementedInterfaces[currentImplementor.name].add(interfaceType);
    });
  }

  public getInternalGraphQLType(
    type: AnyType,
    fallback: FallbackGraphQLTypeFn,
  ): GraphQLType {
    const existingType = this.internalGraphQLTypes[type.name];
    if (existingType) {
      return existingType;
    } else {
      if (type instanceof InterfaceInternalType) {
        this.registerImplementors(type);
      }
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

  public get name(): T['name'] {
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
  | ObjectInternalType<any, any>
  | UnionInternalType<any, any>
  | InterfaceInternalType<any, any, any>
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
> extends InternalType<string, Array<ExternalTypeOf<T>>> {
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

type ArgsMap = StringKeys<InputFieldsMapValue<InputRealizedType>>;

/**
 * TODO: Make an output field class that takes arguments into consideration.
 */

interface OutputFieldConstructorParams<
  R extends OutputRealizedType,
  M extends ArgsMap
> {
  type: R;
  args: M;
  deprecationReason?: string;
  description?: string;
}

class OutputField<R extends OutputRealizedType, M extends ArgsMap> {
  public readonly type: R;
  public readonly args: M;
  public readonly deprecationReason?: string;
  public readonly description?: string;

  constructor(params: OutputFieldConstructorParams<R, M>) {
    this.type = params.type;
    this.args = params.args;
    this.deprecationReason = params.deprecationReason;
    this.description = params.description;
  }

  getGraphQLFieldConfig(
    typeContainer: AnyTypeContainer,
  ): GraphQLFieldConfig<any, any, any> {
    return {
      type: this.type.getGraphQLType(typeContainer) as any,
      args: mapValues(this.args, (arg) => {
        const inputField = toInputField(arg);
        return inputField.getGraphQLInputFieldConfig(typeContainer);
      }),
      deprecationReason: this.deprecationReason,
      description: this.description,
    };
  }
}

type OutputFieldsMapValue<R extends OutputRealizedType, M extends ArgsMap> =
  | R
  | OutputFieldConstructorParams<R, M>;

type TypeInOutputMapValue<
  V extends OutputFieldsMapValue<OutputRealizedType, ArgsMap>
> = V extends OutputRealizedType
  ? V
  : V extends OutputFieldConstructorParams<OutputRealizedType, ArgsMap>
  ? V['type']
  : never;

type ArgsMapInOutputMapValue<
  V extends OutputFieldsMapValue<OutputRealizedType, ArgsMap>
> = V extends ArgsMap
  ? V
  : V extends OutputFieldConstructorParams<OutputRealizedType, ArgsMap>
  ? V['args']
  : never;

type OutputFieldConstructorParamsInOutputMapValue<
  V extends OutputFieldsMapValue<OutputRealizedType, ArgsMap>
> = OutputFieldConstructorParams<
  TypeInOutputMapValue<V>,
  ArgsMapInOutputMapValue<V>
>;

type OutputFieldsMap = StringKeys<
  Thunkable<OutputFieldsMapValue<OutputRealizedType, ArgsMap>>
>;

const toGraphQLFieldConfigMap = (params: {
  fields: OutputFieldsMap;
  typeContainer: AnyTypeContainer;
}): GraphQLFieldConfigMap<any, any> => {
  return mapValues(params.fields, (protoField) => {
    const unthunkedProtoField = unthunk(protoField);
    const field = toOutputField(unthunkedProtoField);
    return field.getGraphQLFieldConfig(params.typeContainer);
  });
};

type ObfuscatedOutputFieldsMap<M extends OutputFieldsMap> = {
  [K in keyof M]:
    | M[K]
    | Thunkable<
        | TypeInOutputMapValue<Unthunked<M[K]>>
        | OutputFieldConstructorParamsInOutputMapValue<Unthunked<M[K]>>
      >;
};

type TypeOfOutputFieldsMap<M extends OutputFieldsMap> = {
  [K in keyof M]: ExternalTypeOf<TypeInOutputMapValue<Unthunked<M[K]>>>;
};

interface IOutputObjectInternalTypeConstructorParams<
  N extends string,
  M extends OutputFieldsMap
> {
  name: N;
  fields: M;
  description?: string;
}

const toOutputField = <
  V extends OutputFieldsMapValue<OutputRealizedType, ArgsMap>
>(
  v: V,
): OutputField<TypeInOutputMapValue<V>, ArgsMapInOutputMapValue<V>> => {
  if (brandOf(v as any) == 'realizedtype') {
    return new OutputField({ type: v as any, args: {} as any });
  } else {
    return new OutputField(v as any);
  }
};

interface IOutputObjectInternalTypeConstructorParams<
  N extends string,
  M extends OutputFieldsMap
> {
  name: N;
  fields: M;
  description?: string;
}

class ObjectInternalType<
  N extends string,
  M extends OutputFieldsMap
> extends InternalType<N, TypeOfOutputFieldsMap<M>> {
  public readonly fields: M;
  public readonly description?: string;

  constructor(params: IOutputObjectInternalTypeConstructorParams<N, M>) {
    super(params);
    this.fields = params.fields;
    this.description = params.description;
  }

  protected getFreshInternalGraphQLType(
    typeContainer: AnyTypeContainer,
  ): GraphQLObjectType {
    return new GraphQLObjectType({
      name: this.name,
      description: this.description,
      interfaces: () => {
        const interfaces = typeContainer.getImplementedInterfaces(this);
        if (!interfaces.length) {
          return null;
        }
        return interfaces.map(
          (cur) => cur.getInternalGraphQLType(typeContainer) as any,
        );
      },
      fields: () =>
        toGraphQLFieldConfigMap({
          fields: this.fields,
          typeContainer,
        }),
    });
  }
}

type ObjectType<
  N extends string,
  M extends OutputFieldsMap,
  NULLABLE extends boolean = false
> = RealizedType<ObjectInternalType<N, ObfuscatedOutputFieldsMap<M>>, NULLABLE>;

const object = <N extends string, M extends OutputFieldsMap>(
  params: IOutputObjectInternalTypeConstructorParams<N, M>,
): ObjectType<N, M> => {
  const internalType: ObjectInternalType<
    N,
    ObfuscatedOutputFieldsMap<M>
  > = new ObjectInternalType(params);
  return new RealizedType({
    internalType,
    isNullable: false,
  });
};

type UserType = ObjectType<
  'User',
  {
    id: typeof ID;
    name: typeof String;
    self: UserType;
    selfArray: {
      type: ListType<UserType>;
      args: { a: typeof String }; // TODO: make args ommittable
    };
  }
>;

const UserType: UserType = object({
  name: 'User',
  fields: {
    id: () => ID,
    name: String,
    self: () => UserType,
    selfArray: () => ({
      type: list(UserType),
      args: { a: String },
    }),
  },
});

const Membership = enu({
  name: 'Membership',
  values: {
    free: null,
    paid: null,
    enterprise: null,
  },
});

type Unionable = ObjectType<string, OutputFieldsMap, boolean>;

type Unionables = Thunkable<[Unionable, Unionable, ...Array<Unionable>]>;
interface IUnionTypeConstructorParams<N extends string, U extends Unionables> {
  name: UnionInternalType<N, U>['name'];
  types: UnionInternalType<N, U>['types'];
  description?: UnionInternalType<N, U>['description'];
  resolveType: UnionInternalType<N, U>['resolveType'];
}

class UnionInternalType<
  N extends string,
  U extends Unionables
> extends InternalType<N, Unthunked<U>[number]> {
  public readonly types: U;
  public readonly description?: string;
  public readonly resolveType: (r: unknown) => Unthunked<U>[number]['name'];

  constructor(params: IUnionTypeConstructorParams<N, U>) {
    super(params);
    this.types = params.types;
    this.resolveType = params.resolveType;
  }

  protected getFreshInternalGraphQLType(
    typeContainer: AnyTypeContainer,
  ): GraphQLUnionType {
    const unthunkedTypes = unthunk(this.types);
    const types = unthunkedTypes.map((type) =>
      type.internalType.getInternalGraphQLType(typeContainer),
    );
    return new GraphQLUnionType({
      name: this.name,
      description: this.description,
      types: types as any,
      resolveType: this.resolveType as any,
    });
  }
}

// TODO: find a way to make sure no 2 conflicting types can be unioned. For example,
// an object with .id: ID and another with .id: String.

type UnionType<
  N extends string,
  U extends Unionables,
  NULLABLE extends boolean = false
> = RealizedType<UnionInternalType<N, U>, NULLABLE>;

const union = <N extends string, U extends Unionables>(
  params: IUnionTypeConstructorParams<N, U>,
): UnionType<N, U, false> => {
  const internalType = new UnionInternalType(params);
  return new RealizedType({
    internalType,
    isNullable: false,
  });
};

const AnimalType = object({
  name: 'Animal',
  fields: {
    id: ID,
    name: String,
  },
});

const BestFriend = union({
  name: 'BestFriend',
  types: [AnimalType, UserType],
  resolveType: (x) => {
    // TODO: write a better resolveType function that takes the rest of the params into consideration
    return 'Animal';
  },
});

interface IInterfaceInternalTypeConstructorParams<
  N extends string,
  M extends OutputFieldsMap,
  I extends Implementors<M>
> {
  name: N;
  fields: M;
  implementors: I;
  resolveType: InterfaceInternalType<N, M, I>['resolveType'];
  description?: string;
}

type Implements<M extends OutputFieldsMap> = ObjectType<
  any,
  ObfuscatedOutputFieldsMap<M>,
  boolean
>;

type Implementors<M extends OutputFieldsMap> = Thunkable<
  [Implements<M>, ...Array<Implements<M>>]
>;

class InterfaceInternalType<
  N extends string,
  M extends OutputFieldsMap,
  I extends Implementors<M>
> extends InternalType<N, TypeOfOutputFieldsMap<M>> {
  public readonly fields: M;
  public readonly implementors: I;
  public readonly description?: string;
  public readonly resolveType: (r: unknown) => Unthunked<I>[number]['name'];

  constructor(params: IInterfaceInternalTypeConstructorParams<N, M, I>) {
    super(params);
    this.fields = params.fields;
    this.implementors = params.implementors;
    this.description = params.description;
    this.resolveType = params.resolveType;
  }

  protected getFreshInternalGraphQLType(
    typeContainer: AnyTypeContainer,
  ): GraphQLType {
    // TODO: make it so that typeContainer registers all the interfaces first,
    // only then it should create the output object types along with their
    // interface fields. This would be done during the schema construction.

    return new GraphQLInterfaceType({
      name: this.name,
      description: this.description,
      resolveType: this.resolveType,
      fields: () =>
        toGraphQLFieldConfigMap({
          fields: this.fields,
          typeContainer,
        }),
    });
  }
}

type InterfaceType<
  N extends string,
  M extends OutputFieldsMap,
  I extends Implementors<M>,
  NULLABLE extends boolean = false
> = RealizedType<
  InterfaceInternalType<N, ObfuscatedOutputFieldsMap<M>, I>,
  NULLABLE
>;

// TODO: consolidate these function names and find a way to deal with the reserved keywords.
export const interfaceType = <
  N extends string,
  M extends OutputFieldsMap,
  I extends Implementors<M>
>(
  params: IInterfaceInternalTypeConstructorParams<N, M, I>,
): InterfaceType<N, M, I> => {
  const internalType = new InterfaceInternalType(params);
  return new RealizedType({
    internalType,
    isNullable: false,
  });
};

const idInterface = interfaceType({
  name: 'IdInterface',
  fields: {
    id: ID,
  },
  implementors: [UserType, AnimalType],
  resolveType: (x) => {
    return 'User' as const;
  },
});

const userInterface = interfaceType({
  name: 'UserInterface',
  fields: {
    self: UserType,
  },
  implementors: [UserType],
  resolveType: (...args) => {
    // TODO: RESOLVE TYPE RUNS BEFORE ANYTHING. UPDATE THE CODE ADAPT

    // TODO: find a way to let field resolvers and normal resolvers override the resolve type
    return 'User' as const;
  },
});

const nameInterface = interfaceType({
  name: 'NameInterface',
  fields: {
    name: String,
  },
  implementors: [UserType, AnimalType],
  resolveType: (x) => {
    return 'Animal' as const;
  },
});

const typeContainer = new TypeContainer({
  contextGetter: () => ({}),
});

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Root',
    fields: {
      id: {
        type: GraphQLID,
      },
      // TODO: the type container should understand what objects implement what interfaces
      // and expose them on the schema.
      idInterface: {
        type: idInterface.getGraphQLType(typeContainer) as any,
      },
      nameInterface: {
        type: nameInterface.getGraphQLType(typeContainer) as any,
        resolve: () => {
          return {
            name: 'kerem',
          };
        },
      },
      userInterface: {
        type: userInterface.getGraphQLType(typeContainer) as any,
        resolve: () => {
          return {
            id: 'kerem',
            get self() {
              return this;
            },
          };
        },
      },
      user: {
        type: UserType.getGraphQLType(typeContainer) as any,
      },
      animal: {
        type: AnimalType.getGraphQLType(typeContainer) as any,
      },
      bestFriend: {
        type: BestFriend.getGraphQLType(typeContainer) as any,
        resolve: () => {
          return {
            name: async () => {
              return 'keremkazan';
            },
            __typename: 'User',
            kerem: async () => {
              return 'kazan';
            },
            kazan: () => 'kerem',
          };
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

  app.listen({ port: PORT }, () => {
    console.log(
      `🚀 Server ready at http://localhost:${PORT}${apolloServer.graphqlPath}`,
    );
  });
};

start();
