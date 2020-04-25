# apollo-typed-documents

Provides graphql-codegen plugins (https://graphql-code-generator.com/) for type safe GraphQL documents (`DocumentNode`).

It allows functions to accept a generic `TypedDocumentNode<TVariables, TData>` so that types of other arguments or the return type can be inferred.

It is helpful for TypeScript projects but also if used only within an IDE, e.g. it works extremely well with VSCode (uses TypeScript behind the scenes).

```sh
$ yarn add apollo-typed-documents
```

## codegenTypedDocuments

Generates TypeScript typings for `.graphql` files.

Similar to `@graphql-codegen/typescript-graphql-files-modules` (https://graphql-code-generator.com/docs/plugins/typescript-graphql-files-modules).

The difference is that is uses generic types, so that you have type safety with Apollo (e.g. `useQuery` / `useMutation`).

### Install

`codegen.yml`:

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./examples/docs/codegenTypedDocuments.yml) -->
<!-- The below code snippet is automatically added from ./examples/docs/codegenTypedDocuments.yml -->
```yml
schema: ./schema.graphql
documents: ./documents/*.graphql
generates:
  ./codegenTypedDocuments.d.ts:
    plugins:
      - apollo-typed-documents/lib/codegenTypedDocuments
    config:
      typesModule: "@codegen-types"
  ./codegenTypes.ts:
    plugins:
      - typescript
      - typescript-operations
```
<!-- AUTO-GENERATED-CONTENT:END -->

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@codegen-types": ["codegenTypes.ts"],
      "@apollo/react-hooks": [
        "./node_modules/apollo-typed-documents/lib/reactHooks.d.ts"
      ]
    }
  }
}
```

`@codegen-types` points to the output of `typescript-operations` graphql-codegen plugin.

This alias is required, because in ambient module declarations (`.d.ts`) only non relative imports are allowed.

`@apollo/react-hooks` overrides the types to have generic hooks in your code: [reference](src/reactHooks.ts)

If you don't have a TypeScript project but instead just want to get type safety and code completion,
the configuration needs to have more options set: [reference](examples/docs/tsconfig.json)

### Example

`./documents/authors.graphql`:

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./examples/docs/documents/authors.graphql) -->
<!-- The below code snippet is automatically added from ./examples/docs/documents/authors.graphql -->
```graphql
query authors {
  authors {
    id
    name
    description
    books {
      id
      title
    }
  }
}
```
<!-- AUTO-GENERATED-CONTENT:END -->

`./documents/createAuthor.graphql`:

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./examples/docs/documents/createAuthor.graphql) -->
<!-- The below code snippet is automatically added from ./examples/docs/documents/createAuthor.graphql -->
```graphql
mutation createAuthor($input: AuthorInput!) {
  createAuthor(input: $input) {
    id
    name
    description
    books {
      id
      title
    }
  }
}
```
<!-- AUTO-GENERATED-CONTENT:END -->

`./codegenTypedDocuments.d.ts` (generated):

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./examples/docs/codegenTypedDocuments.d.ts) -->
<!-- The below code snippet is automatically added from ./examples/docs/codegenTypedDocuments.d.ts -->
```ts
declare module "*/authors.graphql" {
  import { TypedDocumentNode } from "apollo-typed-documents";
  import { AuthorsQuery, AuthorsQueryVariables } from "@codegen-types";
  export const authors: TypedDocumentNode<AuthorsQueryVariables, AuthorsQuery>;
  export default authors;
}

declare module "*/createAuthor.graphql" {
  import { TypedDocumentNode } from "apollo-typed-documents";
  import { CreateAuthorMutation, CreateAuthorMutationVariables } from "@codegen-types";
  export const createAuthor: TypedDocumentNode<CreateAuthorMutationVariables, CreateAuthorMutation>;
  export default createAuthor;
}
```
<!-- AUTO-GENERATED-CONTENT:END -->

`./AuthorList.js`:

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./examples/docs/AuthorList.js) -->
<!-- The below code snippet is automatically added from ./examples/docs/AuthorList.js -->
```js
import { useMutation, useQuery } from "@apollo/react-hooks";
import React from "react";

