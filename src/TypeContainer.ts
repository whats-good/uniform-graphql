import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLType,
} from 'graphql';
import { Maybe, StringKeys, unthunk } from './utils';
import mapValues from 'lodash/mapValues';
import { forEach } from 'lodash';
import {
  FieldResolversOf,
  QueryField,
  QueryFieldConstructorParams,
  ResolverFn,
} from './Resolver';
import { ObjectType } from './types';
import { AnyType, OutputRealizedType } from './types/core';
import { ArgsMap } from './types/input/ArgsMap';
import {
  Implements,
  InterfaceInternalType,
} from './types/output/InterfaceType';
import { ObjectInternalType } from './types/output/ObjectType';

type ContextGetter<C extends GraphQLContext> = () => C;

export type AnyTypeContainer = TypeContainer<any>;
export type GraphQLContext = StringKeys<unknown>;

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
  private readonly queries: StringKeys<QueryField<any, any, C>> = {};
  private readonly fieldResolvers: StringKeys<
    ResolverFn<any, any, any, C>
  > = {};
  private readonly mutations: StringKeys<QueryField<any, any, C>> = {};

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

  public getFieldResolver(
    typeName: string,
    fieldName: string,
  ): Maybe<ResolverFn<any, any, any, C>> {
    const resolverKey = this.getFieldResolverKey(typeName, fieldName);
    return this.fieldResolvers[resolverKey];
  }

  public addQuery<R extends OutputRealizedType, M extends ArgsMap>(
    name: string,
    query: QueryFieldConstructorParams<R, M, C>,
  ): void {
    const queryField = new QueryField(query);
    this.queries[name] = queryField;
  }

  private getFieldResolverKey(typeName: string, fieldName: string) {
    return `${typeName}:-:${fieldName}`;
  }

  public addFieldResolvers<R extends ObjectType<any, any>>(
    type: R,
    resolvers: Partial<FieldResolversOf<R['internalType'], C>>,
  ): void {
    forEach(resolvers, (resolver, fieldName) => {
      if (resolver) {
        const resolverKey = this.getFieldResolverKey(type.name, fieldName);
        this.fieldResolvers[resolverKey] = resolver as ResolverFn<
          any,
          any,
          any,
          any
        >;
      }
    });
    this.fieldResolvers[type.name];
  }

  public addMutation<R extends OutputRealizedType, M extends ArgsMap>(
    name: string,
    query: QueryFieldConstructorParams<R, M, C>,
  ): void {
    const queryField = new QueryField(query);
    this.mutations[name] = queryField;
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

  public getSchema(): GraphQLSchema {
    const query = new GraphQLObjectType({
      name: 'Query',
      fields: mapValues(this.queries, (field) =>
        field.getGraphQLFieldConfig(this),
      ),
    });

    const mutationFields = mapValues(this.mutations, (field) =>
      field.getGraphQLFieldConfig(this),
    );

    const mutation = new GraphQLObjectType({
      name: 'Mutation',
      fields: () => {
        return mutationFields;
      },
    });

    return new GraphQLSchema({
      query,
      mutation: Object.values(mutationFields).length ? mutation : null,
    });
  }
}
