import 'reflect-metadata';
import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';
import * as O from 'fp-ts/lib/Option';
import * as t from 'io-ts';
import { flow, pipe } from 'fp-ts/lib/function';
import { head } from 'fp-ts/lib/Array';
import { fetchParse, get, parseHtml } from './utils';

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

const decodeReddit = flow(
  redditCodec.decode,
  E.map((redditFeed) => {
    return {
      feedTitle: redditFeed.title,
      feedLength: redditFeed.items.length,
      firstItem: head(redditFeed.items),
    };
  }),
  // E.mapLeft(toError('decodingError')),
);

const fReddit = flow(fetchParse, TE.map(decodeReddit));
fReddit('https://reddit.com/.rss')()
  .then((value) => {
    if (E.isRight(value)) {
      if (E.isRight(value.right)) {
        return value.right.right.firstItem;
      }
    }
    return O.none;
  })
  .then((firstItem) => {
    if (O.isSome(firstItem)) {
      return pipe(
        firstItem.value.link,
        get,
        TE.map((response) => response.body),
        TE.chain(parseHtml),
        TE.map((html) => {
          // TODO: here
          // return html.childNodes.;
        }),
      )();
    }
    return null;
  });
