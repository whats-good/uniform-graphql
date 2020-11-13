import 'reflect-metadata';
import * as A from 'fp-ts/lib/Array';
import * as TE from 'fp-ts/lib/TaskEither';
import * as T from 'fp-ts/lib/Task';
import * as E from 'fp-ts/lib/Either';
import { flow, pipe } from 'fp-ts/lib/function';
import { fetchParse, get, parseMetaTags, parallelTasks } from './utils';
import { decodeGeneric, GenericRssFeedItem } from './codecs/generic';
import { websites } from './data';
import { sequenceS } from 'fp-ts/lib/Apply';
import * as R from 'fp-ts/lib/Record';

const fetchParseMetaTags = flow(
  get,
  TE.map((response) => response.body),
  TE.chain(flow(parseMetaTags, TE.fromEither)),
);

const metaTagsFromFeedItem = <T extends GenericRssFeedItem>(item: T) =>
  pipe(item, (item) => item.link, fetchParseMetaTags);

// TODO: find better function name
const collectedM = <T extends GenericRssFeedItem>(item: T) => {
  return pipe(
    T.of<GenericRssFeedItem>(item),
    T.bindTo('feedItem'),
    T.bind('metaTags', ({ feedItem }) => metaTagsFromFeedItem(feedItem)),
    T.bind('applicableMetaTags', ({ metaTags }) => T.of(metaTags)), // TODO: actually implement
  );
};

const f = flow(
  fetchParse,
  TE.chain(flow(decodeGeneric, TE.fromEither)),
  T.chain(
    flow(
      E.map(({ items }) => items),
      E.map(flow(A.map(collectedM), parallelTasks(10))), // TODO: how do we optimize this number?
      E.either.sequence(T.task),
    ),
  ),
);

const main = pipe(websites, R.map(f), sequenceS(T.task));

const a = main().then((a) => {
  //
  a;
});
