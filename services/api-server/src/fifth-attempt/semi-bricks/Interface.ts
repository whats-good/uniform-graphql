import { GraphQLInterfaceType } from 'graphql';
import _ from 'lodash';
import {
  Brick,
  SemiBrick,
  NullableBrickOf,
  NonNullableBrickOf,
} from '../Brick';
import { SemiBrickFactory } from '../SemiBrickFactory';
import {
  Implementors,
  InterfaceSemiBrickMap,
  OutputFieldConfigMap,
  TMap,
} from './struct-types';

// TODO: unions and interfaces will both need a "resolveType" field

// TODO: create a shared interface for OutputObject and Interface semibricks, since they can both implement interfaces
export class InterfaceSemiBrick<
  F extends OutputFieldConfigMap
> extends SemiBrick<'interface', GraphQLInterfaceType, TMap<F>> {
  public readonly kind = 'interface' as const;
  public readonly fields: F;
  public readonly implementors: Implementors<F>;
  public readonly interfaces: InterfaceSemiBrickMap = {};

  public readonly nullable: NullableBrickOf<InterfaceSemiBrick<F>>;
  public readonly nonNullable: NonNullableBrickOf<InterfaceSemiBrick<F>>;
  // TODO: add interfaces array here

  constructor(params: {
    name: string;
    fields: F;
    implementors: InterfaceSemiBrick<F>['implementors'];
    semiBrickFactory: SemiBrickFactory;
  }) {
    super(params);
    this.fields = params.fields;
    this.implementors = params.implementors;

    Object.values(this.implementors).forEach((sb) => {
      sb.implements(this);
    });

    this.nullable = Brick.initNullable(this);
    this.nonNullable = Brick.initNonNullable(this);
  }

  // TODO: how can i make sure that this interface actually implements the given interface?
  // TODO: how can i guarantee that this interfacae is already inside the "implementors" map of the interface?
  // TODO: i need to flatten the entire tree of interfaces that this interface itself may be extending, and register all of them here.
  private implements = <I extends OutputFieldConfigMap>(
    sb: InterfaceSemiBrick<I>,
  ): void => {
    this.interfaces[sb.name] = sb;
  };

  public readonly getFreshSemiGraphQLType = (): GraphQLInterfaceType => {
    return new GraphQLInterfaceType({
      name: this.name,
      interfaces: Object.values(this.interfaces).map((sb) =>
        sb.getSemiGraphQLType(),
      ),
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
