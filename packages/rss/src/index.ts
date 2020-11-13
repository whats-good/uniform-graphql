import 'reflect-metadata';
import fs from 'fs';
import * as A from 'fp-ts/lib/Array';
import * as TE from 'fp-ts/lib/TaskEither';
import * as T from 'fp-ts/lib/Task';
import * as E from 'fp-ts/lib/Either';
import { flow, identity, pipe } from 'fp-ts/lib/function';
import { fetchParseRss, http, parseMetaTags, parallelTasks } from './utils';
import { decodeGeneric, GenericRssFeedItem } from './codecs/generic';

const pickLink = <T extends GenericRssFeedItem>(item: T) => item.link;

const metaTagsFromFeedItem = flow(
  pickLink,
  http.getBody,
  TE.chain(flow(parseMetaTags, TE.fromEither)),
);

// TODO: find better function name
const collectedM = <T extends GenericRssFeedItem>(item: T) => {
  return pipe(
    T.of<GenericRssFeedItem>(item),
    T.bindTo('feedItem'),
    T.bind('metaTags', ({ feedItem }) => metaTagsFromFeedItem(feedItem)),
  );
};

const f = flow(
  fetchParseRss,
  TE.chain(flow(decodeGeneric, TE.fromEither)),
  T.chain(
    flow(
      E.map(({ items }) => items),
      E.map(flow(A.map(collectedM), parallelTasks(10))), // TODO: how do we optimize this number?
      E.either.sequence(T.task),
    ),
  ),
);

const clean = flow(
  f,
  TE.map((a) => {
    const b = pipe(
      a,
      A.map((context) => {
        const c = pipe(
          context.metaTags,
          E.fold(() => [], identity),
        );
        return {
          ...context,
          metaTags: c,
        };
      }),
    );
    return b;
  }),
);

const main = clean('https://reddit.com/.rss');
const write = (filename: string) =>
  main().then((a) => {
    fs.writeFileSync(filename, JSON.stringify(a, null, 2));
  });

// write('yo.json');
