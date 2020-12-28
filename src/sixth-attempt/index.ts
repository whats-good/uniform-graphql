import {
  GraphQLArgumentConfig,
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLString,
  GraphQLType,
  Kind,
  ValueNode,
} from 'graphql';
import { ApolloServer } from 'apollo-server-express';
import mapValues from 'lodash/mapValues';
import forEach from 'lodash/forEach';
import express from 'express';
import { GraphQLEnumType } from 'graphql/type/definition';

type FallbackGraphQLTypeFn = (typeContext: TypeContext) => GraphQLType;

export class TypeContext {
  private readonly savedSemiGraphQLTypes = new Map<string, GraphQLType>([
    // TODO: find a better solution than this. this is done to circumvent the "Schema must contain uniquely names types" error
    ['String', GraphQLString],
    ['Float', GraphQLFloat],
    ['Int', GraphQLInt],
    ['ID', GraphQLID],
    ['Boolean', GraphQLBoolean],
  ]);

  private readonly savedFieldResolvers = new Map<
    string,
    ResolveFn<any, any, any> | undefined
  >();

  private readonly savedRootQueryFields: {
    [key: string]: RootOutputField<any, any>;
  } = {};

  private readonly savedRootMutationFields: {
    [key: string]: RootOutputField<any, any>;
  } = {};

  public getSemiGraphQLType(
    semiType: AnySemiType,
    fallback: FallbackGraphQLTypeFn,
  ): GraphQLType {
    const existingType = this.savedSemiGraphQLTypes.get(semiType.name);
    if (existingType) {
      return existingType;
    } else {
      const newType = fallback(this);
      typeContextObject.savedSemiGraphQLTypes.set(semiType.name, newType);
      return this.getSemiGraphQLType(semiType, fallback);
    }
  }

  private getResolveFnKey = (params: {
    objectName: string;
    fieldName: string;
  }) => {
    return `${params.objectName}:${params.fieldName}`;
  };

  public getResolveFn = (params: {
    objectName: string;
    fieldName: string;
  }): ResolveFn<any, any, any> | undefined => {
    const resolveFnKey = this.getResolveFnKey(params);
    return this.savedFieldResolvers.get(resolveFnKey);
  };

  public setFieldResolvers = <T extends OutputObjectSemiType<any, any>>(
    t: T,
    resolvers: Partial<
      {
        [K in keyof T['fields']]: ResolveFnOfOutputFieldMapValue<
          T['fields'][K],
          T
        >;
      }
    >,
  ): void => {
    forEach(resolvers, (resolveFn, fieldName) => {
      const resolveFnKey = this.getResolveFnKey({
        fieldName,
        objectName: t.name,
      });
      this.savedFieldResolvers.set(resolveFnKey, resolveFn);
    });
  };

  public query = (fields: RootOutputFieldMap): void => {
    forEach(fields, (field, key) => {
      this.savedRootQueryFields[key] = field;
    });
  };

  public mutation = (fields: RootOutputFieldMap): void => {
    forEach(fields, (field, key) => {
      this.savedRootMutationFields[key] = field;
    });
  };

  public getSchema = ({
    rootQueryName = 'Query',
    rootMutationName = 'Mutation',
  }: {
    rootQueryName?: string;
    rootMutationName?: string;
  } = {}): GraphQLSchema => {
    return new GraphQLSchema({
      query: new GraphQLObjectType({
        name: rootQueryName,
        fields: mapValues(this.savedRootQueryFields, (field) =>
          field.getGraphQLFieldConfig(this),
        ),
      }),
      // TODO: uncomment
      // mutation: new GraphQLObjectType({
      //   name: rootMutationName,
      //   fields: mapValues(this.savedRootMutationFields, (field) =>
      //     field.getGraphQLFieldConfig(this),
      //   ),
      // }),
    });
  };
}

export abstract class SemiType<N extends string, T> {
  public readonly name: N;
  public readonly __T!: T;

  public constructor(params: { name: N }) {
    this.name = params.name;
  }

  // public abstract nullable(): Type<N, Maybe<T>, R>;
  // public abstract nonNullable(): Type<N, T, R>;

  protected abstract getFreshSemiGraphQLType(
    typeContext: TypeContext,
  ): GraphQLType;

