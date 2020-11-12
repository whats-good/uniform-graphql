// import * as nodeHtmlParser from 'node-html-parser';
import cheerio from 'cheerio';
import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';
import * as O from 'fp-ts/lib/Option';
import got from 'got';
import { flow, pipe } from 'fp-ts/lib/function';
import Parser from 'rss-parser';
import { filterMap, map } from 'fp-ts/lib/Array';
import { sequenceS } from 'fp-ts/lib/Apply';
import { toBaseError } from './BaseError';
import { filter } from 'fp-ts/lib/NonEmptyArray';

const parser = new Parser();

// TODO: figure out a better error construction method.

export const get = TE.tryCatchK(
  (url: string) => got.get(url),
  toBaseError('get error'),
);

const parse = TE.tryCatchK(
  (xml: string) => parser.parseString(xml),
  toBaseError('parse error'),
);

export const fetchParse = flow(
  get,
  TE.map((response) => response.body),
  TE.chain(parse),
);

const parseHtml = (html: string) =>
  E.tryCatch(() => {
    return cheerio.load(html);
  }, toBaseError('html parsing error'));

export const parseMetaTags = flow(
  parseHtml,
  E.map(
    flow(
      (root) => Object.entries(root('meta')),
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
    ),
  ),
  E.map((allMetaAttributes) => {
    //
  }),
);
