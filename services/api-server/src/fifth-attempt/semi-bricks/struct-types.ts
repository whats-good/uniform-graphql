import _ from 'lodash';
import { GraphQLFieldConfig, GraphQLResolveInfo } from 'graphql';
import { AnyBrick, AnySemiBrick, SemiTypeOf, TypeOf } from '../Brick';
import { InterfaceSemiBrick } from './Interface';
import { OutputObjectSemiBrick } from './OutputObject';

export type ListTypeOf<SB extends AnySemiBrick> = Array<SemiTypeOf<SB>>;

// TODO: can we do recursive output objects?

export interface BrickMap<B extends AnyBrick> {
  [key: string]: {
    brick: B;
  };
}

export interface ArgumentConfig {
  brick: AnyInputBrick;
  description?: string;
  deprecationReason?: string;
  // defaultValue?: any; // TODO: implement
}
export interface OutputFieldConfigArgumentMap {
  [key: string]: ArgumentConfig;
}

export type OutputKind =
  | 'scalar'
  | 'enum'
  | 'union'
  | 'outputobject'
  | 'interface'
  | 'outputlist';

export type AnyOutputBrick = AnyBrick<OutputKind>;
export type AnyOutputSemiBrick = AnySemiBrick<OutputKind>;

// TODO: add context stuff later
export interface OutputFieldConfigConstructor<
  B extends AnyOutputBrick,
  A extends OutputFieldConfigArgumentMap
> {
  readonly brick: B;
  readonly args: A;
  readonly description?: string;
  readonly deprecationReason?: string;
}

export class OutputFieldConfig<
  B extends AnyOutputBrick,
  A extends OutputFieldConfigArgumentMap
> {
  readonly brick: B;
  readonly args: A;
  readonly description?: string;
  readonly deprecationReason?: string;

  constructor(params: OutputFieldConfigConstructor<B, A>) {
    this.brick = params.brick;
    this.args = params.args;
    this.description = params.description;
    this.deprecationReason = params.deprecationReason;
  }

  // TODO: add context and root later
  public getGraphQLTypeConstructor = (): GraphQLFieldConfig<any, any> => {
    const graphQLArgs = _.mapValues(this.args, (arg) => {
      return {
        type: arg.brick.getGraphQLType(),
        description: arg.description,
        deprecationReason: arg.deprecationReason,
      };
    });
    return {
      type: this.brick.getGraphQLType(),
      description: this.description,
      deprecationReason: this.deprecationReason,
      args: graphQLArgs,
    };
  };
}

export interface OutputFieldConfigConstructorMap
  extends BrickMap<AnyOutputBrick> {
  [key: string]: OutputFieldConfigConstructor<
    AnyOutputBrick,
    OutputFieldConfigArgumentMap
  >;
}

export interface OutputFieldConfigMap extends BrickMap<AnyOutputBrick> {
  [key: string]: OutputFieldConfig<
    AnyOutputBrick,
    OutputFieldConfigArgumentMap
  >;
}

export type TMap<M extends BrickMap<any>> = {
  [K in keyof M]: TypeOf<M[K]['brick']>;
};

export type AnyOutputObjectSemiBrick = OutputObjectSemiBrick<any, any>;

// We need this to guarantee uniqueness of registered interfaces
export interface InterfaceSemiBrickMap {
  [key: string]: InterfaceSemiBrick<any, any, any>;
}

export interface InputFieldConfig {
  brick: AnyInputBrick;
  description?: string;
  deprecationReason?: string;
  // defaultValue?: any; // TODO: implement
}

export interface InputFieldConfigMap extends BrickMap<AnyInputBrick> {
  [key: string]: InputFieldConfig;
}

export type InputKind = 'scalar' | 'enum' | 'inputlist' | 'inputobject';
export type AnyInputBrick = AnyBrick<InputKind>;
export type AnyInputSemiBrick = AnySemiBrick<InputKind>;

// type Thunk<T> = () => T;

type ResolverReturnType<T> = T | Promise<T>; // TODO: add thunk support later
type ResolverReturnTypeOf<B extends AnyOutputBrick> = ResolverReturnType<
  B['B_R']
>;

// TODO: add Contextlater

type ArgTMap<T extends OutputFieldConfigArgumentMap> = {
  [K in keyof T]: TypeOf<T[K]['brick']>;
};

type ResolverFnOfBrickAndArgs<
  B extends AnyOutputBrick,
  A extends OutputFieldConfigArgumentMap,
  R
> = (
  root: R,
  args: ArgTMap<A>,
  ctx: any,
  info: GraphQLResolveInfo,
) => ResolverReturnTypeOf<B>;

type ResolverFnOfConfigMap<
  T extends OutputFieldConfigMap,
  K extends keyof T,
  R
> = ResolverFnOfBrickAndArgs<T[K]['brick'], T[K]['args'], R>;

// TODO: later on, enable the root to be something else, but always force a return on the field.
export type FieldResolversOf<T extends OutputFieldConfigMap> = {
  [K in keyof T]: ResolverFnOfConfigMap<T, K, TMap<T>>;
};
