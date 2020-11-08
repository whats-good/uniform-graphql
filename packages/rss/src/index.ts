import 'reflect-metadata';
import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';

import got from 'got';
import { pipe } from 'fp-ts/lib/function';

const request = (url: string) =>
  TE.tryCatch(
    () => got.get(url),
    (reason) => 'HANDLE THIS LATER', // TODO: handle this later
  );

const promise = pipe(
  'https://www.reddit.com/.rss',
  request,
  TE.map((response) => {
    if (response.statusCode !== 200) {
      // TODO: more sophisticated status code management
      return E.left({
        success: false,
        response,
      });
    } else {
      return E.right(response.body);
    }
  }),
)();
promise.then((here) => {
  // console.log({ here });
  console.log('DONE!');
});
