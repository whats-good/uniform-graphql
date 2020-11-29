import { GraphQLList } from 'graphql';
import {
  AnySemiBrick,
  Brick,
  NonNullableBrickOf,
  NullableBrickOf,
  SemiBrick,
} from '../Brick';
import { SemiBrickFactory } from '../SemiBrickFactory';
import { AnyInputSemiBrick } from './InputObject';

type ListTypeOf<SB extends AnySemiBrick> = Array<SB['semiCodec']['_A']>;

// TODO: combine the input and output lists into one super class, and then specialize.
export class InputListSemiBrick<SB extends AnyInputSemiBrick> extends SemiBrick<
  'inputlist',
  GraphQLList<any>,
  ListTypeOf<SB>
> {
  public readonly kind = 'inputlist';
  public readonly listOf: SB;
  public readonly nonNullable: NonNullableBrickOf<InputListSemiBrick<SB>>;
  public readonly nullable: NullableBrickOf<InputListSemiBrick<SB>>;

  constructor(params: {
    semiBrickFactory: SemiBrickFactory;
    name: string;
    semiCodec: InputListSemiBrick<SB>['semiCodec'];
    listOf: SB;
  }) {
    super(params);
    this.listOf = params.listOf;
    this.nonNullable = Brick.initNonNullable(this);
    this.nullable = Brick.initNullable(this);
  }

  public readonly getSemiGraphQLType = (): GraphQLList<any> => {
    return new GraphQLList(this.listOf.getSemiGraphQLType());
  };
}
