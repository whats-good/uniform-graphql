import { GraphQLInputObjectType } from 'graphql';
import _ from 'lodash';
import {
  Brick,
  SemiBrick,
  NullableBrickOf,
  NonNullableBrickOf,
} from '../Brick';
import { SemiBrickFactory } from '../SemiBrickFactory';
import { InputFieldConfigMap, TMap } from './struct-types';

export class InputObjectSemiBrick<
  F extends InputFieldConfigMap,
  N extends string
> extends SemiBrick<'inputobject', N, GraphQLInputObjectType, TMap<F>> {
  public readonly kind = 'inputobject' as const;
  public readonly fields: F;
  public readonly nullable: NullableBrickOf<InputObjectSemiBrick<F, N>>;
  public readonly nonNullable: NonNullableBrickOf<InputObjectSemiBrick<F, N>>;

  constructor(params: {
    semiBrickFactory: SemiBrickFactory;
    name: N;
    fields: F;
  }) {
    super(params);
    this.fields = params.fields;
    this.nullable = Brick.initNullable(this);
    this.nonNullable = Brick.initNonNullable(this);
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
