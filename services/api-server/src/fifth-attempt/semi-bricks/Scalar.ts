import { GraphQLScalarType } from 'graphql';
import {
  SemiBrick,
  Brick,
  NullableBrickOf,
  NonNullableBrickOf,
} from '../Brick';
import { SemiBrickFactory } from '../SemiBrickFactory';

export class ScalarSemiBrick<SB_A, N extends string> extends SemiBrick<
  'scalar',
  N,
  GraphQLScalarType,
  SB_A
> {
  public readonly kind = 'scalar' as const;
  public readonly semiGraphQLType: GraphQLScalarType;
  public readonly nullable: NullableBrickOf<ScalarSemiBrick<SB_A, N>>;
  public readonly nonNullable: NonNullableBrickOf<ScalarSemiBrick<SB_A, N>>;

  constructor(params: {
    semiBrickFactory: SemiBrickFactory;
    name: N;
    semiGraphQLType: GraphQLScalarType;
  }) {
    super(params);
    this.semiGraphQLType = params.semiGraphQLType;
    this.nullable = Brick.initNullable(this);
    this.nonNullable = Brick.initNonNullable(this);
  }

  public readonly getFreshSemiGraphQLType = (): GraphQLScalarType =>
    this.semiGraphQLType;
}
