const shareImageConfig = {
  tagline:
    'Code-first GraphQL apis in TypeScript with complete end-to-end type safety.',
  textColor: '000000',
  textLeftOffset: 64,
  textAreaWidth: 1160,
  cloudName: 'dcdgni1xm',
  imagePublicID: 'social-card_lk00wb',
  titleBottomOffset: 390,
  titleFont: 'Montserrat',
  titleFontSize: 72,
  taglineFont: encodeURIComponent('PT Mono'),
  taglineFontSize: 48,
  titleExtraConfig: '_bold',
  taglineTopOffset: 299,
};

module.exports = {
  plugins: [
    {
      resolve: 'gatsby-theme-apollo-docs',
      options: {
        shareImageConfig,
        siteName: 'Uniform GraphQL Docs',
        // gaTrackingId: 'UA-74643563-13', // TODO: fix
        // algoliaApiKey: '768e823959d35bbd51e4b2439be13fb7', // TODO: fix
        // algoliaIndexName: 'apollodata', TODO: fix
        baseUrl: 'https://uniform-graphql.whatsgood.dog',
        twitterHandle: 'MechanicalKazan',
        baseDir: 'docs-src',
        contentDir: 'source',
        root: __dirname,
        description: 'How to use the Uniform GraphQL Library',
        githubRepo: 'whats-good/uniform-graphql',
        sidebarCategories: {
          null: ['index', 'get-started', 'why-uniform-graphql'],
          Tutorial: [
            'tutorial/setup',
            'tutorial/primitive-types',
            'tutorial/resolvers',
          ],
          Types: [
            'types/scalars',
            'types/enums',
            'types/objects',
            'types/input-objects',
            'types/lists',
            'types/interfaces',
            'types/unions',
          ],
          'Further Reading': [
            'further-reading/nullability',
            'further-reading/input-and-output-types',
          ],
        },
      },
    },
  ],
};
