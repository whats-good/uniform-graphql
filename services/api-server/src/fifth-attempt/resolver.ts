import _ from 'lodash';
import {
  OutputObjectSemiBrick,
  OutputFieldConfigMap,
  OutputFieldConfigArgumentMap,
  TMap,
  AnyOutputBrick,
} from './semi-bricks/OutputObject';

// type Thunk<T> = () => T;

type ResolverReturnType<T> = T | Promise<T>; // TODO: add thunk support later
type ResolverReturnTypeOf<B extends AnyOutputBrick> = ResolverReturnType<
  B['codec']['_A']
>;

// TODO: add Context and info later

type ArgTMap<T extends OutputFieldConfigArgumentMap> = {
  [K in keyof T]: T[K]['brick']['codec']['_A'];
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

export const fieldResolverize = <F extends OutputFieldConfigMap>(params: {
  semiBrick: OutputObjectSemiBrick<F>;
  resolvers: Partial<FieldResolversOf<F>>;
}): typeof params['semiBrick'] => {
  return OutputObjectSemiBrick.init({
    ...params.semiBrick,
    fields: _.mapValues(params.semiBrick.fields, (field, key) => ({
      ...field,
      resolve: params.resolvers[key] || undefined,
    })),
  }) as typeof params['semiBrick']; // TODO: see if there's a better way here
};

export const queryResolverize = <F extends OutputFieldConfigMap>(params: {
  semiBrick: OutputObjectSemiBrick<F>;
  resolvers: QueryResolversOf<F>;
}): typeof params['semiBrick'] => {
  return OutputObjectSemiBrick.init({
    ...params.semiBrick,
    fields: _.mapValues(params.semiBrick.fields, (field, key) => ({
      ...field,
      resolve: params.resolvers[key] || undefined,
    })),
  }) as typeof params['semiBrick']; // TODO: see if there's a better way here
};
