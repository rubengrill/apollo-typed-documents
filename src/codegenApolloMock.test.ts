import fs from "fs";

import { codegen } from "@graphql-codegen/core";
import { Types } from "@graphql-codegen/plugin-helpers";
import { DocumentNode, buildSchema, parse, printSchema } from "graphql";
import tmp from "tmp";

import * as codegenApolloMock from "./codegenApolloMock";
import { ApolloMockFn } from "./createApolloMock";

expect.addSnapshotSerializer({
  test(value) {
    return !!(value?.request && value?.result);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  print(value: any) {
    const {
      request: { variables },
      result,
    } = value;
    const newValue = { request: { query: "...", variables }, result };
    return JSON.stringify(newValue, null, 2);
  },
});

const schema = buildSchema(`
  type Author {
    idField: ID!
    stringField: String
    stringFieldNonNull: String!
    intField: Int
    intFieldNonNull: Int!
    posts: [Post]
    postsNonNull: [Post]!
  }

  type Post {
    idField: ID!
    author: Author
    authorNonNull: Author!
  }

  input AuthorInput {
    idField: ID!
    stringField: String
    stringFieldNonNull: String!
    intField: Int
    intFieldNonNull: Int!
    posts: [PostInput]
    postsNonNull: [PostInput]!
  }

  input PostInput {
    idField: ID!
    author: AuthorInput
    authorNonNull: AuthorInput!
  }

  type Query {
    authors: [Author]
    authorsNonNull: [Author]!
  }

  type Mutation {
    createAuthor: Author!
    createAuthorExtensive(author: AuthorInput, authorNonNull: AuthorInput!): Author!
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
  plugins: [{ codegenApolloMock: {} }],
  pluginMap: { codegenApolloMock },
  config: {},
  documents: [],
  ...options,
});

const getApolloMock = (output: string) => {
  const tempFile = tmp.fileSync({ postfix: ".js" });

  fs.writeFileSync(tempFile.name, output);

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const module = require(tempFile.name);

  return module.default;
};

describe("codegenApolloMock", () => {
  describe("general", () => {
    describe("with no documents", () => {
      it("should not define any operations when there are no documents", async (done) => {
        const config = getConfig();
        const output = await codegen(config);

        expect(output).toMatchInlineSnapshot(`
          "import { createApolloMock } from \\"apollo-typed-documents\\";

          const operations = {};

          export default createApolloMock(operations);"
        `);

        done();
      });
    });
  });

  describe("query", () => {
    describe("with minimal document", () => {
      let document: DocumentNode;
      let output: string;
      let apolloMock: ApolloMockFn;

      beforeEach(async (done) => {
        document = parse(`
          query authors {
            authors {
              idField
            }
          }
        `);

        const documents = [{ document, location: "authors.gql" }];
        const config = getConfig({ documents });

        output = await codegen(config);
        apolloMock = getApolloMock(output);

        done();
      });

      it("should have matching operation", () => {
        expect(output).toMatchInlineSnapshot(`
          "import { createApolloMock } from \\"apollo-typed-documents\\";

          const operations = {};

          export default createApolloMock(operations);

          operations.authors = {};
          operations.authors.variables = (values = {}, options = {}) => {
            values = (({  }) => ({  }))(values);
            return {

            };
          }
          operations.authors.data = (values = {}, options = {}) => {
            values = (({ authors = null }) => ({ authors }))(values);
            return {
              authors: !values.authors ? values.authors : values.authors.map(item => ((values = {}, options = {}) => {
                values = (({ idField = null }) => ({ idField }))(values);
                return {
                  idField: (values.idField === null || values.idField === undefined) ? \\"Author-idField\\" : values.idField,
                  ...(options.addTypename ? {__typename: \\"Author\\"} : {})
                };
              })(item, options))
            };
          }"
        `);
      });

      it("should allow document only", () => {
        const result = apolloMock(document);

        expect(result).toMatchInlineSnapshot(`
          {
            "request": {
              "query": "...",
              "variables": {}
            },
            "result": {
              "data": {
                "authors": null
              }
            }
          }
        `);
      });

      it("with empty array for authors", () => {
        const result = apolloMock(document, {}, { authors: [] });

        expect(result).toMatchInlineSnapshot(`
          {
            "request": {
              "query": "...",
              "variables": {}
            },
            "result": {
              "data": {
                "authors": []
              }
            }
          }
        `);
      });

      it("with empty object as author", () => {
        const result = apolloMock(document, {}, { authors: [{}] });

        expect(result).toMatchInlineSnapshot(`
          {
            "request": {
              "query": "...",
              "variables": {}
            },
            "result": {
              "data": {
                "authors": [
                  {
                    "idField": "Author-idField",
                    "__typename": "Author"
                  }
                ]
              }
            }
          }
        `);
      });

      it("should ignore invalid field", () => {
        const result = apolloMock(
          document,
          {},
          { authors: [{ notExisting: 1 }] }
        );

        expect(result).toMatchInlineSnapshot(`
          {
            "request": {
              "query": "...",
              "variables": {}
            },
            "result": {
              "data": {
                "authors": [
                  {
                    "idField": "Author-idField",
                    "__typename": "Author"
                  }
                ]
              }
            }
          }
        `);
      });

      it("should ignore field that is not selected", () => {
        const result = apolloMock(
          document,
          {},
          { authors: [{ stringField: "foo" }] }
        );

        expect(result).toMatchInlineSnapshot(`
          {
            "request": {
              "query": "...",
              "variables": {}
            },
            "result": {
              "data": {
                "authors": [
                  {
                    "idField": "Author-idField",
                    "__typename": "Author"
                  }
                ]
              }
            }
          }
        `);
      });
    });

    describe("with extensive document", () => {
      let document: DocumentNode;
      let output: string;
      let apolloMock: ApolloMockFn;

      beforeEach(async (done) => {
        document = parse(`
          query authors {
            authors {
              idField
              stringField
              stringFieldNonNull
              intField
              intFieldNonNull
              posts {
                idField
                author {
                  idField
                }
                authorNonNull {
                  idField
                }
              }
              postsNonNull {
                idField
                author {
                  idField
                }
                authorNonNull {
                  idField
                }
              }
            }
          }
        `);

        const documents = [{ document, location: "authors.gql" }];
        const config = getConfig({ documents });

        output = await codegen(config);
        apolloMock = getApolloMock(output);

        done();
      });

      it("should have matching operation", () => {
        expect(output).toMatchInlineSnapshot(`
          "import { createApolloMock } from \\"apollo-typed-documents\\";

          const operations = {};

          export default createApolloMock(operations);

          operations.authors = {};
          operations.authors.variables = (values = {}, options = {}) => {
            values = (({  }) => ({  }))(values);
            return {

            };
          }
          operations.authors.data = (values = {}, options = {}) => {
            values = (({ authors = null }) => ({ authors }))(values);
            return {
              authors: !values.authors ? values.authors : values.authors.map(item => ((values = {}, options = {}) => {
                values = (({ idField = null, stringField = null, stringFieldNonNull = null, intField = null, intFieldNonNull = null, posts = null, postsNonNull = null }) => ({ idField, stringField, stringFieldNonNull, intField, intFieldNonNull, posts, postsNonNull }))(values);
                return {
                  idField: (values.idField === null || values.idField === undefined) ? \\"Author-idField\\" : values.idField,
                  stringField: values.stringField,
                  stringFieldNonNull: (values.stringFieldNonNull === null || values.stringFieldNonNull === undefined) ? \\"Author-stringFieldNonNull\\" : values.stringFieldNonNull,
                  intField: values.intField,
                  intFieldNonNull: (values.intFieldNonNull === null || values.intFieldNonNull === undefined) ? 1 : values.intFieldNonNull,
                  posts: !values.posts ? values.posts : values.posts.map(item => ((values = {}, options = {}) => {
                    values = (({ idField = null, author = null, authorNonNull = null }) => ({ idField, author, authorNonNull }))(values);
                    return {
                      idField: (values.idField === null || values.idField === undefined) ? \\"Post-idField\\" : values.idField,
                      author: !values.author ? values.author : ((values = {}, options = {}) => {
                        values = (({ idField = null }) => ({ idField }))(values);
                        return {
                          idField: (values.idField === null || values.idField === undefined) ? \\"Author-idField\\" : values.idField,
                          ...(options.addTypename ? {__typename: \\"Author\\"} : {})
                        };
                      })(values.author, options),
                      authorNonNull: ((values = {}, options = {}) => {
                        values = (({ idField = null }) => ({ idField }))(values);
                        return {
                          idField: (values.idField === null || values.idField === undefined) ? \\"Author-idField\\" : values.idField,
                          ...(options.addTypename ? {__typename: \\"Author\\"} : {})
                        };
                      })(values.authorNonNull || undefined, options),
                      ...(options.addTypename ? {__typename: \\"Post\\"} : {})
                    };
                  })(item, options)),
                  postsNonNull: (values.postsNonNull || []).map(item => ((values = {}, options = {}) => {
                    values = (({ idField = null, author = null, authorNonNull = null }) => ({ idField, author, authorNonNull }))(values);
                    return {
                      idField: (values.idField === null || values.idField === undefined) ? \\"Post-idField\\" : values.idField,
                      author: !values.author ? values.author : ((values = {}, options = {}) => {
                        values = (({ idField = null }) => ({ idField }))(values);
                        return {
                          idField: (values.idField === null || values.idField === undefined) ? \\"Author-idField\\" : values.idField,
                          ...(options.addTypename ? {__typename: \\"Author\\"} : {})
                        };
                      })(values.author, options),
                      authorNonNull: ((values = {}, options = {}) => {
                        values = (({ idField = null }) => ({ idField }))(values);
                        return {
                          idField: (values.idField === null || values.idField === undefined) ? \\"Author-idField\\" : values.idField,
                          ...(options.addTypename ? {__typename: \\"Author\\"} : {})
                        };
                      })(values.authorNonNull || undefined, options),
                      ...(options.addTypename ? {__typename: \\"Post\\"} : {})
                    };
                  })(item, options)),
                  ...(options.addTypename ? {__typename: \\"Author\\"} : {})
                };
              })(item, options))
            };
          }"
        `);
      });

      it("with empty object as author", () => {
        const result = apolloMock(document, {}, { authors: [{}] });

        expect(result).toMatchInlineSnapshot(`
          {
            "request": {
              "query": "...",
              "variables": {}
            },
            "result": {
              "data": {
                "authors": [
                  {
                    "idField": "Author-idField",
                    "stringField": null,
                    "stringFieldNonNull": "Author-stringFieldNonNull",
                    "intField": null,
                    "intFieldNonNull": 1,
                    "posts": null,
                    "postsNonNull": [],
                    "__typename": "Author"
                  }
                ]
              }
            }
          }
        `);
      });

      it("with custom data", () => {
        const result = apolloMock(
          document,
          {},
          {
            authors: [
              {
                idField: "Author-idField-custom",
                stringField: "Author-stringField-custom",
                stringFieldNonNull: "Author-stringFieldNonNull-custom",
                intField: 2,
                intFieldNonNull: 2,
                posts: [
                  {
                    idField: "Post-idField-custom",
                    author: {
                      idField: "Post-idField-custom",
                    },
                    authorNonNull: {
                      idField: "Author-idField-custom",
                    },
                  },
                ],
                postsNonNull: [
                  {
                    idField: "Post-idField-custom",
                    author: {
                      idField: "Post-idField-custom",
                    },
                    authorNonNull: {
                      idField: "Author-idField-custom",
                    },
                  },
                ],
              },
            ],
          }
        );

        expect(result).toMatchInlineSnapshot(`
          {
            "request": {
              "query": "...",
              "variables": {}
            },
            "result": {
              "data": {
                "authors": [
                  {
                    "idField": "Author-idField-custom",
                    "stringField": "Author-stringField-custom",
                    "stringFieldNonNull": "Author-stringFieldNonNull-custom",
                    "intField": 2,
                    "intFieldNonNull": 2,
                    "posts": [
                      {
                        "idField": "Post-idField-custom",
                        "author": {
                          "idField": "Post-idField-custom",
                          "__typename": "Author"
                        },
                        "authorNonNull": {
                          "idField": "Author-idField-custom",
                          "__typename": "Author"
                        },
                        "__typename": "Post"
                      }
                    ],
                    "postsNonNull": [
                      {
                        "idField": "Post-idField-custom",
                        "author": {
                          "idField": "Post-idField-custom",
                          "__typename": "Author"
                        },
                        "authorNonNull": {
                          "idField": "Author-idField-custom",
                          "__typename": "Author"
                        },
                        "__typename": "Post"
                      }
                    ],
                    "__typename": "Author"
                  }
                ]
              }
            }
          }
        `);
      });
    });

    describe("with multiple documents", () => {
      it("should have matching operations", async (done) => {
        const documentAuthors = parse(`
          query authors {
            authors {
              idField
            }
          }
        `);
        const documentAuthorsNonNull = parse(`
          query authorsNonNull {
            authorsNonNull {
              idField
            }
          }
        `);
        const documents = [
          { document: documentAuthors, location: "authors.gql" },
          { document: documentAuthorsNonNull, location: "authorsNonNull.gql" },
        ];
        const config = getConfig({ documents });
        const output = await codegen(config);

        expect(output).toMatchInlineSnapshot(`
          "import { createApolloMock } from \\"apollo-typed-documents\\";

          const operations = {};

          export default createApolloMock(operations);

          operations.authors = {};
          operations.authors.variables = (values = {}, options = {}) => {
            values = (({  }) => ({  }))(values);
            return {

            };
          }
          operations.authors.data = (values = {}, options = {}) => {
            values = (({ authors = null }) => ({ authors }))(values);
            return {
              authors: !values.authors ? values.authors : values.authors.map(item => ((values = {}, options = {}) => {
                values = (({ idField = null }) => ({ idField }))(values);
                return {
                  idField: (values.idField === null || values.idField === undefined) ? \\"Author-idField\\" : values.idField,
                  ...(options.addTypename ? {__typename: \\"Author\\"} : {})
                };
              })(item, options))
            };
          }

          operations.authorsNonNull = {};
          operations.authorsNonNull.variables = (values = {}, options = {}) => {
            values = (({  }) => ({  }))(values);
            return {

            };
          }
          operations.authorsNonNull.data = (values = {}, options = {}) => {
            values = (({ authorsNonNull = null }) => ({ authorsNonNull }))(values);
            return {
              authorsNonNull: (values.authorsNonNull || []).map(item => ((values = {}, options = {}) => {
                values = (({ idField = null }) => ({ idField }))(values);
                return {
                  idField: (values.idField === null || values.idField === undefined) ? \\"Author-idField\\" : values.idField,
                  ...(options.addTypename ? {__typename: \\"Author\\"} : {})
                };
              })(item, options))
            };
          }"
        `);

        done();
      });
    });
  });

  describe("mutation", () => {
    describe("with minimal document", () => {
      let document: DocumentNode;
      let output: string;
      let apolloMock: ApolloMockFn;

      beforeEach(async (done) => {
        document = parse(`
          mutation createAuthor {
            createAuthor {
              idField
            }
          }
        `);

        const documents = [{ document, location: "createAuthor.gql" }];
        const config = getConfig({ documents });

        output = await codegen(config);
        apolloMock = getApolloMock(output);

        done();
      });

      it("should have matching operation", () => {
        expect(output).toMatchInlineSnapshot(`
          "import { createApolloMock } from \\"apollo-typed-documents\\";

          const operations = {};

          export default createApolloMock(operations);

          operations.createAuthor = {};
          operations.createAuthor.variables = (values = {}, options = {}) => {
            values = (({  }) => ({  }))(values);
            return {

            };
          }
          operations.createAuthor.data = (values = {}, options = {}) => {
            values = (({ createAuthor = null }) => ({ createAuthor }))(values);
            return {
              createAuthor: ((values = {}, options = {}) => {
                values = (({ idField = null }) => ({ idField }))(values);
                return {
                  idField: (values.idField === null || values.idField === undefined) ? \\"Author-idField\\" : values.idField,
                  ...(options.addTypename ? {__typename: \\"Author\\"} : {})
                };
              })(values.createAuthor || undefined, options)
            };
          }"
        `);
      });

      it("should allow document only", () => {
        const result = apolloMock(document);

        expect(result).toMatchInlineSnapshot(`
          {
            "request": {
              "query": "...",
              "variables": {}
            },
            "result": {
              "data": {
                "createAuthor": {
                  "idField": "Author-idField",
                  "__typename": "Author"
                }
              }
            }
          }
        `);
      });
    });

    describe("with extensive document", () => {
      let document: DocumentNode;
      let output: string;
      let apolloMock: ApolloMockFn;

      beforeEach(async (done) => {
        document = parse(`
          mutation createAuthorExtensive($author: AuthorInput, $authorNonNull: AuthorInput!) {
            createAuthorExtensive(author: $author, authorNonNull: $authorNonNull) {
              idField
            }
          }
        `);

        const documents = [{ document, location: "createAuthorExtensive.gql" }];
        const config = getConfig({ documents });

        output = await codegen(config);
        apolloMock = getApolloMock(output);

        done();
      });

      it("should have matching operation", () => {
        expect(output).toMatchInlineSnapshot(`
          "import { createApolloMock } from \\"apollo-typed-documents\\";

          const operations = {};

          export default createApolloMock(operations);

          operations.createAuthorExtensive = {};
          operations.createAuthorExtensive.variables = (values = {}, options = {}) => {
            values = (({ author = undefined, authorNonNull = undefined }) => ({ author, authorNonNull }))(values);
            return {
              author: !values.author ? values.author : (AuthorInput)(values.author, options),
              authorNonNull: (AuthorInput)(values.authorNonNull || undefined, options)
            };
          }
          operations.createAuthorExtensive.data = (values = {}, options = {}) => {
            values = (({ createAuthorExtensive = null }) => ({ createAuthorExtensive }))(values);
            return {
              createAuthorExtensive: ((values = {}, options = {}) => {
                values = (({ idField = null }) => ({ idField }))(values);
                return {
                  idField: (values.idField === null || values.idField === undefined) ? \\"Author-idField\\" : values.idField,
                  ...(options.addTypename ? {__typename: \\"Author\\"} : {})
                };
              })(values.createAuthorExtensive || undefined, options)
            };
          }

          const PostInput = (values = {}, options = {}) => {
            values = (({ idField = undefined, author = undefined, authorNonNull = undefined }) => ({ idField, author, authorNonNull }))(values);
            return {
              idField: (values.idField === null || values.idField === undefined) ? \\"PostInput-idField\\" : values.idField,
              author: !values.author ? values.author : (AuthorInput)(values.author, options),
              authorNonNull: (AuthorInput)(values.authorNonNull || undefined, options)
            };
          }

          const AuthorInput = (values = {}, options = {}) => {
            values = (({ idField = undefined, stringField = undefined, stringFieldNonNull = undefined, intField = undefined, intFieldNonNull = undefined, posts = undefined, postsNonNull = undefined }) => ({ idField, stringField, stringFieldNonNull, intField, intFieldNonNull, posts, postsNonNull }))(values);
            return {
              idField: (values.idField === null || values.idField === undefined) ? \\"AuthorInput-idField\\" : values.idField,
              stringField: values.stringField,
              stringFieldNonNull: (values.stringFieldNonNull === null || values.stringFieldNonNull === undefined) ? \\"AuthorInput-stringFieldNonNull\\" : values.stringFieldNonNull,
              intField: values.intField,
              intFieldNonNull: (values.intFieldNonNull === null || values.intFieldNonNull === undefined) ? 1 : values.intFieldNonNull,
              posts: !values.posts ? values.posts : values.posts.map(item => (PostInput)(item, options)),
              postsNonNull: (values.postsNonNull || []).map(item => (PostInput)(item, options))
            };
          }"
        `);
      });

      it("with empty variables", () => {
        const result = apolloMock(document, {}, {});

        expect(result).toMatchInlineSnapshot(`
          {
            "request": {
              "query": "...",
              "variables": {
                "authorNonNull": {
                  "idField": "AuthorInput-idField",
                  "stringFieldNonNull": "AuthorInput-stringFieldNonNull",
                  "intFieldNonNull": 1,
                  "postsNonNull": []
                }
              }
            },
            "result": {
              "data": {
                "createAuthorExtensive": {
                  "idField": "Author-idField",
                  "__typename": "Author"
                }
              }
            }
          }
        `);
      });

      it("with empty object as author", () => {
        const result = apolloMock(document, { author: {} }, {});

        expect(result).toMatchInlineSnapshot(`
          {
            "request": {
              "query": "...",
              "variables": {
                "author": {
                  "idField": "AuthorInput-idField",
                  "stringFieldNonNull": "AuthorInput-stringFieldNonNull",
                  "intFieldNonNull": 1,
                  "postsNonNull": []
                },
                "authorNonNull": {
                  "idField": "AuthorInput-idField",
                  "stringFieldNonNull": "AuthorInput-stringFieldNonNull",
                  "intFieldNonNull": 1,
                  "postsNonNull": []
                }
              }
            },
            "result": {
              "data": {
                "createAuthorExtensive": {
                  "idField": "Author-idField",
                  "__typename": "Author"
                }
              }
            }
          }
        `);
      });

      it("with custom data", () => {
        const result = apolloMock(
          document,
          {
            authorNonNull: {
              idField: "AuthorInput-idField-custom",
              stringField: "AuthorInput-stringField-custom",
              stringFieldNonNull: "AuthorInput-stringFieldNonNull-custom",
              intField: 2,
              intFieldNonNull: 2,
              posts: [{}],
            },
          },
          {}
        );

        expect(result).toMatchInlineSnapshot(`
          {
            "request": {
              "query": "...",
              "variables": {
                "authorNonNull": {
                  "idField": "AuthorInput-idField-custom",
                  "stringField": "AuthorInput-stringField-custom",
                  "stringFieldNonNull": "AuthorInput-stringFieldNonNull-custom",
                  "intField": 2,
                  "intFieldNonNull": 2,
                  "posts": [
                    {
                      "idField": "PostInput-idField",
                      "authorNonNull": {
                        "idField": "AuthorInput-idField",
                        "stringFieldNonNull": "AuthorInput-stringFieldNonNull",
                        "intFieldNonNull": 1,
                        "postsNonNull": []
                      }
                    }
                  ],
                  "postsNonNull": []
                }
              }
            },
            "result": {
              "data": {
                "createAuthorExtensive": {
                  "idField": "Author-idField",
                  "__typename": "Author"
                }
              }
            }
          }
        `);
      });
    });
  });
});
