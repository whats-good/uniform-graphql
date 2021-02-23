const SITE_URL = `http://uniform-graphql.whatsgood.dog/`; //TODO: update to https
const SITE_LONG_NAME = 'UniformGraphQL Documentation';
const SITE_SHORT_NAME = 'UniformGraphQL';

module.exports = {
  siteMetadata: {
    siteTitle: SITE_LONG_NAME,
    defaultTitle: SITE_LONG_NAME,
    siteTitleShort: SITE_SHORT_NAME,
    siteDescription: `Code-first GraphQL apis in TypeScript with complete & robust end-to-end type safety.`,
    siteUrl: SITE_URL,
    siteAuthor: `Kerem Kazan`,
    siteImage: `/logo.png`, // TODO: design a better banner
    siteLanguage: `en`,
    themeColor: `#8257E6`,
    basePath: `/`,
  },
  plugins: [
    {
      resolve: `@rocketseat/gatsby-theme-docs`,
      options: {
        configPath: `src/config`,
        docsPath: `src/docs`,
        githubUrl: `https://github.com/whats-good/uniform-graphql`,
        baseDir: `packages/website`,
      },
    },
    `gatsby-plugin-sitemap`,
    {
      resolve: `gatsby-plugin-google-analytics`,
      options: {
        // trackingId: ``, // TODO: add a tracking ID for google analytics
      },
    },
    `gatsby-plugin-remove-trailing-slashes`,
    {
      resolve: `gatsby-plugin-canonical-urls`,
      options: {
        siteUrl: SITE_URL,
      },
    },
  ],
};
