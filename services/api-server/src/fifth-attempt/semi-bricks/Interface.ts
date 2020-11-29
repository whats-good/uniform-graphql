import {
  GraphQLID,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
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
import { SemiBrickFactory } from '../SemiBrickFactory';

// TODO: unions and interfaces will both need a "resolveType" field

export class InterfaceSemiBrick<F extends OutputFieldConfigMap>
  implements SemiBrick<'interface', GraphQLInterfaceType, TMap<F>, OMap<F>> {
  public readonly kind = 'interface' as const;
  public readonly name: string;
  public readonly semiCodec: Codec<TMap<F>, OMap<F>>;
  public readonly fields: F;

  public readonly nullable: NullableBrickOf<InterfaceSemiBrick<F>>;
  public readonly nonNullable: NonNullableBrickOf<InterfaceSemiBrick<F>>;
  // TODO: add interfaces array here

  // TODO: look into GraphQLInterface.resolveType
  constructor(
    public semiBrickFactory: SemiBrickFactory,
    params: {
      name: string;
      semiCodec: InterfaceSemiBrick<F>['semiCodec'];
      fields: F;
    },
  ) {
    this.name = params.name;
    this.semiCodec = params.semiCodec;
    this.fields = params.fields;

    this.nullable = Brick.initNullable(this);
    this.nonNullable = Brick.initNonNullable(this);
  }

  public readonly getSemiGraphQLType = (): GraphQLInterfaceType => {
    return new GraphQLInterfaceType({
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

  public static init = (semiBrickFactory: SemiBrickFactory) => <
    F extends OutputFieldConfigMap
  >(params: {
    name: string;
    fields: F;
    description?: string;
  }): InterfaceSemiBrick<F> => {
    // TODO: interface and output object types are extremely similar. consider creating a root clasas for both, and extending.
    const codecs = _.mapValues(params.fields, (field) => field.brick.codec);
    return new InterfaceSemiBrick(semiBrickFactory, {
      name: params.name,
      fields: params.fields,
      semiCodec: t.type(codecs),
    });
  };
}
