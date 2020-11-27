import _ from 'lodash';
import {
  OutputObjectSemiBrick,
  OutputFieldConfigMap,
  OutputFieldConfigArgumentMap,
  TMap,
} from './OutputObject';

type ArgTMap<T extends OutputFieldConfigArgumentMap> = {
  [K in keyof T]: T[K]['brick']['codec']['_A'];
};

// TODO: later on, enable the root to be something else, but always force a return on the field.
type ResolversOf<T extends OutputFieldConfigMap> = {
  [K in keyof T]: (
    root: TMap<T>,
    args: ArgTMap<T[K]['args']>,
  ) => T[K]['brick']['codec']['_A'];
};

export const fieldResolverize = <F extends OutputFieldConfigMap>(params: {
  semiBrick: OutputObjectSemiBrick<F>;
  resolvers: Partial<ResolversOf<F>>;
}): typeof params['semiBrick'] => {
  return OutputObjectSemiBrick.init({
    ...params.semiBrick,
    fields: _.mapValues(params.semiBrick.fields, (field, key) => ({
      ...field,
      resolve: params.resolvers[key] || undefined,
    })),
  }) as typeof params['semiBrick']; // TODO: see if there's a better way here
};
