import { GraphQLScalarType } from 'graphql';
import { SemiType, Type, NullableTypeOf, NonNullableTypeOf } from '../Type';
import { TypeFactory } from '../TypeFactory';

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
    typeFactory: TypeFactory;
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
  //   typeFactory: TypeFactory;
  // }): ScalarSemiType<SB_A, N> => {
  //   return new ScalarSemiType({
  //     name,
  //     typeFactory: params.typeFactory,
  //     semiGraphQLType: new GraphQLScalarType({
  //       name,
  //     }),
  //   });
  // };
}
