<h1 align="center">Welcome to uniform-graphql 👋</h1>
<p>
  <!-- TODO: add docs and enable this <a href="this is the project documentation url" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a> -->
  <a href="#" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
  </a>
  <a href="https://github.com/whats-good/uniform-graphql/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>

</p>

.

⚠️ Disclaimer: This is a very young and unstable library. We’re still at `v0`. We have a pretty robust core, but everything is subject to change.

<!-- ### 🏠 [Homepage](this is the project homepage)

### ✨ [Demo](this is the project demo url) -->

# Install

```sh
npm install @whatsgood/uniform-graphql
```

⚠️ `graphql` is a peer dependency

# Examples

Go to the [examples](https://github.com/whats-good/uniform-graphql/tree/master/packages/examples) directory to see a demo

# Quickstart

## Recommended TSConfig

```json
{
  "compilerOptions": {
    "target": "es2018",
    "module": "commonjs",
    "lib": ["es2018", "esnext.asynciterable"],
    "strict": true
  }
}
```

# Deep Dive

## Motivation

## Philosophy

## Types

#### Built-in Scalars

### Nullability

### Custom Scalars

### Enums

### Input & Output Types

### Objects

### Lists

### Input Objects

### Unions

### Interfaces

## Resolvers

## Roadmap

- Stabilize the `t.scalar` type factory
- IOC & containers
- Documentation website
- Write tests (There are none right now)
- Design a logo (open to suggestions)
- Argument validation
- Remove lodash and become `0 dependency`
- Enable query building through the object syntax: `t.query({ currentUser: ..., todos: ...})` instead of `t.query('currentUser', ...)`
- Subscriptions support
- Enable schema-first features: mock an api without implementing it.

## Acknowledgements

`uniform-graphql` stands on the shoulders of 2 giants:

1. [type-graphql](https://github.com/MichalLytek/type-graphql): This is arguably the strongest code-first GraphQL solution for TypeScript. The author is very friendly and helpful, and has managed to create and maintain a great community. I urge you to go check them out and say hi.

2. [io-ts](https://github.com/gcanti/io-ts): The techniques I’ve found in this library have truly opened my mind to the limitless potential of TypeScript. `io-ts` is the library that convinced me that this library was possible.

> This library is `type-graphql` in substance and `io-ts` in form.

## Author

👤 **Kerem Kazan**

- Website: http://whatsgood.dog <!-- TODO: make this https, and actually put something up there  -->
- Twitter: [@MechanicalKazan](https://twitter.com/MechanicalKazan)
- Github: [@mechanical-turk](https://github.com/mechanical-turk)
- LinkedIn: [@keremkazan](https://linkedin.com/in/keremkazan)
