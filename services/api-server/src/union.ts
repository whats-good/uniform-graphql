import * as t from 'io-ts';
/* eslint @typescript-eslint/no-empty-interface: 0 */
export declare interface Codec<A, O = A>
  extends t.Decoder<unknown, A>,
    t.Encoder<A, O> {
  _A: A;
  _O: O;
}
export interface AnyCodec extends Codec<any, any> {}
export declare type OutputOf<C extends AnyCodec> = C['_O'];
export declare type TypeOf<C extends AnyCodec> = C['_A'];
export interface UnionC<CS extends [AnyCodec, AnyCodec, ...Array<AnyCodec>]>
  extends Codec<TypeOf<CS[number]>, OutputOf<CS[number]>> {}
export declare const union: <CS extends [AnyCodec, AnyCodec, ...AnyCodec[]]>(
  codecs: CS,
  name?: string,
) => UnionC<CS>;

const d = union([t.number, t.string, t.Int]);
