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

  // TODO: enable developers to import existing scalars from third party libraries
  // TODO: enable developers to create their own scalars
  // static curried = <N extends string>(name: N) => <SB_A>(params: {
  //   semiBrickFactory: SemiBrickFactory;
  // }): ScalarSemiBrick<SB_A, N> => {
  //   return new ScalarSemiBrick({
  //     name,
  //     semiBrickFactory: params.semiBrickFactory,
  //     semiGraphQLType: new GraphQLScalarType({
  //       name,
  //     }),
  //   });
  // };
}
