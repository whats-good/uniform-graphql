import 'reflect-metadata';

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

const fetchParseMetaTags = flow(
  get,
  TE.map((response) => response.body),
  TE.chain(flow(parseMetaTags, TE.fromEither)),
);

const metaTagsFromUrls = flow(
  A.map(fetchParseMetaTags),
  parallelTaskEithers(10), // TODO: how should we optimize this number?
);

const fReddit = flow(
  fetchParse,
  TE.chain(flow(decodeReddit, TE.fromEither)),
  TE.map((feedItem) => feedItem.items.map(({ link }) => link)),
  T.chain(
    flow(
      E.map(flow(A.takeLeft(2), metaTagsFromUrls)), // TODO: undo the take here
      E.either.sequence(T.task),
    ),
  ),
);

const a = fReddit('https://reddit.com/.rss')().then((a) => {
  //
  a;
});
