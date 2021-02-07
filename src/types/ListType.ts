import { GraphQLList } from 'graphql';
import { ResolveTypeOf } from '../Resolver';
import { AnyTypeContainer } from '../TypeContainer';
import {
  ExternalTypeOf,
  InputRealizedType,
  InternalType,
  OutputRealizedType,
  RealizedType,
} from './core';

export type InternalResolveTypeOfListType<R extends ListType<any, any>> = Array<
  ResolveTypeOf<R['internalType']['type']>
>;

export class ListInternalType<
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

export type ListType<
  T extends OutputRealizedType,
  NULLABLE extends boolean = false
> = RealizedType<ListInternalType<T>, NULLABLE>;

export type InputListType<
  T extends InputRealizedType,
  NULLABLE extends boolean = false
> = RealizedType<ListInternalType<T>, NULLABLE>;

export const list = <T extends OutputRealizedType>(
  type: T,
): ListType<T, false> => {
  return __list(type);
};

export const inputList = <T extends InputRealizedType>(
  type: T,
): InputListType<T, false> => {
  return __list(type);
};
