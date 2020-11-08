import 'reflect-metadata';
import * as TE from 'fp-ts/lib/TaskEither';
import * as t from 'io-ts';
import got from 'got';
import { flow, pipe } from 'fp-ts/lib/function';
import Parser from 'rss-parser';
import { sequenceS } from 'fp-ts/lib/Apply';
import { map } from 'fp-ts/lib/ReadonlyRecord';

const parser = new Parser();

const get = TE.tryCatchK(
  (url: string) => got.get(url),
  (error) => ({ error, also: 'get error' }),
); // TODO: better error handling
const parse = TE.tryCatchK(
  (xml: string) => parser.parseString(xml),
  (error) => ({
    error,
    also: 'parse error',
  }),
); // TODO: better error handling

const f = flow(
  get,
  TE.map((response) => response.body),
  TE.chain(parse),
);

const websites = {
  reddit: 'https://reddit.com/.rss',
  wikipedia:
    'https://en.wikipedia.org/w/index.php?title=Special:NewPages&feed=rss',
  bbc: 'http://feeds.bbci.co.uk/news/rss.xml',
  elon:
    'http://localhost:4002/?action=display&bridge=Twitter&context=By+username&u=elonmusk&format=Atom',
  lukeBlog: 'https://lukesmith.xyz/rss.xml',
  lukeYoutube:
    'http://localhost:4002/?action=display&bridge=Youtube&context=By+channel+id&c=UC2eYFnH61tmytImy1mTYvhA&duration_min=&duration_max=&format=Atom',
} as const;

const task = pipe(websites, map(f), sequenceS(TE.taskEither));

task().then((values) => {
  // TODO: allow partial failure.
  console.log({ values });
});
