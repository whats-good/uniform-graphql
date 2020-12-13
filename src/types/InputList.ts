import { GraphQLList } from 'graphql';
import { Type, NonNullableTypeOf, NullableTypeOf, SemiType } from '../Type';
import { TypeFactory } from '../TypeFactory';
import { AnyInputSemiType, ListTypeOf } from './struct-types';

// TODO: combine the input and output lists into one super class, and then specialize.
export class InputListSemiType<SB extends AnyInputSemiType> extends SemiType<
  'inputlist',
  string, // TODO: differentiate between named and non-named types so that you can avoid unnecessary generics
  GraphQLList<any>,
  ListTypeOf<SB>
> {
  public readonly kind = 'inputlist';
  public readonly listOf: SB;
  public readonly nonNullable: NonNullableTypeOf<InputListSemiType<SB>>;
  public readonly nullable: NullableTypeOf<InputListSemiType<SB>>;

  constructor(params: { typeFactory: TypeFactory; name: string; listOf: SB }) {
    super(params);
    this.listOf = params.listOf;
    this.nonNullable = Type.initNonNullable(this);
    this.nullable = Type.initNullable(this);
  }

  public readonly getFreshSemiGraphQLType = (): GraphQLList<any> => {
    return new GraphQLList(this.listOf.getSemiGraphQLType());
  };
}
