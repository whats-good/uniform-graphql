import * as t from 'io-ts';
import * as E from 'fp-ts/lib/Either';
import { flow } from 'fp-ts/lib/function';
import { toBaseError } from '../BaseError';

const redditCodec = t.type({
  feedUrl: t.string,
  lastBuildDate: t.string,
  link: t.string,
  title: t.string,
  items: t.array(
    t.type({
      author: t.string,
      content: t.string,
      contentSnippet: t.string,
      id: t.string,
      isoDate: t.string,
      link: t.string,
      pubDate: t.string,
      title: t.string,
    }),
  ),
});

const decode = <B extends t.Props>(codec: t.TypeC<B>) =>
  flow(
    codec.decode,
    E.mapLeft((errors) => toBaseError('validation error')(errors[0])),
  );

export const decodeReddit = decode(redditCodec);
