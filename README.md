# apollo-typed-documents

Provides codegen plugins (https://graphql-code-generator.com/) for type safe apollo documents.

It allows functions to accept a generic `TypedDocumentNode<TVariables, TData>` so that types of other arguments or the return type can be inferred.

It is helpful for typescript projects but also if used only within an IDE, e.g. it works extremely well with VSCode (uses typescript behind the scenes).

```sh
$ yarn add apollo-typed-documents
```

## codegenTypedDocuments

Generates TypeScript typings for `.graphql` files.

Similar to `@graphql-codegen/typescript-graphql-files-modules` (https://graphql-code-generator.com/docs/plugins/typescript-graphql-files-modules).

The difference is that is uses generic types, so that you have type safety with Apollo (e.g. `useQuery` / `useMutation`).

### Install

`codegen.yml`:

```yml
schema: http://localhost:8000/graphql/
documents: ./src/**/*.gql
generates:
  ./src/codegenTypedDocuments.d.ts:
    plugins:
      - apollo-typed-documents/lib/codegenTypedDocuments
    config:
      typesModule: "@codegen-types"
  ./src/codegenTypes.ts:
    plugins:
      - typescript
      - typescript-operations
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@codegen-types": ["./codegenTypes.ts"],
      "@apollo/react-hooks": [
        "./node_modules/apollo-typed-documents/lib/reactHooks.d.ts"
      ]
    }
  }
}
```

`@codegen-types` points to the output of `typescript-operations` codegen plugin.

This alias is required, because in ambient module declarations (`.d.ts`) only non relative imports are allowed.

`@apollo/react-hooks` overrides the types to have generic hooks in your code: [reference](src/reactHooks.ts)

### Example

`passwordChangeMutation.gql`:

```graphql
mutation passwordChange(
  $oldPassword: String!
  $newPassword1: String!
  $newPassword2: String!
) {
  passwordChange(
    oldPassword: $oldPassword
    newPassword1: $newPassword1
    newPassword2: $newPassword2
  ) {
    success
    errors
  }
}
```

`codegenTypedDocuments.d.ts` (generated):

```ts
declare module "*/passwordChangeMutation.gql" {
  import { TypedDocumentNode } from "apollo-typed-documents";
  import {
    PasswordChangeMutation,
    PasswordChangeMutationVariables,
  } from "@codegen-types";
  export const passwordChange: TypedDocumentNode<
    PasswordChangeMutationVariables,
    PasswordChangeMutation
  >;
  export default passwordChange;
}
```

`changePassword.js`:

```js
import passwordChangeMutation from "./passwordChangeMutation.gql";
import { useMutation } from "@apollo/react-hooks";

const ChangePassword = () => {
  const [changePassword] = useMutation(
    passwordChangeMutation,
    {
      onCompleted: data => {
        // Type of `data` is inferred (PasswordChangeMutation)
        // IDE / tsc complains invalid access of data
        // IDE can provide code completion (IntelliSense)
        if (data.passwordChange?.success) {
          history.push("/")
        }
      }
    }
  )

  useEffect(() => {
    // Type of variables is inferred (PasswordChangeMutationVariables)
    verifyAccount({ variables: { token } })
  })

  return ...
}
```

### Notes for `create-react-app` users

`create-react-app` uses `graphql.macro` for loading of `.graphql` files (https://create-react-app.dev/docs/loading-graphql-files/).

Because the `codegenTypedDocuments` plugin generates ambient module declarations for those `.graphql` files, they must be imported as regular modules (`commonjs`), otherwise typescript can't know its type.

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

Also, if you have a `create-react-app` project without typescript, the `tsconfig.json` must not be placed in your app root folder, because `create-react-app` uses this file to detect a typescript project [reference](https://github.com/facebook/create-react-app/blob/v3.4.1/packages/react-scripts/scripts/utils/verifyTypeScriptSetup.js#L49).

All `.ts`/`.d.ts` files must be outside of your `src` folder [reference](https://github.com/facebook/create-react-app/blob/v3.4.1/packages/react-scripts/scripts/utils/verifyTypeScriptSetup.js#L50)

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

The returned object is guaranteed to conform to the GraphQL Schema [reference](src/createApolloMock.ts).

However it will only contain the fields which are selected in the query / mutation.

For fields which are required but not given, it will return a default value (e.g. `"UserType-id"`).

Works for any nested selections.

When used together with `codegenTypedDocuments` the test data is type checked (type inference).

### Install

`codegen.yml`

```yml
schema: http://localhost:8000/graphql/
documents: ./src/**/*.gql
generates:
  ./src/apolloMock.js:
    plugins:
      - apollo-typed-documents/lib/codegenApolloMock
```

### Example

`schema.graphql`:

```graphql
type TaskTypeConnection {
  edges: [TaskTypeEdge]!
}

type TaskTypeEdge {
  node: TaskType!
  cursor: String!
}

type TaskType {
  id: UUID!
  slug: String!
  description: String
}

type Query {
  tasks(after: String, first: Int): TaskTypeConnection!
}
```

`tasksQuery.graphql`:

```graphql
query tasks($after: String, $first: Int) {
  tasks(after: $after, first: $first) {
    edges {
      node {
        id
        slug
        description
      }
    }
  }
}
```

`tasks.test.js`:

```js
import apolloMock from "./apolloMock"
import tasksQuery from "./tasksQuery.gql";

expect(apolloMock(tasksQuery, {}, {})).equals({
  request: {
      query: tasksQuery,
      variables
  },
  result: {
    data: {
      tasks: {
        edges: []
      }
    }
  }
})

expect(apolloMock(tasksQuery, {}, { tasks: { edges: [{}]})).equals({
  request: {
    query: tasksQuery,
    variables
  },
  result: {
    data: {
      tasks: {
        edges: [
          {
            node: {
              id: "TaskType-id",
              slug: "TaskType-slug",
              description: null
            },
            cursor: "TaskTypeEdge-cursor"
          }
        ]
      }
    }
  }
})
```
