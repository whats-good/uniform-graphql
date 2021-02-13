import { GraphQLType, GraphQLInterfaceType } from 'graphql';
import { Thunkable, Unthunked } from '../../utils';
import { AnyTypeContainer } from '../../TypeContainer';
import { InternalType, RealizedType } from '../core';
import { ObjectType } from './ObjectType';
import {
  OutputFieldsMap,
  ObfuscatedOutputFieldsMap,
  TypeOfOutputFieldsMap,
  toGraphQLFieldConfigMap,
} from './OutputFieldsMap';
import { ResolveTypeOf } from '../../Resolver';

type InternalResolveTypeOfInterfaceInternalType<
  I extends InterfaceInternalType<any, any, any>
> = ResolveTypeOf<I['implementors'][number]>;
export type InternalResolveTypeOfInterfaceType<
  R extends InterfaceType<any, any, any, any>
> = InternalResolveTypeOfInterfaceInternalType<R['internalType']>;

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
    r: InternalResolveTypeOfInterfaceInternalType<
      InterfaceInternalType<N, M, I>
    >,
  ) => Unthunked<I>[number]['name'];

  constructor(params: InterfaceInternalTypeConstructorParams<N, M, I>) {
    super(params);
    this.fields = params.fields;
    this.implementors = params.implementors;
    this.description = params.description;
    this.resolveType = params.resolveType;
  }

  protected getFreshInternalGraphQLType(
    typeContainer: AnyTypeContainer,
  ): GraphQLType {
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
