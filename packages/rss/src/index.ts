import 'reflect-metadata';

import * as A from 'fp-ts/lib/Array';
import * as TE from 'fp-ts/lib/TaskEither';
import * as T from 'fp-ts/lib/Task';
import * as E from 'fp-ts/lib/Either';
import * as t from 'io-ts';
import { flow } from 'fp-ts/lib/function';
import { fetchParse, get, parseMetaTags, parallelTaskEithers } from './utils';
import { toBaseError } from './BaseError';

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

const fetchParseMetaTags = flow(
  get,
  TE.map((response) => response.body),
  TE.chain(flow(parseMetaTags, TE.fromEither)),
);

const metaTagsFromUrls = flow(
  A.map(fetchParseMetaTags),
  parallelTaskEithers(10), // TODO: how should we optimize this number?
);

// TODO: is there a more elegant way for this?
const taskOfEitherToTaskEither = <A, B>(
  a: T.Task<E.Either<A, B>>,
): TE.TaskEither<A, B> => a;

const fReddit = flow(
  fetchParse,
  TE.chain(flow(decodeReddit, TE.fromEither)),
  TE.map((feedItem) => feedItem.items.map(({ link }) => link)),
  T.chain(flow(E.map(metaTagsFromUrls), E.either.sequence(T.task))),
  taskOfEitherToTaskEither,
);

const a = fReddit('https://reddit.com/.rss')().then((a) => {
  //
  a;
});
