import { GraphQLObjectType } from 'graphql';
import _ from 'lodash';
import {
  Brick,
  NonNullableBrickOf,
  NullableBrickOf,
  SemiBrick,
} from '../Brick';
import { ResolverFnOf as AnyResolverFnOf } from '../resolver';
import { SemiBrickFactory } from '../SemiBrickFactory';
import { InterfaceSemiBrick } from './Interface';
import {
  OutputFieldConfigMap,
  TMap,
  InterfaceSemiBrickMap,
} from './struct-types';

// TODO: add an optional "interfaces" field here
export class OutputObjectSemiBrick<
  F extends OutputFieldConfigMap
> extends SemiBrick<'outputobject', GraphQLObjectType, TMap<F>> {
  public readonly kind = 'outputobject' as const;
  public readonly fields: F;
  public readonly interfaces: InterfaceSemiBrickMap = {};

  public readonly nullable: NullableBrickOf<OutputObjectSemiBrick<F>>;
  public readonly nonNullable: NonNullableBrickOf<OutputObjectSemiBrick<F>>;

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

  public getFreshSemiGraphQLType = (): GraphQLObjectType => {
    return new GraphQLObjectType({
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

  // TODO: how can i make sure that this output object actually implements this interface?
  // TODO: i need to flatten the entire tree of interfaces that this interface itself may be extending, and register all of them here.
  public implements = <I extends OutputFieldConfigMap>(
    sb: InterfaceSemiBrick<I>,
  ): void => {
    this.interfaces[sb.name] = sb;
  };

  public setFieldResolver = <K extends keyof F>(
    key: K,
    resolve: AnyResolverFnOf<F, K>,
  ): void => {
    this.fields[key].resolve = resolve;
  };
}
