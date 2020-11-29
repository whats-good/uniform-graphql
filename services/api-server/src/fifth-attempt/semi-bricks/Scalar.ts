import * as t from 'io-ts';
import { GraphQLScalarType } from 'graphql';
import {
  SemiBrick,
  Brick,
  Codec,
  NullableBrickOf,
  NonNullableBrickOf,
} from '../Brick';
import { SemiBrickFactory } from '../SemiBrickFactory';

export class ScalarSemiBrick<SB_G extends GraphQLScalarType, SB_A, SB_O = SB_A>
  implements SemiBrick<'scalar', SB_G, SB_A, SB_O> {
  public readonly kind = 'scalar' as const;
  public readonly name: string;
  public readonly semiCodec: Codec<SB_A, SB_O>;
  public readonly semiGraphQLType: SB_G;
  public readonly nullable: NullableBrickOf<ScalarSemiBrick<SB_G, SB_A, SB_O>>;
  public readonly nonNullable: NonNullableBrickOf<
    ScalarSemiBrick<SB_G, SB_A, SB_O>
  >;

  constructor(
    public semiBrickFactory: SemiBrickFactory,
    params: {
      name: string;
      semiCodec: Codec<SB_A, SB_O>;
      semiGraphQLType: SB_G;
    },
  ) {
    this.name = params.name;
    this.semiCodec = params.semiCodec;
    this.semiGraphQLType = params.semiGraphQLType;
    this.nullable = Brick.initNullable(this);
    this.nonNullable = Brick.initNonNullable(this);
  }

  public readonly getSemiGraphQLType = (): SB_G => this.semiGraphQLType;
}
