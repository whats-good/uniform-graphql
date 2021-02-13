import { GraphQLList } from 'graphql';
import { ResolveTypeOf } from '../Resolver';
import { AnyTypeContainer } from '../TypeContainer';
import { ExternalTypeOf, InternalType, RealizedType } from './core';

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

export type ListType<
  T extends RealizedType<any, any>,
  NULLABLE extends boolean = false
> = RealizedType<ListInternalType<T>, NULLABLE>;

export const list = <T extends RealizedType<any, any>>(
  type: T,
): ListType<T, false> => {
  const internalType = new ListInternalType({
    type,
  });
  return new RealizedType({
    internalType,
    isNullable: false,
  });
};
