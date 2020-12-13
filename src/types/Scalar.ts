import { GraphQLScalarType } from 'graphql';
import {
  SemiStaticGraphQLType,
  StaticGraphQLType,
  NullableStaticGraphQLTypeOf,
  NonNullableStaticGraphQLTypeOf,
} from '../StaticGraphQLType';
import { SemiStaticGraphQLTypeFactory } from '../SemiStaticGraphQLTypeFactory';

export class ScalarSemiStaticGraphQLType<
  SB_A,
  N extends string
> extends SemiStaticGraphQLType<'scalar', N, GraphQLScalarType, SB_A> {
  public readonly kind = 'scalar' as const;
  public readonly semiGraphQLType: GraphQLScalarType;
  public readonly nullable: NullableStaticGraphQLTypeOf<
    ScalarSemiStaticGraphQLType<SB_A, N>
  >;
  public readonly nonNullable: NonNullableStaticGraphQLTypeOf<
    ScalarSemiStaticGraphQLType<SB_A, N>
  >;

  constructor(params: {
    semiStaticGraphQLTypeFactory: SemiStaticGraphQLTypeFactory;
    name: N;
    semiGraphQLType: GraphQLScalarType;
  }) {
    super(params);
    this.semiGraphQLType = params.semiGraphQLType;
    this.nullable = StaticGraphQLType.initNullable(this);
    this.nonNullable = StaticGraphQLType.initNonNullable(this);
  }

  public readonly getFreshSemiGraphQLType = (): GraphQLScalarType =>
    this.semiGraphQLType;

  // TODO: enable developers to import existing scalars from third party libraries
  // TODO: enable developers to create their own scalars
  // static curried = <N extends string>(name: N) => <SB_A>(params: {
  //   semiStaticGraphQLTypeFactory: SemiStaticGraphQLTypeFactory;
  // }): ScalarSemiStaticGraphQLType<SB_A, N> => {
  //   return new ScalarSemiStaticGraphQLType({
  //     name,
  //     semiStaticGraphQLTypeFactory: params.semiStaticGraphQLTypeFactory,
  //     semiGraphQLType: new GraphQLScalarType({
  //       name,
  //     }),
  //   });
  // };
}
