module.exports = {
  plugins: [
    {
      resolve: 'gatsby-theme-apollo-docs',
      options: {
        // pathPrefix: '/docs', // TODO: check if this is necessary
        siteName: 'Uniform GraphQL Docs',
        // gaTrackingId: 'UA-74643563-13', // TODO: fix
        // algoliaApiKey: '768e823959d35bbd51e4b2439be13fb7', // TODO: fix
        // algoliaIndexName: 'apollodata', TODO: fix
        baseUrl: 'https://uniform-graphql.whatsgood.dog',
        twitterHandle: 'MechanicalKazan',
        baseDir: 'docs',
        contentDir: 'source',
        root: __dirname,
        description: 'How to use the Uniform GraphQL Library',
        githubRepo: 'whats-good/uniform-graphql',
        spectrumPath: '/',
        sidebarCategories: {
          null: ['index', 'get-started', 'why-uniform-graphql'],
          Tutorial: ['tutorial/resolvers'],
          Types: [
            'types/scalars',
            'types/enums',
            'types/objects',
            'types/input-objects',
            'types/lists',
            'types/interfaces',
            'types/unions',
          ],
        },
      },
    },
  ],
};
