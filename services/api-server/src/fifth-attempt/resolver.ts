import { GraphQLResolveInfo } from 'graphql';
import { TypeOf } from './Brick';
import { OutputObjectSemiBrick } from './semi-bricks/OutputObject';
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

export type FieldResolverOf<
  T extends OutputFieldConfigMap,
  K extends keyof T
> = ResolverFnOf<T, K, TMap<T>>;

export type RootResolverOf<
  T extends OutputFieldConfigMap,
  K extends keyof T
> = ResolverFnOf<T, K, void>;

// TODO: later on, enable the root to be something else, but always force a return on the field.
type FieldResolversOf<T extends OutputFieldConfigMap> = {
  [K in keyof T]: FieldResolverOf<T, K>;
};

// TODO: remove this one and integrate it directly into the factory
type QueryResolversOf<T extends OutputFieldConfigMap> = {
  [K in keyof T]: RootResolverOf<T, K>;
};

export const fieldResolverize = <F extends OutputFieldConfigMap>(params: {
  semiBrick: OutputObjectSemiBrick<F, any>;
  resolvers: Partial<FieldResolversOf<F>>;
}): void => {
  Object.entries(params.resolvers).forEach(([key, value]) => {
    params.semiBrick.setFieldResolver(key, value);
  });
};

export const queryResolverize = <F extends OutputFieldConfigMap>(params: {
  semiBrick: OutputObjectSemiBrick<F, any>;
  resolvers: QueryResolversOf<F>;
}): void => {
  // TODO: make this DRYer
  Object.entries(params.resolvers).forEach(([key, value]) => {
    params.semiBrick.setFieldResolver(key, value);
  });
};
