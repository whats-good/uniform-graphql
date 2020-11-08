import 'reflect-metadata';
import * as TE from 'fp-ts/lib/TaskEither';
import * as T from 'fp-ts/lib/Task';
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
      return parsed;
      // return parsed.items && parsed.items[0];
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
    elon: f(
      'http://localhost:4002/?action=display&bridge=Twitter&context=By+username&u=elonmusk&format=Atom',
    ),
    lukeBlog: f('https://lukesmith.xyz/rss.xml'),
    lukeYoutube: f(
      'http://localhost:4002/?action=display&bridge=Youtube&context=By+channel+id&c=UC2eYFnH61tmytImy1mTYvhA&duration_min=&duration_max=&format=Json',
    ),
  }),
  // TE.fold(
  //   (e) => {
  //     return T.of({
  //       // e,
  //       E: null,
  //     });
  //   },
  //   (a) => {
  //     return T.of({
  //       // a,
  //       e: null,
  //     });
  //   },
  // ),
);

const log = [];

const acquireFailure = TE.left('acquire failure');
const acquireSuccess = TE.right({ res: 'acquire success' });
const useSuccess = () => TE.right('use success');
const useFailure = () => TE.left('use failure');
const releaseSuccess = () =>
  TE.rightIO(() => {
    log.push('release success');
  });
const releaseFailure = () => TE.left('release failure');

const x = async () => {
  const a = await TE.bracket(acquireFailure, useSuccess, releaseSuccess)();
  const b = await TE.bracket(acquireSuccess, useFailure, releaseSuccess)();
  const c = await TE.bracket(acquireSuccess, useFailure, releaseFailure)();
  const d = await TE.bracket(acquireSuccess, useSuccess, releaseSuccess)();
  const e = await TE.bracket(acquireSuccess, useFailure, releaseSuccess)();
  const f = await TE.bracket(acquireSuccess, useSuccess, releaseFailure)();
  f;
};

const y = async () => {
  const yo = await TE.bracket(
    f('https://lukesmith.xyz/rss.xml'),
    (result) => {
      return TE.right(result);
    },
    (result, e) => {
      return TE.left(e);
    },
  );
};
