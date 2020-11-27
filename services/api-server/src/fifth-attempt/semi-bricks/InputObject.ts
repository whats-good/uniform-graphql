import { GraphQLInputObjectType } from 'graphql';
import _ from 'lodash';
import * as t from 'io-ts';
import {
  Brick,
  SemiBrick,
  AnyBrick,
  Codec,
  NullableBrickOf,
  NonNullableBrickOf,
  AnySemiBrick,
} from '../Brick';

interface InputFieldConfig {
  brick: AnyInputBrick;
  description?: string;
  deprecationReason?: string;
  // defaultValue?: any; // TODO: implement
}

interface InputFieldConfigMap {
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

export class InputObjectSemiBrick<F extends InputFieldConfigMap>
  implements
    SemiBrick<'inputobject', GraphQLInputObjectType, TMap<F>, OMap<F>> {
  public readonly kind = 'inputobject' as const;
  public readonly name: string;
  public readonly semiCodec: Codec<TMap<F>, OMap<F>>;
  public readonly semiGraphQLType: GraphQLInputObjectType;
  public readonly fields: F;
  public readonly nullable: NullableBrickOf<InputObjectSemiBrick<F>>;
  public readonly nonNullable: NonNullableBrickOf<InputObjectSemiBrick<F>>;

  private constructor(params: {
    name: string;
    semiCodec: Codec<TMap<F>, OMap<F>>;
    semiGraphQLType: GraphQLInputObjectType;
    fields: F;
  }) {
    this.name = params.name;
    this.semiCodec = params.semiCodec;
    this.semiGraphQLType = params.semiGraphQLType;
    this.nullable = Brick.initNullable(this);
    this.nonNullable = Brick.initNonNullable(this);
    this.fields = params.fields;
  }

  public static init<F extends InputFieldConfigMap>(params: {
    name: string;
    fields: F;
  }): InputObjectSemiBrick<F> {
    const codecs = _.mapValues(params.fields, (field) => field.brick.codec);
    const semiGraphQLType = new GraphQLInputObjectType({
      name: params.name,
      fields: _.mapValues(params.fields, (field) => ({
        type: field.brick.graphQLType,
        deprecationReason: field.deprecationReason,
        description: field.description,
      })),
    });
    return new InputObjectSemiBrick({
      name: params.name,
      fields: params.fields,
      semiCodec: t.type(codecs),
      semiGraphQLType,
    });
  }
}
