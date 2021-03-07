module.exports = {
  plugins: [
    {
      resolve: 'gatsby-theme-apollo-docs',
      options: {
        pathPrefix: '/docs',
        siteName: 'Uniform GraphQL Docs',
        // gaTrackingId: 'UA-74643563-13', // TODO: fix
        // algoliaApiKey: '768e823959d35bbd51e4b2439be13fb7', // TODO: fix
        // algoliaIndexName: 'apollodata', TODO: fix
        baseUrl: 'https://uniform-graphql.whatsgood.dog',
        twitterHandle: 'MechanicalKazan',
        baseDir: 'docs',
        contentDir: 'source',
        root: __dirname,
        // subtitle: 'Apollo Basics',
        description: 'How to use the Apollo GraphQL platform',
        githubRepo: 'whats-good/uniform-graphql',
        spectrumPath: '/',
        sidebarCategories: {
          null: ['index', 'intro/platform', 'intro/benefits'],
          Tutorial: [
            'tutorial/introduction',
            'tutorial/schema',
            'tutorial/data-source',
            'tutorial/resolvers',
            'tutorial/mutation-resolvers',
            'tutorial/production',
            'tutorial/client',
            'tutorial/queries',
            'tutorial/mutations',
            'tutorial/local-state',
          ],
          // 'Development Tools': [
          //   'devtools/cli',
          //   'devtools/editor-plugins',
          //   'devtools/apollo-config',
          // ],
          // Resources: [
          //   '[Principled GraphQL](https://principledgraphql.com)',
          //   'resources/graphql-glossary',
          //   'resources/faq',
          // ],
        },
      },
    },
  ],
};
