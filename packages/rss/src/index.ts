import 'reflect-metadata';
import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';

import got, { Response } from 'got';
import { pipe } from 'fp-ts/lib/function';
import Parser from 'rss-parser';
import { sequenceS } from 'fp-ts/lib/Apply';

const parser = new Parser();

const request = (url: string) =>
  TE.tryCatch(
    () => got.get(url),
    (error) => error, // TODO: better error handling here
  );

const parse = (response: Response<string>) =>
  TE.tryCatch(
    async () => {
      const parsed = await parser.parseString(response.body);
      // return {
      // response,
      // parsed,
      // };
      // return parsed;
      return parsed.items && parsed.items[0];
    },
    (error) => error, // TODO: better error handling here
  );
// const URL = 'https://reddit.com/.rss';
const f = (url: string) => pipe(request(url), TE.chain(parse));

const promise = pipe(
  sequenceS(TE.taskEither)({
    reddit: f('https://reddit.com/.rss'),
    wikipedia: f(
      'https://en.wikipedia.org/w/index.php?title=Special:NewPages&feed=rss',
    ),
    bbc: f('http://feeds.bbci.co.uk/news/rss.xml'),
  }),
  TE.map((a) => {
    const { reddit } = a;
    console.log([
      reddit?.categories,
      reddit?.content,
      reddit?.contentSnippet,
      reddit?.creator,
      reddit?.enclosure,
      reddit?.guid,
      reddit?.isoDate,
      reddit?.link,
      reddit?.pubDate,
      reddit?.title,
    ]);

    return null;
  }),
);

promise();