  // TODO: handle recursive types to avoid infinite loops
  public getSemiGraphQLType = (typeContext: TypeContext): GraphQLType => {
    return typeContext.getSemiGraphQLType(this, this.getFreshSemiGraphQLType);
  };
}

type AnySemiType = SemiType<any, any>;
type TypeOf<T extends AnySemiType> = T['__T'];

type AnyScalarSemiType = ScalarSemiType<any, any>;
type AnyOutputObjectSemiType = OutputObjectSemiType<any, any>;
type AnyEnumSemiType = EnumSemiType<any, any>;

type InputSemiType<T> = SemiType<any, T> &
  (AnyScalarSemiType | AnyEnumSemiType);
type OutputSemiType<T> = SemiType<any, T> &
  (AnyScalarSemiType | AnyEnumSemiType | AnyOutputObjectSemiType);

type AnyInputSemiType = InputSemiType<any>;
type AnyOutputSemiType = OutputSemiType<any>;

export type Maybe<T> = T | null | undefined;

type ScalarSerializer<TInternal> = (value: TInternal) => Maybe<any>;
type ScalarValueParser<TInternal> = (value: unknown) => Maybe<TInternal>;
type ScalarLiteralParser<TInternal> = (
  valueNode: ValueNode,
  variables: Maybe<{ [key: string]: any }>, // TODO: try a better type for serializers
) => Maybe<TInternal>;

// serialize: GraphQLScalarSerializer<any>;
// parseValue: GraphQLScalarValueParser<any>;
// parseLiteral: GraphQLScalarLiteralParser<any>;

interface IScalarSemiTypeConstructor<N extends string, T> {
  name: N;
  description?: Maybe<string>;
  specifiedByUrl?: Maybe<string>;
  serialize: ScalarSemiType<N, T>['serializer'];
  parseValue: ScalarSemiType<N, T>['valueParser'];
  parseLiteral: ScalarSemiType<N, T>['literalParser'];
}

export class ScalarSemiType<N extends string, T> extends SemiType<N, T> {
  public readonly description?: Maybe<string>;
  public readonly specifiedByUrl?: Maybe<string>;

  private readonly serializer: ScalarSerializer<T>;
  private readonly valueParser: ScalarValueParser<T>;
  private readonly literalParser: ScalarLiteralParser<T>;

  constructor(params: IScalarSemiTypeConstructor<N, T>) {
    super(params);
    this.description = params.description;
    this.specifiedByUrl = params.specifiedByUrl;
    this.serializer = params.serialize;
    this.valueParser = params.parseValue;
    this.literalParser = params.parseLiteral;
  }

  protected getFreshSemiGraphQLType = (): GraphQLScalarType => {
    return new GraphQLScalarType({
      name: this.name,
      description: this.description,
      specifiedByUrl: this.specifiedByUrl,
      serialize: this.serializer,
      parseValue: this.valueParser,
      parseLiteral: this.literalParser,
    });
  };
}

interface IEnumValueConfig {
  description?: Maybe<string>;
  deprecationReason?: Maybe<string>;
}

export class EnumSemiType<
  N extends string,
  D extends { [key: string]: IEnumValueConfig | null }
> extends SemiType<N, keyof D> {
  private readonly valuesConfig: D;
  public readonly description?: Maybe<string>;

  constructor(params: {
    name: EnumSemiType<N, D>['name'];
    description?: EnumSemiType<N, D>['description'];
    values: EnumSemiType<N, D>['valuesConfig'];
  }) {
    super(params);
    this.valuesConfig = params.values;
  }

  protected getFreshSemiGraphQLType = (): GraphQLEnumType => {
    return new GraphQLEnumType({
      name: this.name,
      values: mapValues(this.valuesConfig, (value, key) => {
        return {
          description: value?.description,
          deprecationReason: value?.deprecationReason,
          value: key,
        };
      }),
      description: this.description,
    });
  };

  public get values(): { [K in keyof D]: K } {
    return mapValues(this.valuesConfig, (value, key) => key) as any;
  }
}

const String = new ScalarSemiType<'String', string>({
  name: 'String',
  parseLiteral: GraphQLString.parseLiteral,
  parseValue: GraphQLString.parseValue,
  serialize: GraphQLString.serialize,
  description: GraphQLString.description,
  specifiedByUrl: GraphQLString.specifiedByUrl,
});

