import * as t from 'io-ts';
import { decode } from '../utils';

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

export const decodeReddit = decode(redditCodec);
