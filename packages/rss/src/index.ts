import 'reflect-metadata';
import * as nodeHtmlParser from 'node-html-parser';
import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';
import * as O from 'fp-ts/lib/Option';
import * as T from 'fp-ts/lib/Task';
import * as t from 'io-ts';
import got from 'got';
import { flow, pipe } from 'fp-ts/lib/function';
import Parser from 'rss-parser';
import { sequenceS } from 'fp-ts/lib/Apply';
import { map } from 'fp-ts/lib/ReadonlyRecord';
import { head } from 'fp-ts/lib/Array';

const parser = new Parser();

// const toError = (from: string) =>
//   flow(E.toError, (error) => ({
//     from,
//     error,
//   }));

const get = TE.tryCatchK(
  (url: string) => got.get(url),
  (error) => ({ error: E.toError(error), also: 'get error' }),
); // TODO: better error handling
const parse = TE.tryCatchK(
  (xml: string) => parser.parseString(xml),
  (error) => ({
    error: E.toError(error),
    also: 'parse error',
  }),
); // TODO: better error handling

const fetchParse = flow(
  get,
  TE.map((response) => response.body),
  TE.chain(parse),
);

const parseHtml = TE.tryCatchK(
  (html: string) => {
    // TODO: how can i combine the errors and avoid nesting?
    const { valid, ...rest } = nodeHtmlParser.parse(html);
    const result = pipe(
      rest,
      E.fromPredicate(
        () => valid,
        () => 'invalid html parsing',
      ),
    );
    return TE.fromEither(result)();
  },
  (error) => ({
    error: E.toError(error),
    also: 'html parsing error',
  }),
);

// const parseHtml = TE.tryCatchK(
//   (html: string) =>
//     new Promise((resolve, reject) => {
//       const parsed = nodeHtmlParser.parse(html);
//       // TODO: see if there's a better way of doing this part.
//       if (parsed.valid) {
//         resolve(parsed);
//       } else {
//         reject('invalid html');
//       }
//     }),
//   (error) => ({
//     error: E.toError(error),
//     also: 'html parser error',
//   }),
// );

const redditCodec = t.type({
  feedUrl: t.string,
  lastBuildDate: t.string,
  link: t.string,
  title: t.string,
  items: t.array(
    t.type({
      author: t.string,
      content: t.string,
      contentSnippet: t.string,
      id: t.string,
      isoDate: t.string,
      link: t.string,
      pubDate: t.string,
      title: t.string,
    }),
  ),
});

const decodeReddit = flow(
  redditCodec.decode,
  E.map((redditFeed) => {
    return {
      feedTitle: redditFeed.title,
      feedLength: redditFeed.items.length,
      firstItem: head(redditFeed.items),
    };
  }),
  // E.mapLeft(toError('decodingError')),
);

const fReddit = flow(fetchParse, TE.map(decodeReddit));
fReddit('https://reddit.com/.rss')()
  .then((value) => {
    if (E.isRight(value)) {
      if (E.isRight(value.right)) {
        return value.right.right.firstItem;
      }
    }
    return O.none;
  })
  .then((firstItem) => {
    if (O.isSome(firstItem)) {
      return pipe(
        firstItem.value.link,
        get,
        TE.map((response) => response.body),
        TE.chain(parseHtml),
        TE.map((html) => {
          // TODO: here
          // return html.childNodes.;
        }),
      )();
    }
    return null;
  });

const websites = {
  reddit: 'https://reddit.com/.rss',
  wikipedia:
    'https://en.wikipedia.org/w/index.php?title=Special:NewPages&feed=rss',
  bbc: 'http://feeds.bbci.co.uk/news/rss.xml',
  elon:
    'http://localhost:4002/?action=display&bridge=Twitter&context=By+username&u=elonmusk&format=Atom',
  lukeBlog: 'https://lukesmith.xyz/rss.xml',
  lukeYoutube:
    'http://localhost:4002/?action=display&bridge=Youtube&context=By+channel+id&c=UC2eYFnH61tmytImy1mTYvhA&duration_min=&duration_max=&format=Atom',
} as const;

// const task = pipe(websites, map(f), sequenceS(TE.taskEither));

// task().then((values) => {
//   // TODO: allow partial failure.
//   console.log({ values });
// });
