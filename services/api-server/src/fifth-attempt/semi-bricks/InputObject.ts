import { GraphQLID, GraphQLInputObjectType, GraphQLString } from 'graphql';
import _ from 'lodash';
import * as t from 'io-ts';
import {
  Brick,
  SemiBrick,
  AnySemiBrick,
  AnyBrick,
  Codec,
  NullableBrickOf,
  NonNullableBrickOf,
} from '../Brick';
import { scalars } from './Scalar';

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
type AnyInputBrick = AnyBrick<InputKind>;

type InputObjectCodecsMapFromConfigsMap<F extends InputFieldConfigMap> = {
  [K in keyof F]: F[K]['brick']['codec'];
};

type TMap<F extends InputFieldConfigMap> = {
  [K in keyof F]: F[K]['brick']['codec']['_A'];
};

type OMap<F extends InputFieldConfigMap> = {
  [K in keyof F]: F[K]['brick']['codec']['_O'];
};

// TODO: is there a way to tie SB_A to the fields?
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

  constructor(params: {
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
    const codecs: InputObjectCodecsMapFromConfigsMap<F> = _.mapValues(
      params.fields,
      (field) => field.brick.codec,
    );
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
