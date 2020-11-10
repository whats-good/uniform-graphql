import 'reflect-metadata';
import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';
import * as O from 'fp-ts/lib/Option';
import * as t from 'io-ts';
import { flow, pipe } from 'fp-ts/lib/function';
import { head } from 'fp-ts/lib/Array';
import { fetchParse, get, parseHtml } from './utils';

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

// const task = pipe(websites, map(f), sequenceS(TE.taskEither));

// task().then((values) => {
//   // TODO: allow partial failure.
//   console.log({ values });
// });
