import fs from "fs";

import { codegen } from "@graphql-codegen/core";
import { Types } from "@graphql-codegen/plugin-helpers";
import { DocumentNode, buildSchema, parse, printSchema } from "graphql";
import tmp from "tmp";

import * as codegenApolloMock from "../codegenApolloMock";
import { ApolloMockFn } from "../createApolloMock";

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
  interface HasIdField {
    idField: ID!
  }

  type Author implements HasIdField {
    idField: ID!
    stringField: String
    stringFieldNonNull: String!
    intField: Int
    intFieldNonNull: Int!
    posts: [Post]
    postsNonNull: [Post]!
  }

  type Post implements HasIdField {
    idField: ID!
    author: Author
    authorNonNull: Author!
  }

  union SearchResult = Author | Post

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
    objects: [HasIdField]
    search: [SearchResult]
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
      it("should not define any operations when there are no documents", async () => {
        const config = getConfig();
        const output = await codegen(config);

        expect(output).toMatchInlineSnapshot(`
          "import { createApolloMock } from 'apollo-typed-documents';

          const operations = {};

          export default createApolloMock(operations);"
        `);
      });
    });
  });

  describe("query", () => {
    describe("with minimal document", () => {
      let document: DocumentNode;
      let output: string;
      let apolloMock: ApolloMockFn;

      beforeEach(async () => {
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
      });

      it("should have matching operation", () => {
        expect(output).toMatchInlineSnapshot(`
          "import { createApolloMock } from 'apollo-typed-documents';

          const operations = {};

          export default createApolloMock(operations);

          operations.authors = {};
          operations.authors.variables = (values = {}, options = {}) => {
            const __typename = '';
            values = (({  }) => ({  }))(values);
            values.__typename = __typename;
            return {

            };
          }
          operations.authors.data = (values = {}, options = {}) => {
            const __typename = '';
            values = (({ authors = null }) => ({ authors }))(values);
            values.__typename = __typename;
            return {
              authors: !values.authors ? values.authors : values.authors.map(item => ((values = {}, options = {}) => {
                const __typename = 'Author';
                values = (({ idField = null }) => ({ idField }))(values);
                values.__typename = __typename;
                return {
                  idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
                  ...(options.addTypename ? { __typename } : {})
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

      beforeEach(async () => {
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
      });

      it("should have matching operation", () => {
        expect(output).toMatchInlineSnapshot(`
          "import { createApolloMock } from 'apollo-typed-documents';

          const operations = {};

          export default createApolloMock(operations);

          operations.authors = {};
          operations.authors.variables = (values = {}, options = {}) => {
            const __typename = '';
            values = (({  }) => ({  }))(values);
            values.__typename = __typename;
            return {

            };
          }
          operations.authors.data = (values = {}, options = {}) => {
            const __typename = '';
            values = (({ authors = null }) => ({ authors }))(values);
            values.__typename = __typename;
            return {
              authors: !values.authors ? values.authors : values.authors.map(item => ((values = {}, options = {}) => {
                const __typename = 'Author';
                values = (({ idField = null, stringField = null, stringFieldNonNull = null, intField = null, intFieldNonNull = null, posts = null, postsNonNull = null }) => ({ idField, stringField, stringFieldNonNull, intField, intFieldNonNull, posts, postsNonNull }))(values);
                values.__typename = __typename;
                return {
                  idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
                  stringField: values.stringField,
                  stringFieldNonNull: (values.stringFieldNonNull === null || values.stringFieldNonNull === undefined) ? [__typename, 'stringFieldNonNull'].filter(v => v).join('-') : values.stringFieldNonNull,
                  intField: values.intField,
                  intFieldNonNull: (values.intFieldNonNull === null || values.intFieldNonNull === undefined) ? 1 : values.intFieldNonNull,
                  posts: !values.posts ? values.posts : values.posts.map(item => ((values = {}, options = {}) => {
                    const __typename = 'Post';
                    values = (({ idField = null, author = null, authorNonNull = null }) => ({ idField, author, authorNonNull }))(values);
                    values.__typename = __typename;
                    return {
                      idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
                      author: !values.author ? values.author : ((values = {}, options = {}) => {
                        const __typename = 'Author';
                        values = (({ idField = null }) => ({ idField }))(values);
                        values.__typename = __typename;
                        return {
                          idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
                          ...(options.addTypename ? { __typename } : {})
                        };
                      })(values.author, options),
                      authorNonNull: ((values = {}, options = {}) => {
                        const __typename = 'Author';
                        values = (({ idField = null }) => ({ idField }))(values);
                        values.__typename = __typename;
                        return {
                          idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
                          ...(options.addTypename ? { __typename } : {})
                        };
                      })(values.authorNonNull || undefined, options),
                      ...(options.addTypename ? { __typename } : {})
                    };
                  })(item, options)),
                  postsNonNull: (values.postsNonNull || []).map(item => ((values = {}, options = {}) => {
                    const __typename = 'Post';
                    values = (({ idField = null, author = null, authorNonNull = null }) => ({ idField, author, authorNonNull }))(values);
                    values.__typename = __typename;
                    return {
                      idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
                      author: !values.author ? values.author : ((values = {}, options = {}) => {
                        const __typename = 'Author';
                        values = (({ idField = null }) => ({ idField }))(values);
                        values.__typename = __typename;
                        return {
                          idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
                          ...(options.addTypename ? { __typename } : {})
                        };
                      })(values.author, options),
                      authorNonNull: ((values = {}, options = {}) => {
                        const __typename = 'Author';
                        values = (({ idField = null }) => ({ idField }))(values);
                        values.__typename = __typename;
                        return {
                          idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
                          ...(options.addTypename ? { __typename } : {})
                        };
                      })(values.authorNonNull || undefined, options),
                      ...(options.addTypename ? { __typename } : {})
                    };
                  })(item, options)),
                  ...(options.addTypename ? { __typename } : {})
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
      it("should have matching operations", async () => {
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
          "import { createApolloMock } from 'apollo-typed-documents';

          const operations = {};

          export default createApolloMock(operations);

          operations.authors = {};
          operations.authors.variables = (values = {}, options = {}) => {
            const __typename = '';
            values = (({  }) => ({  }))(values);
            values.__typename = __typename;
            return {

            };
          }
          operations.authors.data = (values = {}, options = {}) => {
            const __typename = '';
            values = (({ authors = null }) => ({ authors }))(values);
            values.__typename = __typename;
            return {
              authors: !values.authors ? values.authors : values.authors.map(item => ((values = {}, options = {}) => {
                const __typename = 'Author';
                values = (({ idField = null }) => ({ idField }))(values);
                values.__typename = __typename;
                return {
                  idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
                  ...(options.addTypename ? { __typename } : {})
                };
              })(item, options))
            };
          }

          operations.authorsNonNull = {};
          operations.authorsNonNull.variables = (values = {}, options = {}) => {
            const __typename = '';
            values = (({  }) => ({  }))(values);
            values.__typename = __typename;
            return {

            };
          }
          operations.authorsNonNull.data = (values = {}, options = {}) => {
            const __typename = '';
            values = (({ authorsNonNull = null }) => ({ authorsNonNull }))(values);
            values.__typename = __typename;
            return {
              authorsNonNull: (values.authorsNonNull || []).map(item => ((values = {}, options = {}) => {
                const __typename = 'Author';
                values = (({ idField = null }) => ({ idField }))(values);
                values.__typename = __typename;
                return {
                  idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
                  ...(options.addTypename ? { __typename } : {})
                };
              })(item, options))
            };
          }"
        `);
      });
    });

    describe("with interface", () => {
      let document: DocumentNode;
      let output: string;
      let apolloMock: ApolloMockFn;

      beforeEach(async () => {
        document = parse(`
          query objects {
            objects {
              idField
            }
          }
        `);

        const documents = [{ document, location: "objects.gql" }];
        const config = getConfig({ documents });

        output = await codegen(config);
        apolloMock = getApolloMock(output);
      });

      it("should have matching operation", () => {
        expect(output).toMatchInlineSnapshot(`
          "import { createApolloMock } from 'apollo-typed-documents';

          const operations = {};

          export default createApolloMock(operations);

          operations.objects = {};
          operations.objects.variables = (values = {}, options = {}) => {
            const __typename = '';
            values = (({  }) => ({  }))(values);
            values.__typename = __typename;
            return {

            };
          }
          operations.objects.data = (values = {}, options = {}) => {
            const __typename = '';
            values = (({ objects = null }) => ({ objects }))(values);
            values.__typename = __typename;
            return {
              objects: !values.objects ? values.objects : values.objects.map(item => ((values = {}, options = {}) => {
                const typenames = ['Author', 'Post'];
                const __typename = typenames.find(typename => typename === values.__typename) || typenames[0];
                values = (({ idField = null }) => ({ idField }))(values);
                values.__typename = __typename;
                return {
                  idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
                  ...(options.addTypename ? { __typename } : {})
                };
              })(item, options))
            };
          }"
        `);
      });

      it("should pick first type that implements the interface by default", () => {
        const result = apolloMock(document, {}, { objects: [{}] });

        expect(result).toMatchInlineSnapshot(`
          {
            "request": {
              "query": "...",
              "variables": {}
            },
            "result": {
              "data": {
                "objects": [
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

      it("should allow to override type", () => {
        const obj = { __typename: "Post" };
        const result = apolloMock(document, {}, { objects: [obj] });

        expect(result).toMatchInlineSnapshot(`
          {
            "request": {
              "query": "...",
              "variables": {}
            },
            "result": {
              "data": {
                "objects": [
                  {
                    "idField": "Post-idField",
                    "__typename": "Post"
                  }
                ]
              }
            }
          }
        `);
      });

      it("should ignore invalid type", () => {
        const obj = { __typename: "Foo" };
        const result = apolloMock(document, {}, { objects: [obj] });

        expect(result).toMatchInlineSnapshot(`
          {
            "request": {
              "query": "...",
              "variables": {}
            },
            "result": {
              "data": {
                "objects": [
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

    describe("with inline fragments", () => {
      let document: DocumentNode;
      let output: string;
      let apolloMock: ApolloMockFn;

      beforeEach(async () => {
        document = parse(`
          query search {
            search {
              ... on HasIdField {
                idField
              }
              ... on Author {
                posts {
                  idField
                }
              }
              ... on Post {
                author {
                  idField
                }
              }
            }
          }
        `);

        const documents = [{ document, location: "search.gql" }];
        const config = getConfig({ documents });

        output = await codegen(config);
        apolloMock = getApolloMock(output);
      });

      it("should have matching operation", () => {
        expect(output).toMatchInlineSnapshot(`
          "import { createApolloMock } from 'apollo-typed-documents';

          const operations = {};

          export default createApolloMock(operations);

          operations.search = {};
          operations.search.variables = (values = {}, options = {}) => {
            const __typename = '';
            values = (({  }) => ({  }))(values);
            values.__typename = __typename;
            return {

            };
          }
          operations.search.data = (values = {}, options = {}) => {
            const __typename = '';
            values = (({ search = null }) => ({ search }))(values);
            values.__typename = __typename;
            return {
              search: !values.search ? values.search : values.search.map(item => ((values = {}, options = {}) => {
                const typenames = ['Author', 'Post'];
                const __typename = typenames.find(typename => typename === values.__typename) || typenames[0];
                values = (({  }) => ({  }))(values);
                values.__typename = __typename;
                return {
                  ...(['Author', 'Post'].find(typename => typename === __typename) ? ((values = {}, options = {}) => {
                    values = (({ idField = null }) => ({ idField }))(values);
                    return {
                      idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField
                    };
                  })(values, options) : {}),
                  ...(['Author'].find(typename => typename === __typename) ? ((values = {}, options = {}) => {
                    values = (({ posts = null }) => ({ posts }))(values);
                    return {
                      posts: !values.posts ? values.posts : values.posts.map(item => ((values = {}, options = {}) => {
                        const __typename = 'Post';
                        values = (({ idField = null }) => ({ idField }))(values);
                        values.__typename = __typename;
                        return {
                          idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
                          ...(options.addTypename ? { __typename } : {})
                        };
                      })(item, options))
                    };
                  })(values, options) : {}),
                  ...(['Post'].find(typename => typename === __typename) ? ((values = {}, options = {}) => {
                    values = (({ author = null }) => ({ author }))(values);
                    return {
                      author: !values.author ? values.author : ((values = {}, options = {}) => {
                        const __typename = 'Author';
                        values = (({ idField = null }) => ({ idField }))(values);
                        values.__typename = __typename;
                        return {
                          idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
                          ...(options.addTypename ? { __typename } : {})
                        };
                      })(values.author, options)
                    };
                  })(values, options) : {}),
                  ...(options.addTypename ? { __typename } : {})
                };
              })(item, options))
            };
          }"
        `);
      });

      it("should pick first type of the union type by default", () => {
        const result = apolloMock(document, {}, { search: [{}] });

        expect(result).toMatchInlineSnapshot(`
          {
            "request": {
              "query": "...",
              "variables": {}
            },
            "result": {
              "data": {
                "search": [
                  {
                    "idField": "Author-idField",
                    "posts": null,
                    "__typename": "Author"
                  }
                ]
              }
            }
          }
        `);
      });

      it("should allow to override type", () => {
        const obj = { __typename: "Post" };
        const result = apolloMock(document, {}, { search: [obj] });

        expect(result).toMatchInlineSnapshot(`
          {
            "request": {
              "query": "...",
              "variables": {}
            },
            "result": {
              "data": {
                "search": [
                  {
                    "idField": "Post-idField",
                    "author": null,
                    "__typename": "Post"
                  }
                ]
              }
            }
          }
        `);
      });

      it("should ignore invalid type", () => {
        const obj = { __typename: "Foo" };
        const result = apolloMock(document, {}, { search: [obj] });

        expect(result).toMatchInlineSnapshot(`
          {
            "request": {
              "query": "...",
              "variables": {}
            },
            "result": {
              "data": {
                "search": [
                  {
                    "idField": "Author-idField",
                    "posts": null,
                    "__typename": "Author"
                  }
                ]
              }
            }
          }
        `);
      });
    });

    describe("with fragments", () => {
      let document: DocumentNode;
      let output: string;
      let apolloMock: ApolloMockFn;

      beforeEach(async () => {
        document = parse(`
          query search {
            search {
              ...searchFragment
            }
          }

          fragment searchFragment on SearchResult {
            ...hasIdFieldFragment
            ...authorFragment
            ...postFragment
          }

          fragment hasIdFieldFragment on HasIdField {
            idField
          }

          fragment authorFragment on Author {
            posts {
              idField
            }
          }

          fragment postFragment on Post {
            author {
              idField
            }
          }
        `);

        const documents = [{ document, location: "search.gql" }];
        const config = getConfig({ documents });

        output = await codegen(config);
        apolloMock = getApolloMock(output);
      });

      it("should have matching operation", () => {
        expect(output).toMatchInlineSnapshot(`
          "import { createApolloMock } from 'apollo-typed-documents';

          const operations = {};

          export default createApolloMock(operations);

          operations.search = {};
          operations.search.variables = (values = {}, options = {}) => {
            const __typename = '';
            values = (({  }) => ({  }))(values);
            values.__typename = __typename;
            return {

            };
          }
          operations.search.data = (values = {}, options = {}) => {
            const __typename = '';
            values = (({ search = null }) => ({ search }))(values);
            values.__typename = __typename;
            return {
              search: !values.search ? values.search : values.search.map(item => ((values = {}, options = {}) => {
                const typenames = ['Author', 'Post'];
                const __typename = typenames.find(typename => typename === values.__typename) || typenames[0];
                values = (({  }) => ({  }))(values);
                values.__typename = __typename;
                return {
                  ...(['Author', 'Post'].find(typename => typename === __typename) ? ((values = {}, options = {}) => {
                    values = (({  }) => ({  }))(values);
                    return {
                      ...(['Author', 'Post'].find(typename => typename === __typename) ? ((values = {}, options = {}) => {
                        values = (({ idField = null }) => ({ idField }))(values);
                        return {
                          idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField
                        };
                      })(values, options) : {}),
                      ...(['Author'].find(typename => typename === __typename) ? ((values = {}, options = {}) => {
                        values = (({ posts = null }) => ({ posts }))(values);
                        return {
                          posts: !values.posts ? values.posts : values.posts.map(item => ((values = {}, options = {}) => {
                            const __typename = 'Post';
                            values = (({ idField = null }) => ({ idField }))(values);
                            values.__typename = __typename;
                            return {
                              idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
                              ...(options.addTypename ? { __typename } : {})
                            };
                          })(item, options))
                        };
                      })(values, options) : {}),
                      ...(['Post'].find(typename => typename === __typename) ? ((values = {}, options = {}) => {
                        values = (({ author = null }) => ({ author }))(values);
                        return {
                          author: !values.author ? values.author : ((values = {}, options = {}) => {
                            const __typename = 'Author';
                            values = (({ idField = null }) => ({ idField }))(values);
                            values.__typename = __typename;
                            return {
                              idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
                              ...(options.addTypename ? { __typename } : {})
                            };
                          })(values.author, options)
                        };
                      })(values, options) : {})
                    };
                  })(values, options) : {}),
                  ...(options.addTypename ? { __typename } : {})
                };
              })(item, options))
            };
          }"
        `);
      });

      it("should pick first type of the union type by default", () => {
        const result = apolloMock(document, {}, { search: [{}] });

        expect(result).toMatchInlineSnapshot(`
          {
            "request": {
              "query": "...",
              "variables": {}
            },
            "result": {
              "data": {
                "search": [
                  {
                    "idField": "Author-idField",
                    "posts": null,
                    "__typename": "Author"
                  }
                ]
              }
            }
          }
        `);
      });

      it("should allow to override type", () => {
        const obj = { __typename: "Post" };
        const result = apolloMock(document, {}, { search: [obj] });

        expect(result).toMatchInlineSnapshot(`
          {
            "request": {
              "query": "...",
              "variables": {}
            },
            "result": {
              "data": {
                "search": [
                  {
                    "idField": "Post-idField",
                    "author": null,
                    "__typename": "Post"
                  }
                ]
              }
            }
          }
        `);
      });

      it("should ignore invalid type", () => {
        const obj = { __typename: "Foo" };
        const result = apolloMock(document, {}, { search: [obj] });

        expect(result).toMatchInlineSnapshot(`
          {
            "request": {
              "query": "...",
              "variables": {}
            },
            "result": {
              "data": {
                "search": [
                  {
                    "idField": "Author-idField",
                    "posts": null,
                    "__typename": "Author"
                  }
                ]
              }
            }
          }
        `);
      });
    });

    describe("with __typename", () => {
      let document: DocumentNode;
      let output: string;
      let apolloMock: ApolloMockFn;

      beforeEach(async () => {
        document = parse(`
          query typename {
            authors {
              __typename
              posts {
                idField
              }
            }
            objects {
              __typename
            }
            search {
              __typename
            }
          }
        `);

        const documents = [{ document, location: "typename.gql" }];
        const config = getConfig({ documents });

        output = await codegen(config);
        apolloMock = getApolloMock(output);
      });

      it("should have matching operation", () => {
        expect(output).toMatchInlineSnapshot(`
          "import { createApolloMock } from 'apollo-typed-documents';

          const operations = {};

          export default createApolloMock(operations);

          operations.typename = {};
          operations.typename.variables = (values = {}, options = {}) => {
            const __typename = '';
            values = (({  }) => ({  }))(values);
            values.__typename = __typename;
            return {

            };
          }
          operations.typename.data = (values = {}, options = {}) => {
            const __typename = '';
            values = (({ authors = null, objects = null, search = null }) => ({ authors, objects, search }))(values);
            values.__typename = __typename;
            return {
              authors: !values.authors ? values.authors : values.authors.map(item => ((values = {}, options = {}) => {
                const __typename = 'Author';
                values = (({ __typename = null, posts = null }) => ({ __typename, posts }))(values);
                values.__typename = __typename;
                return {
                  __typename: values.__typename,
                  posts: !values.posts ? values.posts : values.posts.map(item => ((values = {}, options = {}) => {
                    const __typename = 'Post';
                    values = (({ idField = null }) => ({ idField }))(values);
                    values.__typename = __typename;
                    return {
                      idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
                      ...(options.addTypename ? { __typename } : {})
                    };
                  })(item, options)),
                  ...(options.addTypename ? { __typename } : {})
                };
              })(item, options)),
              objects: !values.objects ? values.objects : values.objects.map(item => ((values = {}, options = {}) => {
                const typenames = ['Author', 'Post'];
                const __typename = typenames.find(typename => typename === values.__typename) || typenames[0];
                values = (({ __typename = null }) => ({ __typename }))(values);
                values.__typename = __typename;
                return {
                  __typename: values.__typename,
                  ...(options.addTypename ? { __typename } : {})
                };
              })(item, options)),
              search: !values.search ? values.search : values.search.map(item => ((values = {}, options = {}) => {
                const typenames = ['Author', 'Post'];
                const __typename = typenames.find(typename => typename === values.__typename) || typenames[0];
                values = (({ __typename = null }) => ({ __typename }))(values);
                values.__typename = __typename;
                return {
                  __typename: values.__typename,
                  ...(options.addTypename ? { __typename } : {})
                };
              })(item, options))
            };
          }"
        `);
      });

      it("should include __typename even when disabled in options", () => {
        const result = apolloMock(
          document,
          {},
          { authors: [{ posts: [{}] }], objects: [{}], search: [{}] },
          { addTypename: false }
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
                    "__typename": "Author",
                    "posts": [
                      {
                        "idField": "Post-idField"
                      }
                    ]
                  }
                ],
                "objects": [
                  {
                    "__typename": "Author"
                  }
                ],
                "search": [
                  {
                    "__typename": "Author"
                  }
                ]
              }
            }
          }
        `);
      });
    });
  });

  describe("mutation", () => {
    describe("with minimal document", () => {
      let document: DocumentNode;
      let output: string;
      let apolloMock: ApolloMockFn;

      beforeEach(async () => {
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
      });

      it("should have matching operation", () => {
        expect(output).toMatchInlineSnapshot(`
          "import { createApolloMock } from 'apollo-typed-documents';

          const operations = {};

          export default createApolloMock(operations);

          operations.createAuthor = {};
          operations.createAuthor.variables = (values = {}, options = {}) => {
            const __typename = '';
            values = (({  }) => ({  }))(values);
            values.__typename = __typename;
            return {

            };
          }
          operations.createAuthor.data = (values = {}, options = {}) => {
            const __typename = '';
            values = (({ createAuthor = null }) => ({ createAuthor }))(values);
            values.__typename = __typename;
            return {
              createAuthor: ((values = {}, options = {}) => {
                const __typename = 'Author';
                values = (({ idField = null }) => ({ idField }))(values);
                values.__typename = __typename;
                return {
                  idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
                  ...(options.addTypename ? { __typename } : {})
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

      beforeEach(async () => {
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
      });

      it("should have matching operation", () => {
        expect(output).toMatchInlineSnapshot(`
          "import { createApolloMock } from 'apollo-typed-documents';

          const operations = {};

          export default createApolloMock(operations);

          operations.createAuthorExtensive = {};
          operations.createAuthorExtensive.variables = (values = {}, options = {}) => {
            const __typename = '';
            values = (({ author = undefined, authorNonNull = undefined }) => ({ author, authorNonNull }))(values);
            values.__typename = __typename;
            return {
              author: !values.author ? values.author : (AuthorInput)(values.author, options),
              authorNonNull: (AuthorInput)(values.authorNonNull || undefined, options)
            };
          }
          operations.createAuthorExtensive.data = (values = {}, options = {}) => {
            const __typename = '';
            values = (({ createAuthorExtensive = null }) => ({ createAuthorExtensive }))(values);
            values.__typename = __typename;
            return {
              createAuthorExtensive: ((values = {}, options = {}) => {
                const __typename = 'Author';
                values = (({ idField = null }) => ({ idField }))(values);
                values.__typename = __typename;
                return {
                  idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
                  ...(options.addTypename ? { __typename } : {})
                };
              })(values.createAuthorExtensive || undefined, options)
            };
          }

          const PostInput = (values = {}, options = {}) => {
            const __typename = 'PostInput';
            values = (({ idField = undefined, author = undefined, authorNonNull = undefined }) => ({ idField, author, authorNonNull }))(values);
            values.__typename = __typename;
            return {
              idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
              author: !values.author ? values.author : (AuthorInput)(values.author, options),
              authorNonNull: (AuthorInput)(values.authorNonNull || undefined, options)
            };
          }

          const AuthorInput = (values = {}, options = {}) => {
            const __typename = 'AuthorInput';
            values = (({ idField = undefined, stringField = undefined, stringFieldNonNull = undefined, intField = undefined, intFieldNonNull = undefined, posts = undefined, postsNonNull = undefined }) => ({ idField, stringField, stringFieldNonNull, intField, intFieldNonNull, posts, postsNonNull }))(values);
            values.__typename = __typename;
            return {
              idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
              stringField: values.stringField,
              stringFieldNonNull: (values.stringFieldNonNull === null || values.stringFieldNonNull === undefined) ? [__typename, 'stringFieldNonNull'].filter(v => v).join('-') : values.stringFieldNonNull,
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
