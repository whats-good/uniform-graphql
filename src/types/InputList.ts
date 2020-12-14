import { GraphQLList } from 'graphql';
import { Type, NonNullableTypeOf, NullableTypeOf, SemiType } from '../Type';
import { SemiTypeFactory } from '../SemiTypeFactory';
import { AnyInputSemiType, ListTypeOf } from './struct-types';

// TODO: combine the input and output lists into one super class, and then specialize.
export class InputListSemiType<ST extends AnyInputSemiType> extends SemiType<
  'inputlist',
  string, // TODO: differentiate between named and non-named types so that you can avoid unnecessary generics
  GraphQLList<any>,
  ListTypeOf<ST>
> {
  public readonly kind = 'inputlist';
  public readonly listOf: ST;
  public readonly nonNullable: NonNullableTypeOf<InputListSemiType<ST>>;
  public readonly nullable: NullableTypeOf<InputListSemiType<ST>>;

  constructor(params: {
    semiTypeFactory: SemiTypeFactory<any>;
    name: string;
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
