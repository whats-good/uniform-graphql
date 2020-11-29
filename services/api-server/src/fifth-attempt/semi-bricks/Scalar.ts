import { GraphQLScalarType } from 'graphql';
import {
  SemiBrick,
  Brick,
  NullableBrickOf,
  NonNullableBrickOf,
} from '../Brick';
import { SemiBrickFactory } from '../SemiBrickFactory';

export class ScalarSemiBrick<SB_A> extends SemiBrick<
  'scalar',
  GraphQLScalarType,
  SB_A
> {
  public readonly kind = 'scalar' as const;
  public readonly semiGraphQLType: GraphQLScalarType;
  public readonly nullable: NullableBrickOf<ScalarSemiBrick<SB_A>>;
  public readonly nonNullable: NonNullableBrickOf<ScalarSemiBrick<SB_A>>;

  constructor(params: {
    semiBrickFactory: SemiBrickFactory;
    name: string;
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
