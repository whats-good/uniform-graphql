import { GraphQLType, GraphQLNonNull } from 'graphql';
import { TypeContainer } from '../TypeContainer';
import { ScalarInternalType } from './ScalarType';
import { EnumInternalType } from './EnumType';
import { InputObjectInternalType } from './input/InputObjectType';
import { ObjectInternalType } from './output/ObjectType';
import { InterfaceInternalType } from './output/InterfaceType';
import { UnionInternalType } from './output/UnionType';
import { ListInternalType } from './ListType';
import { Maybe } from '../utils';

export type AnyType = InternalType<any, any>;

type AnyTypeContainer = TypeContainer<any>;
export abstract class InternalType<N extends string, I> {
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

export class RealizedType<T extends AnyType, N extends boolean> {
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

export type OutputRealizedType = RealizedType<OutputInternalType, any>;
export type InputRealizedType = RealizedType<InputInternalType, any>;

export type ExternalTypeOf<R extends RealizedType<any, any>> = TypeRealization<
  R,
  R['internalType']['__INTERNAL_TYPE__']
>;

export type TypeRealization<
  R extends OutputRealizedType,
  T
> = R['isNullable'] extends true ? Maybe<T> : T;
