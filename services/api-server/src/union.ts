import * as t from 'io-ts';
/* eslint @typescript-eslint/no-empty-interface: 0 */
export declare interface Type<A, O = A, I = unknown>
  extends t.Decoder<I, A>,
    t.Encoder<A, O> {
  _A: A;
  _O: O;
}
export interface Mixed extends Type<any, any, unknown> {}
export interface Any extends Type<any, any, any> {}
export declare interface UnionType<
  CS extends Array<Any>,
  A = any,
  O = A,
  I = unknown
> extends t.Type<A, O, I> {
  readonly types: CS;
  /**
   * @since 1.0.0
   */
  readonly _tag: 'UnionType';
}
export declare type OutputOf<C extends Any> = C['_O'];
export declare type TypeOf<C extends Any> = C['_A'];
export interface UnionC<CS extends [Mixed, Mixed, ...Array<Mixed>]>
  extends UnionType<CS, TypeOf<CS[number]>, OutputOf<CS[number]>, unknown> {}
export declare const union: <CS extends [Mixed, Mixed, ...Mixed[]]>(
  codecs: CS,
  name?: string,
) => UnionC<CS>;

union([t.number, t.string, t.Int]);
