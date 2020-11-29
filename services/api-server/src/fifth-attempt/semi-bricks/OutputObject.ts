import { GraphQLObjectType } from 'graphql';
import _ from 'lodash';
import {
  AnyBrick,
  AnySemiBrick,
  Brick,
  NonNullableBrickOf,
  NullableBrickOf,
  SemiBrick,
  TypeOf,
} from '../Brick';
import { ResolverFnOf as AnyResolverFnOf } from '../resolver';
import { SemiBrickFactory } from '../SemiBrickFactory';
import { AnyInputBrick } from './InputObject';
import { InterfaceSemiBrick } from './Interface';

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
  | 'interface'
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
  resolve?: unknown;
  // TODO: consider refining this
}

export interface OutputFieldConfigMap {
  [key: string]: OutputFieldConfig<
    AnyOutputBrick,
    OutputFieldConfigArgumentMap
  >;
}

export type TMap<F extends OutputFieldConfigMap> = {
  [K in keyof F]: TypeOf<F[K]['brick']>;
};

export type AnyOutputObjectSemiBrick = OutputObjectSemiBrick<any>;

// We need this to guarantee uniqueness of registered interfaces
export interface InterfaceSemiBrickMap {
  [key: string]: InterfaceSemiBrick<any>;
}

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