const Int = new ScalarSemiType<'Int', number>({
  name: 'Int',
  parseLiteral: GraphQLInt.parseLiteral,
  parseValue: GraphQLInt.parseValue,
  serialize: GraphQLInt.serialize,
  description: GraphQLInt.description,
  specifiedByUrl: GraphQLInt.specifiedByUrl,
});

const Boolean = new ScalarSemiType<'Boolean', boolean>({
  name: 'Boolean',
  parseLiteral: GraphQLBoolean.parseLiteral,
  parseValue: GraphQLBoolean.parseValue,
  serialize: GraphQLBoolean.serialize,
  description: GraphQLBoolean.description,
  specifiedByUrl: GraphQLBoolean.specifiedByUrl,
});

const Float = new ScalarSemiType<'Float', number>({
  name: 'Float',
  parseLiteral: GraphQLFloat.parseLiteral,
  parseValue: GraphQLFloat.parseValue,
  serialize: GraphQLFloat.serialize,
  description: GraphQLFloat.description,
  specifiedByUrl: GraphQLFloat.specifiedByUrl,
});

const ID = new ScalarSemiType<'ID', number | string>({
  name: 'ID',
  parseLiteral: GraphQLID.parseLiteral,
  parseValue: GraphQLID.parseValue,
  serialize: GraphQLID.serialize,
  description: GraphQLID.description,
  specifiedByUrl: GraphQLID.specifiedByUrl,
});

const Membership = new EnumSemiType({
  name: 'Membership',
  values: {
    free: null,
    enterprise: {
      deprecationReason: 'deprecated because..',
    },
    paid: null,
  },
});

class InputField<T extends AnyInputSemiType> {
  public readonly type: T;
  public readonly defaultValue?: TypeOf<T>; // TODO: make this nonNullable
  public readonly deprecationReason?: Maybe<string>;
  public readonly description?: Maybe<string>;

  constructor(params: {
    type: InputField<T>['type'];
    defaultValue?: InputField<T>['defaultValue'];
    deprecationReason?: InputField<T>['deprecationReason'];
    description?: InputField<T>['description'];
  }) {
    this.type = params.type;
    this.defaultValue = params.defaultValue;
    this.deprecationReason = params.deprecationReason;
    this.description = params.description;
  }

  getGraphQLArgumentConfig = (
    typeContext: TypeContext,
  ): GraphQLArgumentConfig => {
    return {
      // TODO: use field based nullability here.
      type: this.type.getSemiGraphQLType(typeContext) as any,
      defaultValue: this.defaultValue,
      deprecationReason: this.deprecationReason,
      description: this.description,
    };
  };
}

interface InputFieldMap {
  [key: string]: InputField<any>;
}

type ResolveReturnTypeOf<T> = T | Promise<T> | (() => Promise<T>);

type ResolveFn<T, A, R> = (
  root: R,
  args: A,
  // context: C, TODO: find a way to involve the context
) => ResolveReturnTypeOf<T>;

type ResolveFnOfOutputFieldMapValue<
  F extends OutputFieldMapValue<any, any>,
  R extends Maybe<OutputObjectSemiType<any, any>> = undefined
> = ResolveFn<
  TypeOf<Unthunked<F>['type']>,
  TypeOfInputFieldMap<Unthunked<F>['args']>,
  R extends OutputObjectSemiType<any, any> ? TypeOf<R> : undefined
>;

interface IOutputFieldConstructorArgs<
  T extends AnyOutputSemiType,
  A extends InputFieldMap
> {
  type: OutputField<T, A>['type'];
  args?: OutputField<T, A>['args'];
  deprecationReason?: OutputField<T, A>['deprecationReason'];
  description?: OutputField<T, A>['description'];
}

interface IOutputField<T extends AnyOutputSemiType, A extends InputFieldMap> {
  readonly type: T;
  readonly args: A;
  readonly deprecationReason?: Maybe<string>;
  readonly description?: Maybe<string>;
}

