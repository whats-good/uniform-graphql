import { GraphQLObjectType } from 'graphql';
import { Type, NonNullableTypeOf, NullableTypeOf } from '../Type';
import { OutputFieldMap } from '../OutputField';
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
    semiTypeFactory: SemiTypeFactory<any>;
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
}
