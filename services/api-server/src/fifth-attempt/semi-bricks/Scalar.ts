import { GraphQLScalarType } from 'graphql';
import {
  SemiBrick,
  Brick,
  Codec,
  NullableBrickOf,
  NonNullableBrickOf,
} from '../Brick';
import { SemiBrickFactory } from '../SemiBrickFactory';

export class ScalarSemiBrick<
  SB_G extends GraphQLScalarType,
  SB_A,
  SB_O = SB_A
> extends SemiBrick<'scalar', SB_G, SB_A, SB_O> {
  public readonly kind = 'scalar' as const;
  public readonly semiGraphQLType: SB_G;
  public readonly nullable: NullableBrickOf<ScalarSemiBrick<SB_G, SB_A, SB_O>>;
  public readonly nonNullable: NonNullableBrickOf<
    ScalarSemiBrick<SB_G, SB_A, SB_O>
  >;

  constructor(params: {
    semiBrickFactory: SemiBrickFactory;
    name: string;
    semiCodec: Codec<SB_A, SB_O>;
    semiGraphQLType: SB_G;
  }) {
    super(params);
    this.semiGraphQLType = params.semiGraphQLType;
    this.nullable = Brick.initNullable(this);
    this.nonNullable = Brick.initNonNullable(this);
  }

  public readonly getFreshSemiGraphQLType = (): SB_G => this.semiGraphQLType;
}
