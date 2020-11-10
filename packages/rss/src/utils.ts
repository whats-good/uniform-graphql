import * as nodeHtmlParser from 'node-html-parser';
import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';
import got from 'got';
import { flow, pipe } from 'fp-ts/lib/function';
import Parser from 'rss-parser';

const parser = new Parser();

export const get = TE.tryCatchK(
  (url: string) => got.get(url),
  (error) => ({ error: E.toError(error), also: 'get error' }),
); // TODO: better error handling

export const parse = TE.tryCatchK(
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

export const parseHtml = TE.tryCatchK(
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
