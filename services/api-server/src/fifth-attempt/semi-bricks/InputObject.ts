import { GraphQLInputObjectType } from 'graphql';
import _ from 'lodash';
import {
  Brick,
  SemiBrick,
  AnyBrick,
  Codec,
  NullableBrickOf,
  NonNullableBrickOf,
  AnySemiBrick,
} from '../Brick';
import { SemiBrickFactory } from '../SemiBrickFactory';

interface InputFieldConfig {
  brick: AnyInputBrick;
  description?: string;
  deprecationReason?: string;
  // defaultValue?: any; // TODO: implement
}

export interface InputFieldConfigMap {
  [key: string]: InputFieldConfig;
}

type InputKind = 'scalar' | 'enum' | 'inputlist' | 'inputobject';
export type AnyInputBrick = AnyBrick<InputKind>;
export type AnyInputSemiBrick = AnySemiBrick<InputKind>;

type TMap<F extends InputFieldConfigMap> = {
  [K in keyof F]: F[K]['brick']['codec']['_A'];
};

type OMap<F extends InputFieldConfigMap> = {
  [K in keyof F]: F[K]['brick']['codec']['_O'];
};

export class InputObjectSemiBrick<
  F extends InputFieldConfigMap
> extends SemiBrick<'inputobject', GraphQLInputObjectType, TMap<F>, OMap<F>> {
  public readonly kind = 'inputobject' as const;
  public readonly fields: F;
  public readonly nullable: NullableBrickOf<InputObjectSemiBrick<F>>;
  public readonly nonNullable: NonNullableBrickOf<InputObjectSemiBrick<F>>;

  constructor(params: {
    semiBrickFactory: SemiBrickFactory;
    name: string;
    semiCodec: Codec<TMap<F>, OMap<F>>;
    fields: F;
  }) {
    super(params);
    this.fields = params.fields;
    this.nullable = Brick.initNullable(this);
    this.nonNullable = Brick.initNonNullable(this);
  }

  public readonly getSemiGraphQLType = (): GraphQLInputObjectType => {
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
