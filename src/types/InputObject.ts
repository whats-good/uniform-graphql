import { GraphQLInputObjectType } from 'graphql';
import _ from 'lodash';
import { Type, SemiType, NullableTypeOf, NonNullableTypeOf } from '../Type';
import { TypeFactory } from '../TypeFactory';
import { InputFieldConfigMap, TMap } from './struct-types';

export class InputObjectSemiType<
  F extends InputFieldConfigMap,
  N extends string
> extends SemiType<'inputobject', N, GraphQLInputObjectType, TMap<F>> {
  public readonly kind = 'inputobject' as const;
  public readonly fields: F;
  public readonly nullable: NullableTypeOf<InputObjectSemiType<F, N>>;
  public readonly nonNullable: NonNullableTypeOf<InputObjectSemiType<F, N>>;

  constructor(params: { typeFactory: TypeFactory; name: N; fields: F }) {
    super(params);
    this.fields = params.fields;
    this.nullable = Type.initNullable(this);
    this.nonNullable = Type.initNonNullable(this);
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
