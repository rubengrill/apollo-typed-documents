import { codegen } from "@graphql-codegen/core";
import { Types } from "@graphql-codegen/plugin-helpers";
import { buildSchema, parse, printSchema } from "graphql";

import * as codegenTypedDocuments from "../codegenTypedDocuments";

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
  generateOptions: Partial<Types.GenerateOptions> = {},
  pluginOptions: Partial<codegenTypedDocuments.UserConfig> = {}
): Types.GenerateOptions => ({
  filename: "not-relevant",
  schema: parse(printSchema(schema)),
  plugins: [
    {
      codegenTypedDocuments: {
        typesModule: "@codegen-types",
        ...pluginOptions,
      },
    },
  ],
  pluginMap: { codegenTypedDocuments },
  config: {},
  documents: [],
  ...generateOptions,
});

describe("codegenTypedDocuments", () => {
  it("should not have any output when there are no documents", async () => {
    const config = getConfig();
    const output = await codegen(config);

    expect(output).toMatchInlineSnapshot(`""`);
  });

  it("should have ambient module declarations for each document", async () => {
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
        import { TypedDocumentNode } from \\"@apollo/client\\";
        import { AuthorsQuery, AuthorsQueryVariables } from \\"@codegen-types\\";
        export const authors: TypedDocumentNode<AuthorsQuery, AuthorsQueryVariables>;
        export default authors;
      }

      declare module \\"*/createAuthor.gql\\" {
        import { TypedDocumentNode } from \\"@apollo/client\\";
        import { CreateAuthorMutation, CreateAuthorMutationVariables } from \\"@codegen-types\\";
        export const createAuthor: TypedDocumentNode<CreateAuthorMutation, CreateAuthorMutationVariables>;
        export default createAuthor;
      }"
    `);
  });

  it("should not have default exports for multiple operations", async () => {
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
        import { TypedDocumentNode } from \\"@apollo/client\\";
        import { AuthorsQuery, AuthorsQueryVariables } from \\"@codegen-types\\";
        export const authors: TypedDocumentNode<AuthorsQuery, AuthorsQueryVariables>;
        import { AlsoAuthorsQuery, AlsoAuthorsQueryVariables } from \\"@codegen-types\\";
        export const alsoAuthors: TypedDocumentNode<AlsoAuthorsQuery, AlsoAuthorsQueryVariables>;
      }

      declare module \\"*/createAuthor.gql\\" {
        import { TypedDocumentNode } from \\"@apollo/client\\";
        import { CreateAuthorMutation, CreateAuthorMutationVariables } from \\"@codegen-types\\";
        export const createAuthor: TypedDocumentNode<CreateAuthorMutation, CreateAuthorMutationVariables>;
        import { AlsoCreateAuthorMutation, AlsoCreateAuthorMutationVariables } from \\"@codegen-types\\";
        export const alsoCreateAuthor: TypedDocumentNode<AlsoCreateAuthorMutation, AlsoCreateAuthorMutationVariables>;
      }"
    `);
  });

  describe("module path customization", () => {
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
      { document: queryDocument, location: "literary/types/authors.gql" },
      { document: mutationDocument, location: "mutations/createAuthor.gql" },
    ];

    it("wildcards the basename by default", async () => {
      const config = getConfig({ documents });
      const output = await codegen(config);

      expect(output).toMatchInlineSnapshot(`
        "declare module \\"*/authors.gql\\" {
          import { TypedDocumentNode } from \\"@apollo/client\\";
          import { AuthorsQuery, AuthorsQueryVariables } from \\"@codegen-types\\";
          export const authors: TypedDocumentNode<AuthorsQuery, AuthorsQueryVariables>;
          export default authors;
        }

        declare module \\"*/createAuthor.gql\\" {
          import { TypedDocumentNode } from \\"@apollo/client\\";
          import { CreateAuthorMutation, CreateAuthorMutationVariables } from \\"@codegen-types\\";
          export const createAuthor: TypedDocumentNode<CreateAuthorMutation, CreateAuthorMutationVariables>;
          export default createAuthor;
        }"
      `);
    });

    it("respects the relativeToCwd setting", async () => {
      const config = getConfig({ documents }, { relativeToCwd: true });
      const output = await codegen(config);

      expect(output).toEqual(
        expect.stringContaining(`declare module "*/literary/types/authors.gql"`)
      );
      expect(output).toEqual(
        expect.stringContaining(`declare module "*/mutations/createAuthor.gql"`)
      );
    });

    it("respects the prefix setting", async () => {
      const config = getConfig({ documents }, { prefix: "gql/" });
      const output = await codegen(config);

      expect(output).toEqual(
        expect.stringContaining(`declare module "gql/authors.gql"`)
      );
      expect(output).toEqual(
        expect.stringContaining(`declare module "gql/createAuthor.gql"`)
      );
    });

    it("respects the modulePathPrefix setting", async () => {
      const config = getConfig({ documents }, { modulePathPrefix: "stuff/" });
      const output = await codegen(config);

      expect(output).toEqual(
        expect.stringContaining(`declare module "*/stuff/authors.gql"`)
      );
      expect(output).toEqual(
        expect.stringContaining(`declare module "*/stuff/createAuthor.gql"`)
      );
    });

    it("allows combining path settings", async () => {
      const config = getConfig(
        { documents },
        {
          prefix: "",
          modulePathPrefix: "defs/",
          relativeToCwd: true,
        }
      );

      const output = await codegen(config);

      expect(output).toEqual(
        expect.stringContaining(
          `declare module "defs/literary/types/authors.gql"`
        )
      );
      expect(output).toEqual(
        expect.stringContaining(
          `declare module "defs/mutations/createAuthor.gql"`
        )
      );
    });
  });
});
