// import * as nodeHtmlParser from 'node-html-parser';
import cheerio from 'cheerio';
import * as t from 'io-ts';
import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';
import * as O from 'fp-ts/lib/Option';
import got from 'got';
import { flow } from 'fp-ts/lib/function';
import Parser from 'rss-parser';
import { filterMap, map } from 'fp-ts/lib/Array';
import { sequenceS } from 'fp-ts/lib/Apply';
import { toBaseError } from './BaseError';
import { Task } from 'fp-ts/lib/Task';
import pmap from 'p-map';

const parser = new Parser();

export const decode = <B extends t.Props>(codec: t.TypeC<B>) =>
  flow(
    codec.decode,
    E.mapLeft((errors) => {
      // TODO: how can we access the initial argument before the previous function 'codec.decode' failed?
      const validationMessage = `Codec validation failed. First error: ${errors[0].message}`;
      return toBaseError(validationMessage)(errors);
    }),
  );

const get = TE.tryCatchK(
  (url: string) => got.get(url),
  toBaseError('http get failed'),
);

const getBody = flow(
  get,
  TE.map(({ body }) => body),
);

export const http = { get, getBody };

const parseRss = TE.tryCatchK(
  (xml: string) => parser.parseString(xml),
  toBaseError('parsing failed'),
);

export const fetchParseRss = flow(http.getBody, TE.chain(parseRss));

const parseHtml = (html: string) =>
  E.tryCatch(() => {
    return cheerio.load(html);
  }, toBaseError('html parsing error'));

const htmlToLinkTags = flow(
  (root: cheerio.Root) => Object.entries(root('link')),
  map(([key, value]) => ({ key, value })),
  map(({ key, value }) => ({
    key,
    value: value.attribs,
  })),
);

const htmlToMetaTags = flow(
  (root: cheerio.Root) => Object.entries(root('meta')),
  map(([key, value]) => ({ key, value })),
  filterMap((cur) =>
    cur.value.attribs
      ? O.some({ key: cur.key, attribs: cur.value.attribs })
      : O.none,
  ),
  filterMap((cur) => {
    const contentAttribute = O.fromNullable(cur.attribs['content']);
    const propertyAttribute = O.fromNullable(cur.attribs['property']);
    const nameAttribute = O.fromNullable(cur.attribs['name']);

    const propertyPair = sequenceS(O.option)({
      key: propertyAttribute,
      value: contentAttribute,
    });
    const namePair = sequenceS(O.option)({
      key: nameAttribute,
      value: contentAttribute,
    });
    return O.alt(() => namePair)(propertyPair);
  }),
);

// TODO: concurrentcy limit?
export const parallelTasks = <A>(limit: number) => (
  tasks: Array<Task<A>>,
): Task<Array<A>> => {
  return () => pmap(tasks, (t) => t(), { concurrency: limit });
};

// TODO: concurrency limit?
// TODO: pmap will still reject if any single promise rejects, which isn't what we want.
export const parallelTaskEithers = <E, A>(limit: number) => (
  tasks: Array<TE.TaskEither<E, A>>,
): Task<Array<E.Either<E, A>>> => () =>
  pmap(tasks, (t) => t(), { concurrency: limit });

export const parseMetaTags = flow(parseHtml, E.map(htmlToMetaTags));
export const parseLinkTags = flow(parseHtml, E.map(htmlToLinkTags));
