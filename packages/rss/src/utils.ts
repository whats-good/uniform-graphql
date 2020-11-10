// import * as nodeHtmlParser from 'node-html-parser';
import cheerio from 'cheerio';
import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';
import * as O from 'fp-ts/lib/Option';
import got from 'got';
import { flow, pipe } from 'fp-ts/lib/function';
import Parser from 'rss-parser';
import { filterMap, map } from 'fp-ts/lib/Array';

const parser = new Parser();

export const get = TE.tryCatchK(
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

export const fetchParse = flow(
  get,
  TE.map((response) => response.body),
  TE.chain(parse),
);

const parseHtml = (html: string) =>
  E.tryCatch(
    () => {
      return cheerio.load(html);
    },
    (e) => ({
      error: E.toError(e),
      also: 'html parsing error',
    }),
  );

export const parseMetaTags = flow(
  parseHtml,
  E.map((root) => {
    return pipe(
      Object.entries(root('meta')),
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
        return O.isSome(propertyAttribute) && O.isSome(contentAttribute)
          ? O.some({
              key: propertyAttribute.value,
              value: contentAttribute.value,
            })
          : O.isSome(nameAttribute) && O.isSome(contentAttribute)
          ? O.some({
              key: nameAttribute.value,
              value: contentAttribute.value,
            })
          : O.none;
      }),
      (allMetaAttributes) => {
        //
      },
    );
  }),
);
