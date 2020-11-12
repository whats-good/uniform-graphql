import 'reflect-metadata';

// const websites = {
//   reddit: 'https://reddit.com/.rss',
//   wikipedia:
//     'https://en.wikipedia.org/w/index.php?title=Special:NewPages&feed=rss',
//   bbc: 'http://feeds.bbci.co.uk/news/rss.xml',
//   elon:
//     'http://localhost:4002/?action=display&bridge=Twitter&context=By+username&u=elonmusk&format=Atom',
//   lukeBlog: 'https://lukesmith.xyz/rss.xml',
//   lukeYoutube:
//     'http://localhost:4002/?action=display&bridge=Youtube&context=By+channel+id&c=UC2eYFnH61tmytImy1mTYvhA&duration_min=&duration_max=&format=Atom',
// } as const;

// const task = pipe(websites, map(f), sequenceS(TE.taskEither));

// task().then((values) => {
//   // TODO: allow partial failure.
//   console.log({ values });
// });

import * as A from 'fp-ts/lib/Array';
import * as TE from 'fp-ts/lib/TaskEither';
import * as T from 'fp-ts/lib/Task';
import * as E from 'fp-ts/lib/Either';
import * as O from 'fp-ts/lib/Option';
import * as t from 'io-ts';
import { flow, pipe } from 'fp-ts/lib/function';
import { head } from 'fp-ts/lib/Array';
import { fetchParse, get, parseMetaTags, parallelTaskEithers } from './utils';
import { toBaseError } from './BaseError';
import { sequenceT } from 'fp-ts/lib/Apply';
import { map } from 'fp-ts/lib/ReadonlyRecord';

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
  E.mapLeft((errors) => toBaseError('validation error')(errors[0])),
);

// TODO: how can i create a TaskEither<Error, Either<A, C>> from Either<A, B>
// start with Either<'no first item found', { link: asdfasdf }>
// end with TaskEither<IBaseError, Either<'no first item found', SOMEHTML>>

const fetchParseMetaTags = flow(
  get,
  TE.map((response) => response.body),
  TE.chain(flow(parseMetaTags, TE.fromEither)),
);

// const urls: string[] = ['https://reddit.com'];
// pipe(urls, A.map(fetchParseMetaTags));
const metaTagsFromUrls = flow(
  A.map(fetchParseMetaTags),
  parallelTaskEithers(10), // TODO: how should we optimize this number?
);

const fReddit = flow(
  fetchParse,
  TE.chain((a) => {
    const b = decodeReddit(a);
    return TE.fromEither(b);
  }),
  TE.map((feedItem) => feedItem.items.map(({ link }) => link)),
  // TE.chain((urls) => {
  //   const taskOfArray = metaTagsFromUrls(urls);
  // }),
  T.chain((eitherErrorOrUrls) => {
    return pipe(
      eitherErrorOrUrls,
      E.map(flow(A.takeLeft(2), metaTagsFromUrls)), // TODO: undo the take here
      E.either.sequence(T.task),
    );
  }),
  // TODO: how to we get from Task<Either<X, Y>> to TaskEither<X, Y>?
  // T.map((eitherErrorOrUrls) => {
  //   const a = pipe(
  //     eitherErrorOrUrls,
  //     E.map(metaTagsFromUrls),
  //     TE.fromEither,
  //     TE.chain((a) => TE.rightTask(a)), // TODO: WTF????????
  //   );
  //   const b = pipe(eitherErrorOrUrls, E.map(metaTagsFromUrls), (a) => {
  //     const c = E.either.sequence(T.task)(a);
  //     return c;
  //     //
  //   });
  //   return b;
  // }),
  // T.chain((urlsOrError) => {
  //   return T.of(1);
  // }),

  // TE.chain((urls) => {
  //   const newTasks = urls.map(fetchParseMetaTags);
  //   // TODO: what does the concurrency limit even do here?
  //   const p = parallelTaskEithers(newTasks, 1);
  //   const e = TE.leftTask(p);
  // }),
  // ()
  // TE.map(({ firstItem }) => firstItem),
  // TE.map(
  //   O.fold(
  //     () => [],
  //     (a) => [a],
  //   ),
  // ),
  //   const links = items.map((item) => item.link);
  //   const gets = A.map(get)(links);
  //   const b = sequenceT(TE.taskEither)(gets);
  // }),
  // TE.map(E.fromOption(() => 'no first item found' as const)),
);

// const promise = fReddit('https://reddit.com/.rss')().then((firstItem) => {
//   if (E.isRight(firstItem)) {
//     if (O.isSome(firstItem.right)) {
//       return pipe(firstItem.right.value.link, fetchParseMetaTags)();
//     }
//   }
//   return null;
// });

const a = fReddit('https://reddit.com/.rss')().then((a) => {
  //
  a;
});
