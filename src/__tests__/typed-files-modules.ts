import { codegen } from "@graphql-codegen/core";
import { Types } from "@graphql-codegen/plugin-helpers";
import { buildSchema, parse, printSchema } from "graphql";

import { TypedFilesModulesConfig } from "../config";
import * as typedFilesModules from "../index";

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
  pluginOptions: Partial<TypedFilesModulesConfig> = {}
): Types.GenerateOptions => ({
  filename: "ops.d.ts",
  schema: parse(printSchema(schema)),
  plugins: [
    {
      typedFilesModules: {
        typesModule: "@codegen-types",
        typedDocumentNodeModule: "docnode",
        ...pluginOptions,
      },
    },
  ],
  pluginMap: { typedFilesModules },
  config: {},
  documents: [],
  ...generateOptions,
});

const singleOpDocuments = [
  {
    location: "authors.gql",
    document: parse(`
      query authors {
        authors {
          idField
        }
      }
    `),
  },
  {
    location: "createAuthor.gql",
    document: parse(`
      mutation createAuthor {
        createAuthor {
          idField
        }
      }
    `),
  },
];

const multiOpDocuments = [
  {
    location: "authors.gql",
    document: parse(`
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
    `),
  },
  {
    location: "createAuthor.gql",
    document: parse(`
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
    `),
  },
];

describe("typed-files-modules", () => {
  it("should not have any output when there are no documents", async () => {
    const config = getConfig();
    const output = await codegen(config);

    expect(output).toMatchInlineSnapshot(`""`);
  });

  it("should have ambient module declarations for each document", async () => {
    const config = getConfig({ documents: singleOpDocuments });
    const output = await codegen(config);

    expect(output).toMatchSnapshot();
  });

  it("should not have default exports for multiple operations", async () => {
    const config = getConfig({ documents: multiOpDocuments });
    const output = await codegen(config);

    expect(output).toMatchSnapshot();
  });

  it("should not have default exports if specifically excluded", async () => {
    const config = getConfig(
      { documents: singleOpDocuments },
      { excludeDefaultExports: true }
    );
    const output = await codegen(config);
    expect(output).toMatchSnapshot();
  });

  describe("module path customization", () => {
    const documents = singleOpDocuments;

    it("wildcards the basename by default", async () => {
      const config = getConfig({ documents });
      const output = await codegen(config);

      expect(output).toMatchSnapshot();
    });

    it("respects the relativeToCwd setting", async () => {
      const config = getConfig({ documents }, { relativeToCwd: true });
      const output = await codegen(config);

      expect(output).toEqual(
        expect.stringContaining(`declare module "*/authors.gql"`)
      );
      expect(output).toEqual(
        expect.stringContaining(`declare module "*/createAuthor.gql"`)
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

    it("allows combining path settings", async () => {
      const config = getConfig(
        { documents },
        { prefix: "defs/", relativeToCwd: true }
      );

      const output = await codegen(config);

      expect(output).toEqual(
        expect.stringContaining(`declare module "defs/authors.gql"`)
      );
      expect(output).toEqual(
        expect.stringContaining(`declare module "defs/createAuthor.gql"`)
      );
    });
  });

  describe("typedDocumentNodeModule", () => {
    it("defaults to graphql code generator's definition", async () => {
      const config = getConfig(
        { documents: singleOpDocuments },
        { typedDocumentNodeModule: undefined }
      );

      const output = await codegen(config);
      expect(output).toEqual(
        expect.stringContaining(
          `import { TypedDocumentNode } from "@graphql-typed-document-node/core";`
        )
      );
    });

    it("can be customized", async () => {
      const config = getConfig(
        { documents: singleOpDocuments },
        { typedDocumentNodeModule: "@apollo/client" }
      );
      const output = await codegen(config);
      expect(output).toEqual(
        expect.stringContaining(
          `import { TypedDocumentNode } from "@apollo/client";`
        )
      );
    });
  });
});
