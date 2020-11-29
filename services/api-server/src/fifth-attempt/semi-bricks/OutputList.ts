import { GraphQLList } from 'graphql';
import {
  Brick,
  NonNullableBrickOf,
  NullableBrickOf,
  SemiBrick,
} from '../Brick';
import { SemiBrickFactory } from '../SemiBrickFactory';
import { AnyOutputSemiBrick } from './OutputObject';
import { ListTypeOf } from './struct-types';

export class OutputListSemiBrick<
  SB extends AnyOutputSemiBrick
> extends SemiBrick<'outputlist', GraphQLList<any>, ListTypeOf<SB>> {
  public readonly kind = 'outputlist';
  public readonly listOf: SB;
  public readonly nonNullable: NonNullableBrickOf<OutputListSemiBrick<SB>>;
  public readonly nullable: NullableBrickOf<OutputListSemiBrick<SB>>;

  constructor(params: {
    name: string;
    semiBrickFactory: SemiBrickFactory;
    listOf: SB;
  }) {
    super(params);
    this.listOf = params.listOf;
    this.nonNullable = Brick.initNonNullable(this);
    this.nullable = Brick.initNullable(this);
  }

  public readonly getFreshSemiGraphQLType = (): GraphQLList<any> => {
    return new GraphQLList(this.listOf.getSemiGraphQLType());
  };
}
