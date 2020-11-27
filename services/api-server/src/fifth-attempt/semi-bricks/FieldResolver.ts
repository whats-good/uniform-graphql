import { GraphQLObjectType } from 'graphql';
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

export class FieldResolver<F extends OutputFieldConfigMap> {
  public readonly semiBrick: OutputObjectSemiBrick<F>;
  public readonly resolvers: Partial<ResolversOf<F>>;
  public readonly graphQLType: GraphQLObjectType;

  private constructor(params: {
    semiBrick: FieldResolver<F>['semiBrick'];
    resolvers: FieldResolver<F>['resolvers'];
    graphQLType: FieldResolver<F>['graphQLType'];
  }) {
    this.semiBrick = params.semiBrick;
    this.resolvers = params.resolvers;
    this.graphQLType = params.graphQLType;
  }

  // TODO: there's very little difference between query resolvers and field resolvers. see how we can combine them.
  // TODO: technically speaking, we're creating a new semibrick here.
  // TODO: for field resolvers, there will come a point where we'll have to update existing instances to include the resolvers.
  public static init<F extends OutputFieldConfigMap>(params: {
    semiBrick: OutputObjectSemiBrick<F>;
    resolvers: Partial<ResolversOf<F>>;
  }): FieldResolver<F> {
    return new FieldResolver({
      semiBrick: params.semiBrick,
      resolvers: params.resolvers,
      graphQLType: new GraphQLObjectType({
        name: params.semiBrick.name,
        fields: _.mapValues(params.semiBrick.fields, (field, key) => {
          const { args } = field;
          const graphQLArgs = _.mapValues(args, (arg) => {
            return {
              type: arg.brick.graphQLType,
              description: arg.description,
              deprecationReason: arg.deprecationReason,
            };
          });
          return {
            type: field.brick.graphQLType,
            description: field.description,
            deprecationReason: field.deprecationReason,
            args: graphQLArgs,
            resolve: params.resolvers[key] as any, // TODO: see if we can avoid the any here
          };
        }),
      }),
    });
  }
}
