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
import { AnyOutputSemiBrick } from './OutputObject';

type ListTypeOf<SB extends AnySemiBrick> = Array<SB['semiCodec']['_A']>;

export class OutputListSemiBrick<SB extends AnyOutputSemiBrick>
  implements SemiBrick<'outputlist', GraphQLList<any>, ListTypeOf<SB>> {
  public readonly kind = 'outputlist';
  public readonly name: string;
  public readonly semiCodec: Codec<ListTypeOf<SB>>;
  public readonly listOf: SB;
  public readonly nonNullable: NonNullableBrickOf<OutputListSemiBrick<SB>>;
  public readonly nullable: NullableBrickOf<OutputListSemiBrick<SB>>;

  private constructor(
    public semiBrickFactory: SemiBrickFactory,
    params: {
      name: string;
      semiCodec: OutputListSemiBrick<SB>['semiCodec'];
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

  public static init = (semiBrickFactory: SemiBrickFactory) => <
    SB extends AnyOutputSemiBrick
  >(params: {
    listOf: SB;
  }): OutputListSemiBrick<SB> => {
    return new OutputListSemiBrick(semiBrickFactory, {
      name: `OutputListOf<${params.listOf.name}>`,
      listOf: params.listOf,
      semiCodec: t.array(params.listOf.semiCodec),
    });
  };
}
