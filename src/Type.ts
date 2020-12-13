import { GraphQLNonNull, GraphQLNullableType, GraphQLType } from 'graphql';
import { SemiTypeFactory } from './SemiTypeFactory';

export type Kind =
  | 'scalar'
  | 'outputobject'
  | 'interface'
  | 'union'
  | 'enum'
  | 'inputobject'
  | 'outputlist'
  | 'inputlist';

export abstract class SemiType<
  K extends Kind,
  N extends string,
  SB_G extends GraphQLNullableType,
  // TODO: make sure this cant be null or undefined
  SB_A,
  SB_R = SB_A
> {
  SB_G!: SB_G; // the semi-graphql type
  SB_A!: SB_A; // the actual static type
  SB_R!: SB_R; // the resolve type. It will be almost always equal to the static type, but not always.
  readonly name: N;
  readonly semiTypeFactory: SemiTypeFactory;
  abstract kind: K;
  abstract getFreshSemiGraphQLType(): SB_G;

  abstract readonly nullable: NullableTypeOf<SemiType<K, N, SB_G, SB_A>>;
  abstract readonly nonNullable: NonNullableTypeOf<SemiType<K, N, SB_G, SB_A>>;

  public getSemiGraphQLType = (): SB_G => {
    return this.semiTypeFactory.getSemiGraphQLTypeOf(
      this,
      this.getFreshSemiGraphQLType,
    );
  };

  constructor(params: { name: N; semiTypeFactory: SemiTypeFactory }) {
    this.name = params.name;
    this.semiTypeFactory = params.semiTypeFactory;
  }
}

export type AnySemiType<K extends Kind = any> = SemiType<K, any, any, any>;
export type AnyType<K extends Kind = any> = Type<
  K,
  any,
  any,
  AnySemiType<K>,
  any,
  any
>;
interface Kinded {
  kind: Kind;
}
interface Named {
  name: string;
}
export type NameOf<T extends Named> = T['name'];
export type KindOf<T extends Kinded> = T['kind'];
export type SemiTypeOf<ST extends AnySemiType> = ST['SB_A'];
export type SemiGraphQLTypeOf<ST extends AnySemiType> = ReturnType<
  ST['getSemiGraphQLType']
>;
export type TypeOf<B extends AnyType> = B['B_A'];
export type GraphQLTypeOf<B extends AnyType> = B['B_G'];

export type NullableTypeOf<ST extends AnySemiType> = Type<
  KindOf<ST>,
  ST['name'],
  SemiGraphQLTypeOf<ST>,
  ST,
  SemiTypeOf<ST> | null | undefined,
  ST['SB_R'] | null | undefined
>;

export type NonNullableTypeOf<ST extends AnySemiType> = Type<
  KindOf<ST>,
  ST['name'],
  GraphQLNonNull<any>,
  ST,
  SemiTypeOf<ST>,
  ST['SB_R']
>;

export class Type<
  K extends Kind,
  N extends ST['name'],
  B_G extends GraphQLType,
  ST extends AnySemiType<K>,
  B_A,
  B_R
> {
  B_A!: B_A;
  B_G!: B_G;
  B_R!: B_R;

  public readonly name: N;
  public readonly kind: K;
  public readonly semiType: ST;
  public readonly getGraphQLType: () => B_G;

  constructor(params: {
    name: ST['name'];
    kind: K;
    getGraphQLType: () => B_G;
    semiType: ST;
  }) {
    this.name = params.name;
    this.kind = params.kind;
    this.getGraphQLType = params.getGraphQLType;
    this.semiType = params.semiType;
  }

  static initNullable<ST extends AnySemiType>(st: ST): NullableTypeOf<ST> {
    return new Type({
      name: st.name,
      kind: st.kind,
      getGraphQLType: st.getSemiGraphQLType,
      semiType: st,
    });
  }

  static initNonNullable<ST extends AnySemiType>(
    st: ST,
  ): NonNullableTypeOf<ST> {
    return new Type({
      name: st.name,
      getGraphQLType: () => new GraphQLNonNull(st.getSemiGraphQLType()),
      kind: st.kind,
      semiType: st,
    });
  }
}
