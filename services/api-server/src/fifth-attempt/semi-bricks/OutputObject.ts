import { GraphQLObjectType } from 'graphql';
import * as t from 'io-ts';
import _ from 'lodash';
import {
  AnyBrick,
  AnySemiBrick,
  Brick,
  Codec,
  NonNullableBrickOf,
  NullableBrickOf,
  SemiBrick,
} from '../Brick';
import { AnyInputBrick } from './InputObject';

// TODO: can we do recursive output objects?

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
  | 'interface' // TODO: should i allow output objects to take interfaces and interface lists as a field? probabaly not
  | 'outputlist';

export type AnyOutputBrick = AnyBrick<OutputKind>;
export type AnyOutputSemiBrick = AnySemiBrick<OutputKind>;

// TODO: add context stuff later
export interface OutputFieldConfig<
  B extends AnyOutputBrick,
  A extends OutputFieldConfigArgumentMap
> {
  readonly brick: B;
  readonly args: A;
  readonly description?: string;
  readonly deprecationReason?: string;
  readonly resolve?: unknown;
  // TODO: consider refining this
}

export interface OutputFieldConfigMap {
  [key: string]: OutputFieldConfig<
    AnyOutputBrick,
    OutputFieldConfigArgumentMap
  >;
}

export type TMap<F extends OutputFieldConfigMap> = {
  [K in keyof F]: F[K]['brick']['codec']['_A'];
};

export type OMap<F extends OutputFieldConfigMap> = {
  [K in keyof F]: F[K]['brick']['codec']['_O'];
};

export type AnyOutputObjectSemiBrick = OutputObjectSemiBrick<any>;
// TODO: add an optional "interfaces" field here
export class OutputObjectSemiBrick<F extends OutputFieldConfigMap>
  implements SemiBrick<'outputobject', GraphQLObjectType, TMap<F>, OMap<F>> {
  public readonly kind = 'outputobject' as const;
  public readonly name: string;
  public readonly semiCodec: Codec<TMap<F>, OMap<F>>;
  public readonly fields: F;

  public readonly nullable: NullableBrickOf<OutputObjectSemiBrick<F>>;
  public readonly nonNullable: NonNullableBrickOf<OutputObjectSemiBrick<F>>;

  constructor(params: {
    name: string;
    semiCodec: Codec<TMap<F>, OMap<F>>;
    fields: F;
  }) {
    this.name = params.name;
    this.semiCodec = params.semiCodec;
    this.fields = params.fields;
    this.nullable = Brick.initNullable(this);
    this.nonNullable = Brick.initNonNullable(this);
  }

  public readonly getSemiGraphQLType = (): GraphQLObjectType => {
    return new GraphQLObjectType({
      name: this.name,
      fields: _.mapValues(this.fields, (field) => {
        const { args } = field;
        const graphQLArgs = _.mapValues(args, (arg) => {
          return {
            type: arg.brick.getGraphQLType(),
            description: arg.description,
            deprecationReason: arg.deprecationReason,
          };
        });
        return {
          type: field.brick.getGraphQLType(),
          description: field.description,
          deprecationReason: field.deprecationReason,
          args: graphQLArgs,
          resolve: field.resolve as any, // TODO: consider not doing any here
        };
      }),
    });
  };

  public static init<F extends OutputFieldConfigMap>(params: {
    name: string;
    fields: F;
  }): OutputObjectSemiBrick<F> {
    const codecs = _.mapValues(params.fields, (field) => field.brick.codec);
    return new OutputObjectSemiBrick({
      name: params.name,
      fields: params.fields,
      semiCodec: t.type(codecs),
    });
  }
}
