import 'reflect-metadata';
import * as A from 'fp-ts/lib/Array';
import * as TE from 'fp-ts/lib/TaskEither';
import * as T from 'fp-ts/lib/Task';
import * as E from 'fp-ts/lib/Either';
import { flow } from 'fp-ts/lib/function';
import { fetchParse, get, parseMetaTags, parallelTaskEithers } from './utils';
import { decodeReddit } from './codecs/reddit';

const fetchParseMetaTags = flow(
  get,
  TE.map((response) => response.body),
  TE.chain(flow(parseMetaTags, TE.fromEither)),
);

// const fetchParseLinkTags = flow(
//   get,
//   TE.map((response) => response.body),
//   TE.chain(flow(parseLinkTags, TE.fromEither)),
// );

// const linkTagsFromUrls = flow(
//   A.map(fetchParseLinkTags),
//   parallelTaskEithers(10),
// );

const metaTagsFromUrls = flow(
  A.map(fetchParseMetaTags),
  parallelTaskEithers(10), // TODO: how should we optimize this number?
);

// TODO: how do we functionize these fetchparse functions?

const fReddit = flow(
  fetchParse,
  TE.chain(flow(decodeReddit, TE.fromEither)),
  TE.map((feedItem) => feedItem.items.map(({ link }) => link)),
  T.chain(flow(E.map(metaTagsFromUrls), E.either.sequence(T.task))),
  // T.chain(flow(E.map(linkTagsFromUrls), E.either.sequence(T.task))),
);

const a = fReddit('https://reddit.com/.rss')().then((a) => {
  //
  a;
});