import authorsQuery from "./documents/authors.graphql";
import createAuthorMutation from "./documents/createAuthor.graphql";

const AuthorList = () => {
  // Type of `data` is inferred (AuthorsQuery)
  const { data } = useQuery(authorsQuery);
  const [createAuthor] = useMutation(createAuthorMutation);

  return (
    <>
      <ul>
        {data?.authors.map((author) => (
          <li key={author.id}>{author.name}</li>
        ))}
      </ul>
      <button
        onClick={() =>
          // Type of variables is inferred (CreateAuthorMutationVariables)
          createAuthor({
            variables: { input: { name: "Foo", books: [{ title: "Bar" }] } },
          })
        }
      >
        Add
      </button>
    </>
  );
};

export default AuthorList;
```
<!-- AUTO-GENERATED-CONTENT:END -->

### Notes for `create-react-app` users

`create-react-app` uses `graphql.macro` for loading of `.graphql` files (https://create-react-app.dev/docs/loading-graphql-files/).

Because the `codegenTypedDocuments` plugin generates ambient module declarations for those `.graphql` files, they must be imported as regular modules (`commonjs`), otherwise TypeScript can't know its type.

You can use the babel plugin `babel-plugin-import-graphql`, but then you need to either `eject` or use `react-app-rewired`/`customize-cra`.

Follow install instructions for `react-app-rewired`/`customize-cra`:

- https://github.com/timarney/react-app-rewired/
- https://github.com/arackaf/customize-cra

Install `babel-plugin-import-graphql`

```
$ yarn add babel-plugin-import-graphql
```

Add to `.babelrc`:

```json
{
  "presets": ["react-app"],
  "plugins": ["babel-plugin-import-graphql"]
}
```

Also, if you have a `create-react-app` project without TypeScript, the `tsconfig.json` must not be placed in your app root folder, because `create-react-app` uses this file to detect a TypeScript project: [reference](https://github.com/facebook/create-react-app/blob/v3.4.1/packages/react-scripts/scripts/utils/verifyTypeScriptSetup.js#L49).

All `.ts`/`.d.ts` files must be outside of your `src` folder: [reference](https://github.com/facebook/create-react-app/blob/v3.4.1/packages/react-scripts/scripts/utils/verifyTypeScriptSetup.js#L50)

A solution is to put the `tsconfig.json` in the parent folder:

```
tsconfig.json
backend/
frontend/
  codegen.yml
  codegenTypedDocuments.d.ts
  codegenTypes.ts
  src/
    apolloMock.js
    ...
