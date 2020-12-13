import { GraphQLList } from 'graphql';
import {
  StaticGraphQLType,
  NonNullableStaticGraphQLTypeOf,
  NullableStaticGraphQLTypeOf,
  SemiStaticGraphQLType,
} from '../StaticGraphQLType';
import { TypeFactory } from '../SemiStaticGraphQLTypeFactory';
import { AnyInputSemiStaticGraphQLType, ListTypeOf } from './struct-types';

// TODO: combine the input and output lists into one super class, and then specialize.
export class InputListSemiStaticGraphQLType<
  SB extends AnyInputSemiStaticGraphQLType
> extends SemiStaticGraphQLType<
  'inputlist',
  string, // TODO: differentiate between named and non-named types so that you can avoid unnecessary generics
  GraphQLList<any>,
  ListTypeOf<SB>
> {
  public readonly kind = 'inputlist';
  public readonly listOf: SB;
  public readonly nonNullable: NonNullableStaticGraphQLTypeOf<
    InputListSemiStaticGraphQLType<SB>
  >;
  public readonly nullable: NullableStaticGraphQLTypeOf<
    InputListSemiStaticGraphQLType<SB>
  >;

  constructor(params: { typeFactory: TypeFactory; name: string; listOf: SB }) {
    super(params);
    this.listOf = params.listOf;
    this.nonNullable = StaticGraphQLType.initNonNullable(this);
    this.nullable = StaticGraphQLType.initNullable(this);
  }

  public readonly getFreshSemiGraphQLType = (): GraphQLList<any> => {
    return new GraphQLList(this.listOf.getSemiGraphQLType());
  };
}
