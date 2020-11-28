import { GraphQLID, GraphQLInterfaceType, GraphQLString } from 'graphql';
import * as t from 'io-ts';
import _ from 'lodash';
import { OMap, OutputFieldConfigMap, TMap } from './OutputObject';
import {
  Codec,
  Brick,
  SemiBrick,
  NullableBrickOf,
  NonNullableBrickOf,
} from '../Brick';

// TODO: unions and interfaces will both need a "resolveType" field

export class InterfaceSemiBrick<F extends OutputFieldConfigMap>
  implements SemiBrick<'interface', GraphQLInterfaceType, TMap<F>, OMap<F>> {
  public readonly kind = 'interface' as const;
  public readonly name: string;
  public readonly semiCodec: Codec<TMap<F>, OMap<F>>;
  public readonly semiGraphQLType: GraphQLInterfaceType;
  public readonly fields: F;
  public readonly nullable: NullableBrickOf<InterfaceSemiBrick<F>>;
  public readonly nonNullable: NonNullableBrickOf<InterfaceSemiBrick<F>>;
  // TODO: add interfaces array here

  // TODO: look into GraphQLInterface.resolveType
  constructor(params: {
    name: string;
    semiCodec: InterfaceSemiBrick<F>['semiCodec'];
    semiGraphQLType: GraphQLInterfaceType;
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
  }): InterfaceSemiBrick<F> {
    // TODO: interface and output object types are extremely similar. consider creating a root clasas for both, and extending.
    const codecs = _.mapValues(params.fields, (field) => field.brick.codec);
    const semiGraphQLType = new GraphQLInterfaceType({
      name: params.name,
      description: params.description,
      fields: _.mapValues(params.fields, (field) => {
        const { args } = field;
        const graphQLArgs = _.mapValues(args, (arg) => {
          return {
            type: arg.brick.graphQLType,
            description: arg.description,
            deprecationReason: arg.deprecationReason,
          };
        });
        return {
          type: field.brick.graphQLType,
          description: field.description,
          deprecationReason: field.deprecationReason,
          args: graphQLArgs,
          resolve: field.resolve as any, // TODO: consider not doing any here
        };
      }),
    });
    return new InterfaceSemiBrick({
      name: params.name,
      fields: params.fields,
      semiCodec: t.type(codecs),
      semiGraphQLType,
    });
  }
}

// // TODO: for an interface to be implemented, all its interfaces should be listed. just implementing them isnt enough.
