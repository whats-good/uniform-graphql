import { GraphQLType, GraphQLInterfaceType } from 'graphql';
import { Thunkable, Unthunked, Promisable } from '../../utils';
import { AnySchemaBuilder } from '../../SchemaBuilder';
import { InternalType, RealizedType } from '../core';
import { ObjectType } from './ObjectType';
import {
  OutputFieldsMap,
  ObfuscatedOutputFieldsMap,
  TypeOfOutputFieldsMap,
  toGraphQLFieldConfigMap,
  OutputFieldsMapResolveType,
} from './OutputFieldsMap';
import { ResolveTypeOf } from '../../Resolver';

type UnknownResolveTypeOfInterfaceInternalType<
  I extends InterfaceInternalType<any, any, any>
> = ResolveTypeOf<I['implementors'][number]>;

export type InternalResolveTypeOfInterfaceType<
  R extends InterfaceType<any, any, any, any>
> = OutputFieldsMapResolveType<R['internalType']['fields']>;

export interface InterfaceInternalTypeConstructorParams<
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

export type Implements<M extends OutputFieldsMap> = ObjectType<
  any,
  ObfuscatedOutputFieldsMap<M>,
  boolean
>;

type Implementors<M extends OutputFieldsMap> = Thunkable<
  [Implements<M>, ...Array<Implements<M>>]
>;

export class InterfaceInternalType<
  N extends string,
  M extends OutputFieldsMap,
  I extends Implementors<M>
> extends InternalType<N, TypeOfOutputFieldsMap<M>> {
  public readonly fields: M;
  public readonly implementors: I;
  public readonly description?: string;
  public readonly resolveType: (
    r: UnknownResolveTypeOfInterfaceInternalType<
      InterfaceInternalType<N, M, I>
    >,
  ) => Promisable<Unthunked<I>[number]['name']>;

  constructor(params: InterfaceInternalTypeConstructorParams<N, M, I>) {
    super(params);
    this.fields = params.fields;
    this.implementors = params.implementors;
    this.description = params.description;
    this.resolveType = params.resolveType;
  }

  protected getFreshInternalGraphQLType(
    schemaBuilder: AnySchemaBuilder,
  ): GraphQLType {
    return new GraphQLInterfaceType({
      name: this.name,
      description: this.description,
      resolveType: this.resolveType,
      fields: () =>
        toGraphQLFieldConfigMap({
          fields: this.fields,
          schemaBuilder,
        }),
    });
  }
}

export type InterfaceType<
  N extends string,
  M extends OutputFieldsMap,
  I extends Implementors<M>,
  NULLABLE extends boolean = false
> = RealizedType<
  InterfaceInternalType<N, ObfuscatedOutputFieldsMap<M>, I>,
  NULLABLE
>;

export const interfaceType = <
  N extends string,
  M extends OutputFieldsMap,
  I extends Implementors<M>
>(
  params: InterfaceInternalTypeConstructorParams<N, M, I>,
): InterfaceType<N, M, I> => {
  const internalType = new InterfaceInternalType(params);
  return new RealizedType({
    internalType,
    isNullable: false,
  });
};
