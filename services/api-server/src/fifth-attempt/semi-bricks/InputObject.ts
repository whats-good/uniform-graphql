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
  F extends InputFieldConfigMap
> extends SemiBrick<'inputobject', GraphQLInputObjectType, TMap<F>> {
  public readonly kind = 'inputobject' as const;
  public readonly fields: F;
  public readonly nullable: NullableBrickOf<InputObjectSemiBrick<F>>;
  public readonly nonNullable: NonNullableBrickOf<InputObjectSemiBrick<F>>;

  constructor(params: {
    semiBrickFactory: SemiBrickFactory;
    name: string;
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
