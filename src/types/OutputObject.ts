import { GraphQLObjectType } from 'graphql';
import { Type, NonNullableTypeOf, NullableTypeOf } from '../Type';
import { FieldResolversOf, OutputFieldMap } from '../OutputField';
import { SemiTypeFactory } from '../SemiTypeFactory';
import { ImplementorSemiType } from './Implementor';
import { InterfaceSemiTypeMap } from './struct-types';

export class OutputObjectSemiType<
  F extends OutputFieldMap,
  N extends string
> extends ImplementorSemiType<'outputobject', N, GraphQLObjectType, F> {
  public readonly kind = 'outputobject' as const;
  public readonly fields: F;
  public readonly flatInterfaces: InterfaceSemiTypeMap = {};

  public readonly nullable: NullableTypeOf<OutputObjectSemiType<F, N>>;
  public readonly nonNullable: NonNullableTypeOf<OutputObjectSemiType<F, N>>;

  constructor(params: {
    SemiTypeFactory: SemiTypeFactory;
    name: N;
    fields: F;
  }) {
    super(params);
    this.fields = params.fields;
    this.nullable = Type.initNullable(this);
    this.nonNullable = Type.initNonNullable(this);
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
