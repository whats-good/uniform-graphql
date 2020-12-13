import { GraphQLInputObjectType } from 'graphql';
import _ from 'lodash';
import {
  StaticGraphQLType,
  SemiStaticGraphQLType,
  NullableStaticGraphQLTypeOf,
  NonNullableStaticGraphQLTypeOf,
} from '../StaticGraphQLType';
import { SemiStaticGraphQLTypeFactory } from '../SemiStaticGraphQLTypeFactory';
import { InputFieldConfigMap, TMap } from './struct-types';

export class InputObjectSemiStaticGraphQLType<
  F extends InputFieldConfigMap,
  N extends string
> extends SemiStaticGraphQLType<
  'inputobject',
  N,
  GraphQLInputObjectType,
  TMap<F>
> {
  public readonly kind = 'inputobject' as const;
  public readonly fields: F;
  public readonly nullable: NullableStaticGraphQLTypeOf<
    InputObjectSemiStaticGraphQLType<F, N>
  >;
  public readonly nonNullable: NonNullableStaticGraphQLTypeOf<
    InputObjectSemiStaticGraphQLType<F, N>
  >;

  constructor(params: {
    semiStaticGraphQLTypeFactory: SemiStaticGraphQLTypeFactory;
    name: N;
    fields: F;
  }) {
    super(params);
    this.fields = params.fields;
    this.nullable = StaticGraphQLType.initNullable(this);
    this.nonNullable = StaticGraphQLType.initNonNullable(this);
  }

  public readonly getFreshSemiGraphQLType = (): GraphQLInputObjectType => {
    return new GraphQLInputObjectType({
      name: this.name,
      fields: _.mapValues(this.fields, (field) => ({
        type: field.brick.getGraphQLType(),
        deprecationReason: field.deprecationReason,
        description: field.description,
      })),
    });
  };
}
