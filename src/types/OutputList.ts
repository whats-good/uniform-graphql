import { GraphQLList } from 'graphql';
import { Type, NonNullableTypeOf, NullableTypeOf, SemiType } from '../Type';
import { SemiTypeFactory } from '../SemiTypeFactory';
import { AnyOutputSemiType, ListTypeOf } from './struct-types';

export class OutputListSemiType<SB extends AnyOutputSemiType> extends SemiType<
  'outputlist',
  string,
  GraphQLList<any>,
  ListTypeOf<SB>
> {
  public readonly kind = 'outputlist';
  public readonly listOf: SB;
  public readonly nonNullable: NonNullableTypeOf<OutputListSemiType<SB>>;
  public readonly nullable: NullableTypeOf<OutputListSemiType<SB>>;

  constructor(params: {
    name: string;
    SemiTypeFactory: SemiTypeFactory;
    listOf: SB;
  }) {
    super(params);
    this.listOf = params.listOf;
    this.nonNullable = Type.initNonNullable(this);
    this.nullable = Type.initNullable(this);
  }

  public readonly getFreshSemiGraphQLType = (): GraphQLList<any> => {
    return new GraphQLList(this.listOf.getSemiGraphQLType());
  };
}