```

An example `tsconfig.json`:

```json
{
  "comment": "File is in root folder so that create-react-app doesn't detect a typescript app",
  "compilerOptions": {
    "rootDir": "frontend",
    "typeRoots": ["frontend/node_modules/@types"],
    "baseUrl": "frontend",
    "paths": {
      "@codegen-types": ["codegenTypes.ts"],
      "@apollo/react-hooks": [
        "node_modules/apollo-typed-documents/lib/reactHooks.d.ts"
      ]
    },
    "allowJs": true,
    "checkJs": true,
    "noEmit": true,
    "jsx": "react",
    "esModuleInterop": true,
    "moduleResolution": "node",
    "alwaysStrict": true,
    "strictNullChecks": true,
    "target": "ES2018"
  },
  "include": [
    "frontend/src/**/*",
    "frontend/*.ts",
    "frontend/*.d.ts",
    "frontend/node_modules/react-scripts/lib/react-app.d.ts",
    "frontend/node_modules/babel-plugin-react-intl-auto/types.d.ts"
  ]
}
```

## codegenApolloMock

Creates a helper method to easily create mocks for Apollo `MockedProvider` (https://www.apollographql.com/docs/react/api/react-testing/#mockedprovider).

The returned object is guaranteed to conform to the GraphQL Schema of the query / mutation: [reference](src/createApolloMock.ts).

For required (non-null) fields which are not provided (in data / variables), it will use a default value (e.g. `"Author-id"`).

For optional fields which are not provided (in data / variables), it will use `undefined` for variables and `null` for data.

Works for any nested selections (data) and any nested inputs (variables).

It will include `__typename` in data by default. This can be deactivated as an option:

```js
apolloMock(documentNode, variables, data, { addTypename: false });
```

When used together with `codegenTypedDocuments` the data and variables are type checked (type inference).

### Install

`codegen.yml`

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./examples/docs/codegenApolloMock.yml) -->
<!-- The below code snippet is automatically added from ./examples/docs/codegenApolloMock.yml -->
```yml
schema: ./schema.graphql
documents: ./documents/*.graphql
generates:
  ./apolloMock.js:
    plugins:
      - apollo-typed-documents/lib/codegenApolloMock
```
<!-- AUTO-GENERATED-CONTENT:END -->

### Example

`./schema.graphql`:

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./examples/docs/schema.graphql) -->
<!-- The below code snippet is automatically added from ./examples/docs/schema.graphql -->
```graphql
type Author {
  id: ID!
  name: String!
  description: String
  books: [Book!]!
}

type Book {
  id: ID!
  title: String!
}

input AuthorInput {
  name: String!
  description: String
  books: [BookInput!]!
}

input BookInput {
  title: String!
}

type Query {
  authors: [Author!]!
}

type Mutation {
  createAuthor(input: AuthorInput!): Author!
}

schema {
  query: Query
  mutation: Mutation
}
```
<!-- AUTO-GENERATED-CONTENT:END -->

`./documents/authors.graphql`:

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./examples/docs/documents/authors.graphql) -->
<!-- The below code snippet is automatically added from ./examples/docs/documents/authors.graphql -->
```graphql
query authors {
  authors {
    id
    name
    description
    books {
      id
      title
    }
  }
}
```
<!-- AUTO-GENERATED-CONTENT:END -->

`./documents/createAuthor.graphql`:

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./examples/docs/documents/createAuthor.graphql) -->
<!-- The below code snippet is automatically added from ./examples/docs/documents/createAuthor.graphql -->
```graphql
mutation createAuthor($input: AuthorInput!) {
  createAuthor(input: $input) {
    id
    name
    description
    books {
      id
      title
    }
  }
}
```
<!-- AUTO-GENERATED-CONTENT:END -->

`./apolloMock.js` (generated):

See: [reference](examples/docs/apolloMock.js)

`./apolloMock.test.js`:

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./examples/docs/apolloMock.test.js) -->
<!-- The below code snippet is automatically added from ./examples/docs/apolloMock.test.js -->
```js
import apolloMock from "./apolloMock";
import authors from "./documents/authors.graphql";
import createAuthor from "./documents/createAuthor.graphql";

describe("apolloMock", () => {
  it("procudes the minimal output that is valid according to graphql schema", () => {
    expect(apolloMock(authors, {}, {})).toEqual({
      request: {
        query: authors,
        variables: {},
      },
      result: {
        data: {
          authors: [],
        },
      },
    });

    expect(apolloMock(authors, {}, { authors: [{}] })).toEqual({
      request: {
        query: authors,
        variables: {},
      },
      result: {
        data: {
          authors: [
            {
              __typename: "Author",
              id: "Author-id",
              name: "Author-name",
              description: null,
              books: [],
            },
          ],
        },
      },
    });

    expect(
      apolloMock(
        createAuthor,
        { input: { name: "Foo", books: [{ title: "Bar" }] } },
        { createAuthor: { name: "Foo", books: [{ title: "Bar" }] } }
      )
    ).toEqual({
      request: {
        query: createAuthor,
        variables: {
          input: {
            name: "Foo",
            description: undefined,
            books: [{ title: "Bar" }],
          },
        },
      },
      result: {
        data: {
          createAuthor: {
            __typename: "Author",
            id: "Author-id",
            name: "Foo",
            description: null,
            books: [
              {
                __typename: "Book",
                id: "Book-id",
                title: "Bar",
              },
            ],
          },
        },
      },
    });
  });
});
```
<!-- AUTO-GENERATED-CONTENT:END -->
