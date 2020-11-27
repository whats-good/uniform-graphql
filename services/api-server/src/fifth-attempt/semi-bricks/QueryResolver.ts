import { GraphQLObjectType } from 'graphql';
import {
  OutputObjectSemiBrick,
  OutputFieldConfigMap,
  OutputFieldConfigArgumentMap,
} from './OutputObject';
import { scalars } from './Scalar';

type ArgTMap<T extends OutputFieldConfigArgumentMap> = {
  [K in keyof T]: T[K]['brick']['codec']['_A'];
};

type ResolversOf<T extends OutputObjectSemiBrick<OutputFieldConfigMap>> = {
  [K in keyof T['fields']]: (
    root: void,
    args: ArgTMap<T['fields'][K]['args']>,
  ) => T['fields'][K]['brick']['codec']['_A'];
};

export class QueryResolver<SB extends OutputObjectSemiBrick<any>> {
  public readonly semiBrick: SB;
  public readonly resolvers: ResolversOf<SB>;
  public readonly graphQLType: GraphQLObjectType;

  constructor(params: {
    semiBrick: SB;
    resolvers: ResolversOf<SB>;
    graphQLType: GraphQLObjectType;
  }) {
    this.semiBrick = params.semiBrick;
    this.resolvers = params.resolvers;
    this.graphQLType = params.graphQLType;
  }
}

const p = OutputObjectSemiBrick.init({
  name: 'Person!',
  fields: {
    id: {
      brick: scalars.string.nullable,
      args: {
        x: {
          brick: scalars.float.nonNullable,
        },
        y: {
          brick: scalars.int.nonNullable,
        },
      },
    },
  },
});

const a = new QueryResolver({
  semiBrick: p,
  resolvers: {
    id: (root, args) => {
      const d = args.y + 1;
      return 'abc';
    },
  },
  graphQLType: new GraphQLObjectType({
    name: 'yo',
    fields: {},
  }),
});

a.semiBrick.semiCodec.encode({
  id: 'yo',
});