class OutputField<T extends AnyOutputSemiType, A extends InputFieldMap>
  implements IOutputField<T, A> {
  public readonly type: T;
  public readonly args: A;
  public readonly deprecationReason?: Maybe<string>;
  public readonly description?: Maybe<string>;

  constructor(params: IOutputFieldConstructorArgs<T, A>) {
    this.type = params.type;
    this.args = params.args || ({} as any);
    this.deprecationReason = params.deprecationReason;
    this.description = params.description;
  }

  public getGraphQLFieldConfig = (params: {
    typeContext: TypeContext;
    objectName: string;
    fieldName: string;
  }): GraphQLFieldConfig<any, any, any> => {
    return {
      // TODO: use field based nullability here.
      type: this.type.getSemiGraphQLType(params.typeContext) as any,
      args: mapValues(this.args, (field) => {
        const unthunkedField = unthunk(field);
        return unthunkedField.getGraphQLArgumentConfig(params.typeContext);
      }),
      deprecationReason: this.deprecationReason,
      description: this.description,
      resolve: params.typeContext.getResolveFn(params),
    };
  };
}

type IRootOutputFieldConstructorParams<
  T extends AnyOutputSemiType,
  A extends InputFieldMap
> = IOutputFieldConstructorArgs<T, A> & {
  resolve: RootOutputField<T, A>['resolve'];
};

class RootOutputField<T extends AnyOutputSemiType, A extends InputFieldMap>
  implements IOutputField<T, A> {
  public readonly type: T;
  public readonly args: A;
  public readonly deprecationReason?: Maybe<string>;
  public readonly description?: Maybe<string>;
  public readonly resolve: ResolveFn<
    TypeOf<T>,
    TypeOfInputFieldMap<A>,
    undefined
  >;

  constructor(params: IRootOutputFieldConstructorParams<T, A>) {
    this.type = params.type;
    this.args = params.args || ({} as any);
    this.deprecationReason = params.deprecationReason;
    this.description = params.description;
    this.resolve = params.resolve;
  }

  public getGraphQLFieldConfig = (
    typeContext: TypeContext,
  ): GraphQLFieldConfig<any, any, any> => {
    return {
      // TODO: use the field based nullability here.
      type: this.type.getSemiGraphQLType(typeContext) as any,
      args: mapValues(this.args, (field) => {
        const unthunkedField = unthunk(field);
        return unthunkedField.getGraphQLArgumentConfig(typeContext);
      }),
      deprecationReason: this.deprecationReason,
      description: this.description,
      resolve: this.resolve,
    };
  };
}

interface IOutputObjectSemiTypeConstructorParams<
  N extends string,
  F extends OutputFieldMap
> {
  name: OutputObjectSemiType<N, F>['name'];
  fields: OutputObjectSemiType<N, F>['fields'];
  description?: OutputObjectSemiType<N, F>['description'];
}

class OutputObjectSemiType<
  N extends string,
  F extends OutputFieldMap
> extends SemiType<N, TypeOfOutputFieldMap<F>> {
  public readonly fields: F;
  public readonly description?: Maybe<string>;

  constructor(params: IOutputObjectSemiTypeConstructorParams<N, F>) {
    super(params);
    this.fields = params.fields;
    this.description = params.description;
  }

  getFreshSemiGraphQLType = (typeContext: TypeContext): GraphQLType => {
    return new GraphQLObjectType({
      name: this.name,
      fields: () =>
        mapValues(this.fields, (field, fieldName) => {
          const unthunkedField = unthunk(field);
          return unthunkedField.getGraphQLFieldConfig({
            objectName: this.name,
            fieldName,
            typeContext,
          });
        }),
      description: this.description,
      // interfaces, // TODO: implement
      // isTypeOf, // TODO: implement
      // resolveObject, // TODO: implement
    });
  };
}

const allOkayUserFields = {
  firstName: new OutputField({
    type: String,
    args: {
      x: new InputField({
        type: String,
      }),
      y: new InputField({
        type: String,
      }),
      z: new InputField({
        type: String,
      }),
    },
  }),
  lastName: new OutputField({
    type: String,
  }),
  middleName: new OutputField({
    type: String,
  }),
  membership: new OutputField({
    type: Membership,
  }),
};

type UserType = OutputObjectSemiType<
  'User',
  typeof allOkayUserFields & {
    self: OutputFieldMapValue<UserType>;
    pet: OutputFieldMapValue<AnimalType>;
  }
