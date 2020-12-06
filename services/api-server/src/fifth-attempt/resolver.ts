import { GraphQLResolveInfo } from 'graphql';
import { TypeOf } from './Brick';
import {
  AnyOutputBrick,
  OutputFieldConfigArgumentMap,
  OutputFieldConfigMap,
  TMap,
} from './semi-bricks/struct-types';

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
