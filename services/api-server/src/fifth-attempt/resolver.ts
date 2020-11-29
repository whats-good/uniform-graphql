import _ from 'lodash';
import {
  OutputObjectSemiBrick,
  OutputFieldConfigMap,
  OutputFieldConfigArgumentMap,
  TMap,
  AnyOutputBrick,
} from './semi-bricks/output/OutputObject';
import { TypeOf } from './Brick';

// type Thunk<T> = () => T;

type ResolverReturnType<T> = T | Promise<T>; // TODO: add thunk support later
type ResolverReturnTypeOf<B extends AnyOutputBrick> = ResolverReturnType<
  TypeOf<B>
>;

// TODO: add Context and info later

type ArgTMap<T extends OutputFieldConfigArgumentMap> = {
  [K in keyof T]: TypeOf<T[K]['brick']>;
};

// TODO: later on, enable the root to be something else, but always force a return on the field.
type FieldResolversOf<T extends OutputFieldConfigMap> = {
  [K in keyof T]: (
    root: TMap<T>,
    args: ArgTMap<T[K]['args']>,
  ) => ResolverReturnTypeOf<T[K]['brick']>;
};

type QueryResolversOf<T extends OutputFieldConfigMap> = {
  [K in keyof T]: (
    root: void,
    args: ArgTMap<T[K]['args']>,
  ) => ResolverReturnTypeOf<T[K]['brick']>;
};

export type ResolverFnOf<T extends OutputFieldConfigMap, K extends keyof T> = (
  root: any,
  args: T[K]['args'],
) => ResolverReturnTypeOf<T[K]['brick']>;

export const fieldResolverize = <F extends OutputFieldConfigMap>(params: {
  semiBrick: OutputObjectSemiBrick<F>;
  resolvers: Partial<FieldResolversOf<F>>;
}): void => {
  Object.entries(params.resolvers).forEach(([key, value]) => {
    params.semiBrick.setFieldResolver(key, value);
  });
};

export const queryResolverize = <F extends OutputFieldConfigMap>(params: {
  semiBrick: OutputObjectSemiBrick<F>;
  resolvers: QueryResolversOf<F>;
}): void => {
  // TODO: make this DRYer
  Object.entries(params.resolvers).forEach(([key, value]) => {
    params.semiBrick.setFieldResolver(key, value);
  });
};