>;

export const Datetime = new ScalarSemiType<'Datetime', Date>({
  name: 'Datetime',
  parseLiteral: (ast) => {
    if (ast.kind === Kind.STRING) {
      return new Date(Date.parse(ast.value));
    }
    return null;
  },
  parseValue: (value) => {
    if (typeof value === 'string') {
      return new Date(value);
    }
    return null;
  },
  serialize: (value) => {
    return value.toISOString();
  },
  description: 'A datetime wrapper for the Date class',
});

const User: UserType = new OutputObjectSemiType({
  name: 'User',
  get fields() {
    return {
      ...allOkayUserFields,
      self: () =>
        new OutputField({
          type: User,
          args: {
            x: new InputField({
              type: String,
            }),
          },
        }),
      pet: () =>
        new OutputField({
          type: Animal,
        }),
    };
  },
});

const allOkayAnimalFields = {
  name: new OutputField({
    type: String,
  }),
  birthDate: new OutputField({
    type: Datetime,
  }),
};

type AnimalType = OutputObjectSemiType<
  'Animal',
  typeof allOkayAnimalFields & {
    owner: OutputFieldMapValue<UserType>;
  }
>;
const Animal: AnimalType = new OutputObjectSemiType({
  name: 'Animal',
  get fields() {
    return {
      ...allOkayAnimalFields,
      owner: new OutputField({
        type: User,
      }),
    };
  },
});

type TypeOfInputFieldMap<T extends InputFieldMap> = {
  [K in keyof T]: TypeOf<Unthunked<T[K]>['type']>;
};

type Thunk<T> = () => T;
type Thunkable<T> = T | Thunk<T>;
type Unthunked<T extends Thunkable<any>> = T extends Thunk<any>
  ? ReturnType<T>
  : T;

const unthunk = <T extends Thunkable<any>>(t: T): Unthunked<T> => {
  if (typeof t === 'function') {
    return t();
  } else {
    return t as any;
  }
};

type OutputFieldMapValue<
  T extends AnyOutputSemiType,
  A extends InputFieldMap = InputFieldMap
> = Thunkable<OutputField<T, A>>;
interface OutputFieldMap {
  [key: string]: OutputFieldMapValue<any, any>;
}

interface RootOutputFieldMap {
  [key: string]: RootOutputField<any, any>;
}

type TypeOfOutputFieldMap<T extends OutputFieldMap> = {
  [K in keyof T]: TypeOf<Unthunked<T[K]>['type']>;
};

const typeContextObject = new TypeContext();

typeContextObject.setFieldResolvers(User, {
  firstName: (root, args) => {
    return root.firstName + '-' + args.x;
  },
  lastName: (root, args) => {
    return root.lastName;
  },
});

typeContextObject.query({
  currentUser: new RootOutputField({
    type: User,
    args: {},
    resolve: () => {
      return {
        firstName: 'a',
        lastName: 'yoyo',
        middleName: 'yoyoyo',
        get pet() {
          return {
            birthDate: new Date(),
            name: 'Pig',
            owner: this,
          };
        },
        get self() {
          return this;
        },
        membership: Membership.values.enterprise,
      };
    },
  }),

  currentAnimal: new RootOutputField({
    type: Animal,
    args: {},
    resolve: () => {
      const owner = {
        firstName: 'first name',
        lastName: 'last name',
        middleName: 'middle name',
        membership: Membership.values.free,
        get self() {
          return this;
        },
        get pet() {
          return {
            birthDate: new Date(),
            name: 'Pig',
            owner: this,
          };
        },
      };
      return owner.pet;
    },
  }),
});

// typeContextObject.mutation({
//   signup: new RootOutputField({
//     type: User,
//     args: {},
//     resolve: () => {
//       return null;
//     },
//   }),
// });

const schema = typeContextObject.getSchema();

const apolloServer = new ApolloServer({
  schema,
});

const PORT = 4001;

const start = () => {
  const app = express();
  apolloServer.applyMiddleware({ app });

  // const url = id.getFreshSemiGraphQLType().specifiedByUrl;
  app.listen({ port: PORT }, () => {
    console.log(
      `🚀 Server ready at http://localhost:${PORT}${apolloServer.graphqlPath}`,
    );
  });
};

start();
