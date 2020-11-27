import { GraphQLObjectType } from 'graphql';
import * as t from 'io-ts';
import _ from 'lodash';
import {
  AnyBrick,
  Brick,
  Codec,
  NonNullableBrickOf,
  NullableBrickOf,
  SemiBrick,
} from '../Brick';
import { AnyInputBrick } from './InputObject';

export interface ArgumentConfig {
  brick: AnyInputBrick;
  description?: string;
  deprecationReason?: string;
  // defaultValue?: any; // TODO: implement
}
export interface OutputFieldConfigArgumentMap {
  [key: string]: ArgumentConfig;
}

type OutputKind =
  | 'scalar'
  | 'enum'
  | 'union'
  | 'outputobject'
  | 'interface'
  | 'outputlist';

export type AnyOutputBrick = AnyBrick<OutputKind>;

// TODO: add context stuff later
// TODO: maybe this should become a class
export interface OutputFieldConfig<AF extends OutputFieldConfigArgumentMap> {
  brick: AnyOutputBrick;
  description?: string;
  deprecationReason?: string;
  // args?: AF;
}

export interface OutputFieldConfigMap {
  [key: string]: OutputFieldConfig<any>;
}

type TMap<F extends OutputFieldConfigMap> = {
  [K in keyof F]: F[K]['brick']['codec']['_A'];
};

type OMap<F extends OutputFieldConfigMap> = {
  [K in keyof F]: F[K]['brick']['codec']['_O'];
};

export class OutputObjectSemiBrick<F extends OutputFieldConfigMap>
  implements SemiBrick<'outputobject', GraphQLObjectType, TMap<F>, OMap<F>> {
  public readonly kind = 'outputobject' as const;
  public readonly name: string;
  public readonly semiCodec: Codec<TMap<F>, OMap<F>>;
  public readonly semiGraphQLType: GraphQLObjectType;
  public readonly fields: F;
  public readonly nullable: NullableBrickOf<OutputObjectSemiBrick<F>>;
  public readonly nonNullable: NonNullableBrickOf<OutputObjectSemiBrick<F>>;

  private constructor(params: {
    name: string;
    semiCodec: Codec<TMap<F>, OMap<F>>;
    semiGraphQLType: GraphQLObjectType;
    fields: F;
  }) {
    this.name = params.name;
    this.semiCodec = params.semiCodec;
    this.semiGraphQLType = params.semiGraphQLType;
    this.nullable = Brick.initNullable(this);
    this.nonNullable = Brick.initNonNullable(this);
    this.fields = params.fields;
  }

  public static init<F extends OutputFieldConfigMap>(params: {
    name: string;
    fields: F;
    description?: string;
  }): OutputObjectSemiBrick<F> {
    const codecs = _.mapValues(params.fields, (field) => field.brick.codec);
    const semiGraphQLType = new GraphQLObjectType({
      name: params.name,
      description: params.description,
      fields: _.mapValues(params.fields, (field) => ({
        type: field.brick.graphQLType,
        deprecationReason: field.deprecationReason,
        description: field.description,
        // TODO: handle args bricks
      })),
    });
    return new OutputObjectSemiBrick({
      name: params.name,
      fields: params.fields,
      semiCodec: t.type(codecs),
      semiGraphQLType,
    });
  }
}
