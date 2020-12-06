import { GraphQLResolveInfo } from 'graphql';
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
export interface OutputFieldConfigArgumentMap extends BrickMap<AnyInputBrick> {
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

type ResolverFnOf<T extends OutputFieldConfigMap, K extends keyof T, R> = (
  root: R,
  args: ArgTMap<T[K]['args']>,
  ctx: any,
  info: GraphQLResolveInfo,
) => ResolverReturnTypeOf<T[K]['brick']>;

// TODO: later on, enable the root to be something else, but always force a return on the field.
export type FieldResolversOf<T extends OutputFieldConfigMap> = {
  [K in keyof T]: ResolverFnOf<T, K, TMap<T>>;
};

// TODO: remove this one and integrate it directly into the factory
export type RootQueryResolversOf<T extends OutputFieldConfigMap> = {
  [K in keyof T]: ResolverFnOf<T, K, undefined>;
};
