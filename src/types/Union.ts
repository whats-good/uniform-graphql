import { GraphQLUnionType } from 'graphql';
import {
  StaticGraphQLType,
  NonNullableStaticGraphQLTypeOf,
  NullableStaticGraphQLTypeOf,
  SemiStaticGraphQLType,
  SemiTypeOf,
} from '../StaticGraphQLType';
import { SemiStaticGraphQLTypeFactory } from '../SemiStaticGraphQLTypeFactory';
import { AnyOutputObjectSemiStaticGraphQLType } from './struct-types';

export type UnitableSemiStaticGraphQLTypes = [
  AnyOutputObjectSemiStaticGraphQLType,
  AnyOutputObjectSemiStaticGraphQLType,
  ...Array<AnyOutputObjectSemiStaticGraphQLType>
];

type UtdTypes<T extends UnitableSemiStaticGraphQLTypes> = SemiTypeOf<T[number]>;

export class UnionSemiStaticGraphQLType<
  SBS extends UnitableSemiStaticGraphQLTypes,
  N extends string
> extends SemiStaticGraphQLType<
  'union',
  N,
  GraphQLUnionType,
  UtdTypes<SBS>,
  UtdTypes<SBS> & { __typename: SBS[number]['name'] }
> {
  public readonly kind = 'union' as const;
  public readonly semiStaticGraphQLTypes: SBS;

  public readonly nullable: NullableStaticGraphQLTypeOf<
    UnionSemiStaticGraphQLType<SBS, N>
  >;
  public readonly nonNullable: NonNullableStaticGraphQLTypeOf<
    UnionSemiStaticGraphQLType<SBS, N>
  >;

  public constructor(params: {
    semiStaticGraphQLTypeFactory: SemiStaticGraphQLTypeFactory;
    name: N;
    semiStaticGraphQLTypes: SBS;
  }) {
    super(params);
    this.semiStaticGraphQLTypes = params.semiStaticGraphQLTypes;

    this.nullable = StaticGraphQLType.initNullable(this);
    this.nonNullable = StaticGraphQLType.initNonNullable(this);
  }

  public readonly getFreshSemiGraphQLType = (): GraphQLUnionType => {
    return new GraphQLUnionType({
      name: this.name,
      types: this.semiStaticGraphQLTypes.map((sb) => sb.getSemiGraphQLType()),
    });
  };
}
