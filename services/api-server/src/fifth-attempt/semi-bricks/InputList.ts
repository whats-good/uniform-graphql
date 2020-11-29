import { GraphQLList } from 'graphql';
import * as t from 'io-ts';
import {
  AnySemiBrick,
  Brick,
  Codec,
  NonNullableBrickOf,
  NullableBrickOf,
  SemiBrick,
} from '../Brick';
import { SemiBrickFactory } from '../SemiBrickFactory';
import { AnyInputSemiBrick } from './InputObject';

type ListTypeOf<SB extends AnySemiBrick> = Array<SB['semiCodec']['_A']>;

// TODO: combine the input and output lists into one super class, and then specialize.
export class InputListSemiBrick<SB extends AnyInputSemiBrick>
  implements SemiBrick<'inputlist', GraphQLList<any>, ListTypeOf<SB>> {
  public readonly kind = 'inputlist';
  public readonly name: string;
  public readonly semiCodec: Codec<ListTypeOf<SB>>;
  public readonly listOf: SB;
  public readonly nonNullable: NonNullableBrickOf<InputListSemiBrick<SB>>;
  public readonly nullable: NullableBrickOf<InputListSemiBrick<SB>>;

  constructor(
    public semiBrickFactory: SemiBrickFactory,
    params: {
      name: string;
      semiCodec: InputListSemiBrick<SB>['semiCodec'];
      listOf: SB;
    },
  ) {
    this.name = params.name;
    this.semiCodec = params.semiCodec;
    this.listOf = params.listOf;
    this.nonNullable = Brick.initNonNullable(this);
    this.nullable = Brick.initNullable(this);
  }

  public readonly getSemiGraphQLType = (): GraphQLList<any> => {
    return new GraphQLList(this.listOf.getSemiGraphQLType());
  };
}
