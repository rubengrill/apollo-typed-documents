import { codegen } from "@graphql-codegen/core";
import { Types } from "@graphql-codegen/plugin-helpers";
import { buildSchema, parse, printSchema } from "graphql";

import * as codegenTypedDocuments from "./codegenTypedDocuments";

const schema = buildSchema(`
  type Author {
    idField: ID!
  }

  type Query {
    authors: [Author]
  }

  type Mutation {
    createAuthor: Author!
  }

  schema {
    query: Query
    mutation: Mutation
  }
`);

const getConfig = (
  options: Partial<Types.GenerateOptions> = {}
): Types.GenerateOptions => ({
  filename: "not-relevant",
  schema: parse(printSchema(schema)),
  plugins: [{ codegenTypedDocuments: { typesModule: "@codegen-types" } }],
  pluginMap: { codegenTypedDocuments },
  config: {},
  documents: [],
  ...options,
});

describe("codegenTypedDocuments", () => {
  it("should not have any output when there are no documents", async (done) => {
    const config = getConfig();
    const output = await codegen(config);

    expect(output).toMatchInlineSnapshot(`""`);

    done();
  });

  it("should have ambient module declarations for each document", async (done) => {
    const queryDocument = parse(`
      query authors {
        authors {
          idField
        }
      }
    `);

    const mutationDocument = parse(`
      mutation createAuthor {
        createAuthor {
          idField
        }
      }
    `);

    const documents = [
      { document: queryDocument, location: "authors.gql" },
      { document: mutationDocument, location: "createAuthor.gql" },
    ];

    const config = getConfig({ documents });
    const output = await codegen(config);

    expect(output).toMatchInlineSnapshot(`
      "declare module \\"*/authors.gql\\" {
        import { TypedDocumentNode } from \\"apollo-typed-documents\\";
        import { AuthorsQuery, AuthorsQueryVariables } from \\"@codegen-types\\";
        export const authors: TypedDocumentNode<AuthorsQueryVariables, AuthorsQuery>;
        export default authors;
      }

      declare module \\"*/createAuthor.gql\\" {
        import { TypedDocumentNode } from \\"apollo-typed-documents\\";
        import { CreateAuthorMutation, CreateAuthorMutationVariables } from \\"@codegen-types\\";
        export const createAuthor: TypedDocumentNode<CreateAuthorMutationVariables, CreateAuthorMutation>;
        export default createAuthor;
      }"
    `);

    done();
  });

  it("should not have default exports for multiple operations", async (done) => {
    const queryDocument = parse(`
      query authors {
        authors {
          idField
        }
      }
      query alsoAuthors {
        authors {
          idField
        }
      }
    `);

    const mutationDocument = parse(`
      mutation createAuthor {
        createAuthor {
          idField
        }
      }
      mutation alsoCreateAuthor {
        createAuthor {
          idField
        }
      }
    `);

    const documents = [
      { document: queryDocument, location: "authors.gql" },
      { document: mutationDocument, location: "createAuthor.gql" },
    ];

    const config = getConfig({ documents });
    const output = await codegen(config);

    expect(output).toMatchInlineSnapshot(`
      "declare module \\"*/authors.gql\\" {
        import { TypedDocumentNode } from \\"apollo-typed-documents\\";
        import { AuthorsQuery, AuthorsQueryVariables } from \\"@codegen-types\\";
        export const authors: TypedDocumentNode<AuthorsQueryVariables, AuthorsQuery>;
        import { AlsoAuthorsQuery, AlsoAuthorsQueryVariables } from \\"@codegen-types\\";
        export const alsoAuthors: TypedDocumentNode<AlsoAuthorsQueryVariables, AlsoAuthorsQuery>;
      }

      declare module \\"*/createAuthor.gql\\" {
        import { TypedDocumentNode } from \\"apollo-typed-documents\\";
        import { CreateAuthorMutation, CreateAuthorMutationVariables } from \\"@codegen-types\\";
        export const createAuthor: TypedDocumentNode<CreateAuthorMutationVariables, CreateAuthorMutation>;
        import { AlsoCreateAuthorMutation, AlsoCreateAuthorMutationVariables } from \\"@codegen-types\\";
        export const alsoCreateAuthor: TypedDocumentNode<AlsoCreateAuthorMutationVariables, AlsoCreateAuthorMutation>;
      }"
    `);

    done();
  });
});
