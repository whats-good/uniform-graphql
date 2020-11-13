import * as t from 'io-ts';
import { decode } from '../utils';

const genericFeedItemCodec = t.type({
  link: t.string,
});

const genericCodec = t.type({
  // link: t.string,
  items: t.array(genericFeedItemCodec),
});

export type GenericRssFeed = t.TypeOf<typeof genericCodec>;
export type GenericRssFeedItem = t.TypeOf<typeof genericFeedItemCodec>;

export const decodeGeneric = decode(genericCodec);
