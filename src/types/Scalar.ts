import { GraphQLScalarType } from 'graphql';
import { SemiType, Type, NullableTypeOf, NonNullableTypeOf } from '../Type';
import { SemiTypeFactory } from '../SemiTypeFactory';

export class ScalarSemiType<SB_A, N extends string> extends SemiType<
  'scalar',
  N,
  GraphQLScalarType,
  SB_A
> {
  public readonly kind = 'scalar' as const;
  public readonly semiGraphQLType: GraphQLScalarType;
  public readonly nullable: NullableTypeOf<ScalarSemiType<SB_A, N>>;
  public readonly nonNullable: NonNullableTypeOf<ScalarSemiType<SB_A, N>>;

  constructor(params: {
    SemiTypeFactory: SemiTypeFactory;
    name: N;
    semiGraphQLType: GraphQLScalarType;
  }) {
    super(params);
    this.semiGraphQLType = params.semiGraphQLType;
    this.nullable = Type.initNullable(this);
    this.nonNullable = Type.initNonNullable(this);
  }

  public readonly getFreshSemiGraphQLType = (): GraphQLScalarType =>
    this.semiGraphQLType;

  // TODO: enable developers to import existing scalars from third party libraries
  // TODO: enable developers to create their own scalars
  // static curried = <N extends string>(name: N) => <SB_A>(params: {
  //   SemiTypeFactory: SemiTypeFactory;
  // }): ScalarSemiType<SB_A, N> => {
  //   return new ScalarSemiType({
  //     name,
  //     SemiTypeFactory: params.SemiTypeFactory,
  //     semiGraphQLType: new GraphQLScalarType({
  //       name,
  //     }),
  //   });
  // };
}
