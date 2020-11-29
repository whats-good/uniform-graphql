import { GraphQLInterfaceType } from 'graphql';
import _ from 'lodash';
import { OMap, OutputFieldConfigMap, TMap } from './OutputObject';
import {
  Brick,
  SemiBrick,
  NullableBrickOf,
  NonNullableBrickOf,
} from '../Brick';
import { SemiBrickFactory } from '../SemiBrickFactory';

// TODO: unions and interfaces will both need a "resolveType" field

export class InterfaceSemiBrick<
  F extends OutputFieldConfigMap
> extends SemiBrick<'interface', GraphQLInterfaceType, TMap<F>, OMap<F>> {
  public readonly kind = 'interface' as const;
  public readonly fields: F;

  public readonly nullable: NullableBrickOf<InterfaceSemiBrick<F>>;
  public readonly nonNullable: NonNullableBrickOf<InterfaceSemiBrick<F>>;
  // TODO: add interfaces array here

  // TODO: look into GraphQLInterface.resolveType
  constructor(params: {
    name: string;
    semiCodec: InterfaceSemiBrick<F>['semiCodec'];
    fields: F;
    semiBrickFactory: SemiBrickFactory;
  }) {
    super(params);
    this.fields = params.fields;

    this.nullable = Brick.initNullable(this);
    this.nonNullable = Brick.initNonNullable(this);
  }

  public readonly getFreshSemiGraphQLType = (): GraphQLInterfaceType => {
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
}
