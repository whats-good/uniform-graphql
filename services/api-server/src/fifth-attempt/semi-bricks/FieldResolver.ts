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
type ResolversOf<T extends OutputObjectSemiBrick<OutputFieldConfigMap>> = {
  [K in keyof T['fields']]: (
    root: TMap<T['fields']>,
    args: ArgTMap<T['fields'][K]['args']>,
  ) => T['fields'][K]['brick']['codec']['_A'];
};

export class FieldResolver<SB extends OutputObjectSemiBrick<any>> {
  public readonly semiBrick: SB;
  public readonly resolvers: Partial<ResolversOf<SB>>;
  public readonly graphQLType: GraphQLObjectType;

  private constructor(params: {
    semiBrick: SB;
    resolvers: Partial<ResolversOf<SB>>;
    graphQLType: GraphQLObjectType;
  }) {
    this.semiBrick = params.semiBrick;
    this.resolvers = params.resolvers;
    this.graphQLType = params.graphQLType;
  }

  // TODO: there's very little difference between query resolvers and field resolvers. see how we can combine them.
  // TODO: technically speaking, we're creating a new semibrick here.
  // TODO: for field resolvers, there will come a point where we'll have to update existing instances to include the resolvers.
  public static init<SB extends OutputObjectSemiBrick<any>>(params: {
    semiBrick: SB;
    resolvers: Partial<ResolversOf<SB>>;
  }): FieldResolver<SB> {
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
