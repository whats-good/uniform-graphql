import * as t from 'io-ts';
import { decode } from '../utils';

const genericCodec = t.type({
  // link: t.string,
  items: t.array(
    t.type({
      link: t.string,
    }),
  ),
});

export const decodeGeneric = decode(genericCodec);
