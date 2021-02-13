import { GraphQLUnionType } from 'graphql';
import { Thunkable, Unthunked, unthunk, Promisable } from '../../utils';
import { AnyTypeContainer } from '../../TypeContainer';
import { InternalType, RealizedType } from '../core';
import { ObjectType } from './ObjectType';
import { OutputFieldsMap } from './OutputFieldsMap';
import { ResolveTypeOf } from '../../Resolver';

type Unionable = ObjectType<string, OutputFieldsMap, boolean>;

type Unionables = Thunkable<[Unionable, Unionable, ...Array<Unionable>]>;
export interface IUnionTypeConstructorParams<
  N extends string,
  U extends Unionables
> {
  name: UnionInternalType<N, U>['name'];
  types: UnionInternalType<N, U>['types'];
  description?: UnionInternalType<N, U>['description'];
  resolveType: UnionInternalType<N, U>['resolveType'];
}

export type InternalResolveTypeOfUnionInternalType<
  I extends UnionInternalType<any, any>
> = ResolveTypeOf<I['types'][number]>;
export type InternalResolveTypeOfUnionType<
  R extends UnionType<any, any, any>
> = InternalResolveTypeOfUnionInternalType<R['internalType']>;

export class UnionInternalType<
  N extends string,
  U extends Unionables
> extends InternalType<N, Unthunked<U>[number]> {
  public readonly types: U;
  public readonly description?: string;
  public readonly resolveType: (
    r: InternalResolveTypeOfUnionInternalType<UnionInternalType<N, U>>,
  ) => Promisable<Unthunked<U>[number]['name']>;

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

export type UnionType<
  N extends string,
  U extends Unionables,
  NULLABLE extends boolean = false
> = RealizedType<UnionInternalType<N, U>, NULLABLE>;

export const union = <N extends string, U extends Unionables>(
  params: IUnionTypeConstructorParams<N, U>,
): UnionType<N, U, false> => {
  const internalType = new UnionInternalType(params);
  return new RealizedType({
    internalType,
    isNullable: false,
  });
};
