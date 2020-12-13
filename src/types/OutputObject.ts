import { GraphQLObjectType } from 'graphql';
import {
  StaticGraphQLType,
  NonNullableStaticGraphQLTypeOf,
  NullableStaticGraphQLTypeOf,
} from '../StaticGraphQLType';
import { FieldResolversOf, OutputFieldMap } from '../OutputField';
import { TypeFactory } from '../SemiStaticGraphQLTypeFactory';
import { ImplementorSemiStaticGraphQLType } from './Implementor';
import { InterfaceSemiStaticGraphQLTypeMap } from './struct-types';

export class OutputObjectSemiStaticGraphQLType<
  F extends OutputFieldMap,
  N extends string
> extends ImplementorSemiStaticGraphQLType<
  'outputobject',
  N,
  GraphQLObjectType,
  F
> {
  public readonly kind = 'outputobject' as const;
  public readonly fields: F;
  public readonly flatInterfaces: InterfaceSemiStaticGraphQLTypeMap = {};

  public readonly nullable: NullableStaticGraphQLTypeOf<
    OutputObjectSemiStaticGraphQLType<F, N>
  >;
  public readonly nonNullable: NonNullableStaticGraphQLTypeOf<
    OutputObjectSemiStaticGraphQLType<F, N>
  >;

  constructor(params: { typeFactory: TypeFactory; name: N; fields: F }) {
    super(params);
    this.fields = params.fields;
    this.nullable = StaticGraphQLType.initNullable(this);
    this.nonNullable = StaticGraphQLType.initNonNullable(this);
  }

  public getFreshSemiGraphQLType = (): GraphQLObjectType => {
    return new GraphQLObjectType(this.getGraphQLTypeConstructor());
  };

  public fieldResolverize = (resolvers: Partial<FieldResolversOf<F>>): void => {
    // TODO: should this be a complete / stateless overwrite, or can it have history and state?
    // TODO: should we create new fields or mutate the existing ones?
    Object.entries(resolvers).forEach(([key, value]) => {
      this.fields[key].setResolve(value);
    });
  };
}
