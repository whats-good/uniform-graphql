import { GraphQLList } from 'graphql';
import { Type, NonNullableTypeOf, NullableTypeOf, SemiType } from '../Type';
import { SemiTypeFactory } from '../SemiTypeFactory';
import { AnyOutputSemiType, ListTypeOf } from './struct-types';

export class OutputListSemiType<ST extends AnyOutputSemiType> extends SemiType<
  'outputlist',
  string,
  GraphQLList<any>,
  ListTypeOf<ST>
> {
  public readonly kind = 'outputlist';
  public readonly listOf: ST;
  public readonly nonNullable: NonNullableTypeOf<OutputListSemiType<ST>>;
  public readonly nullable: NullableTypeOf<OutputListSemiType<ST>>;

  constructor(params: {
    name: string;
    semiTypeFactory: SemiTypeFactory<any>;
    listOf: ST;
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
