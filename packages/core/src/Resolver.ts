import { GraphQLFieldConfig, GraphQLResolveInfo } from 'graphql';
import { AnySchemaBuilder, GraphQLContext } from './SchemaBuilder';
import {
  OutputRealizedType,
  TypeRealization,
  ExternalTypeOf,
} from './types/core';
import { ArgsMap, TypeOfArgsMap } from './types/input/ArgsMap';
import { toInputField } from './types/input/InputField';
import { InternalResolveTypeOfListType, ListType } from './types/ListType';
import {
  InterfaceType,
  InternalResolveTypeOfInterfaceType,
} from './types/output/InterfaceType';
import {
  InternalResolveTypeOfObjectInternalType,
  InternalResolveTypeOfObjectType,
  ObjectInternalType,
  ObjectType,
} from './types/output/ObjectType';
import {
  TypeInOutputMapValue,
  ArgsMapInOutputMapValue,
} from './types/output/OutputFieldsMap';
import {
  InternalResolveTypeOfUnionType,
  UnionType,
} from './types/output/UnionType';
import { mapValues, Promisable, Unthunked } from './utils';

export type ResolveTypeOf<R extends OutputRealizedType> =
  //
  R extends ObjectType<any, any, any>
    ? TypeRealization<R, InternalResolveTypeOfObjectType<R>>
    : R extends ListType<any, any>
    ? TypeRealization<R, InternalResolveTypeOfListType<R>>
    : R extends UnionType<any, any, any>
    ? TypeRealization<R, InternalResolveTypeOfUnionType<R>>
    : R extends InterfaceType<any, any, any, any>
    ? TypeRealization<R, InternalResolveTypeOfInterfaceType<R>>
    : ExternalTypeOf<R>;

export type ResolverFn<
  R extends OutputRealizedType, // to be resolved
  S, // root / source
  A extends ArgsMap, // arguments
  C extends GraphQLContext // context
> = (
  source: S,
  args: TypeOfArgsMap<A>,
  context: C,
  info: GraphQLResolveInfo,
) => Promisable<
  R['isNullable'] extends true ? void | ResolveTypeOf<R> : ResolveTypeOf<R>
>;

// TODO: when we use deocrators, typechecking & code completion gets reversed.
// decorators wait for the original code to be typed correctly before wrapping the
// original code. however, what we want is the decorator to enforce its own
// expected types onto the methods. how do we do that while not having the end
// user constantly manually writing types?

// TODO: find a way to get the resolve functions to instantiate new resolver objects
// and pass them into the schema appropriately, without causing race conditions,
// running the queries in isolation from each other. This will probably happen through
// differently "Bound" resolvers where the meaning of "this" changes as set during
// the initial request. Do the same for field resolvers.

/**
 * TODO: when we describe the function inside the decorator,
 * we lose access to the object instance
 */

/**
 * TODO: how do we describe the queries without having the schemaBuilder?
 */

export interface QueryFieldConstructorParams<
  R extends OutputRealizedType,
  M extends ArgsMap,
  C extends GraphQLContext
> {
  type: R;
  args?: M;
  deprecationReason?: string;
  description?: string;
  resolve: ResolverFn<R, undefined, M, C>;
}

export class QueryField<
  R extends OutputRealizedType,
  M extends ArgsMap,
  C extends GraphQLContext
> {
  public readonly type: R;
  public readonly args?: M;
  public readonly resolve: ResolverFn<R, undefined, M, C>;
  public readonly deprecationReason?: string;
  public readonly description?: string;

  constructor(params: QueryFieldConstructorParams<R, M, C>) {
    this.type = params.type;
    this.args = params.args;
    this.deprecationReason = params.deprecationReason;
    this.description = params.description;
    this.resolve = params.resolve;
  }

  getGraphQLFieldConfig(
    schemaBuilder: AnySchemaBuilder,
  ): GraphQLFieldConfig<any, any, any> {
    return {
      type: this.type.getGraphQLType(schemaBuilder) as any,
      args: mapValues(this.args, (arg) => {
        const inputField = toInputField(arg);
        return inputField.getGraphQLInputFieldConfig(schemaBuilder);
      }),
      deprecationReason: this.deprecationReason,
      description: this.description,
      resolve: this.resolve,
    };
  }
}

export abstract class Resolver<C extends GraphQLContext> {
  public readonly graphQLContext!: C;

  public query<R extends OutputRealizedType, M extends ArgsMap>(
    query: QueryFieldConstructorParams<R, M, C>,
  ): QueryField<R, M, C> {
    return new QueryField(query);
  }
}

export type ResolverConstructor<C extends GraphQLContext> = {
  new (...args: any[]): Resolver<C>;
};

export type FieldResolversOf<
  I extends ObjectInternalType<any, any>,
  C extends GraphQLContext
> = {
  [K in keyof I['fields']]: ResolverFn<
    TypeInOutputMapValue<Unthunked<I['fields'][K]>>,
    InternalResolveTypeOfObjectInternalType<I>,
    ArgsMapInOutputMapValue<Unthunked<I['fields'][K]>>,
    C
  >;
};
