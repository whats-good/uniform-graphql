import { GraphQLList } from 'graphql';
import {
  StaticGraphQLType,
  NonNullableStaticGraphQLTypeOf,
  NullableStaticGraphQLTypeOf,
  SemiStaticGraphQLType,
} from '../StaticGraphQLType';
import { SemiStaticGraphQLTypeFactory } from '../SemiStaticGraphQLTypeFactory';
import { AnyOutputSemiStaticGraphQLType, ListTypeOf } from './struct-types';

export class OutputListSemiStaticGraphQLType<
  SB extends AnyOutputSemiStaticGraphQLType
> extends SemiStaticGraphQLType<
  'outputlist',
  string,
  GraphQLList<any>,
  ListTypeOf<SB>
> {
  public readonly kind = 'outputlist';
  public readonly listOf: SB;
  public readonly nonNullable: NonNullableStaticGraphQLTypeOf<
    OutputListSemiStaticGraphQLType<SB>
  >;
  public readonly nullable: NullableStaticGraphQLTypeOf<
    OutputListSemiStaticGraphQLType<SB>
  >;

  constructor(params: {
    name: string;
    semiStaticGraphQLTypeFactory: SemiStaticGraphQLTypeFactory;
    listOf: SB;
  }) {
    super(params);
    this.listOf = params.listOf;
    this.nonNullable = StaticGraphQLType.initNonNullable(this);
    this.nullable = StaticGraphQLType.initNullable(this);
  }

  public readonly getFreshSemiGraphQLType = (): GraphQLList<any> => {
    return new GraphQLList(this.listOf.getSemiGraphQLType());
  };
}
