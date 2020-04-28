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
      it("should not define any operations when there are no documents", async (done) => {
        const config = getConfig();
        const output = await codegen(config);

        expect(output).toMatchInlineSnapshot(`
          "import { createApolloMock } from 'apollo-typed-documents';

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
          "import { createApolloMock } from 'apollo-typed-documents';

          const operations = {};

          export default createApolloMock(operations);

          operations.authors = {};
          operations.authors.variables = (values = {}, options = {}) => {
            const __typename = '';
            values = (({  }) => ({  }))(values);
            values.__typename = __typename;
            let result = {

            };
            return result;
          }
          operations.authors.data = (values = {}, options = {}) => {
            const __typename = '';
            values = (({ authors = null }) => ({ authors }))(values);
            values.__typename = __typename;
            let result = {
              authors: !values.authors ? values.authors : values.authors.map(item => ((values = {}, options = {}) => {
                const __typename = 'Author';
                values = (({ idField = null }) => ({ idField }))(values);
                values.__typename = __typename;
                let result = {
                  idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
                  ...(options.addTypename ? { __typename } : {})
                };
                return result;
              })(item, options))
            };
            return result;
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
          "import { createApolloMock } from 'apollo-typed-documents';

          const operations = {};

          export default createApolloMock(operations);

          operations.authors = {};
          operations.authors.variables = (values = {}, options = {}) => {
            const __typename = '';
            values = (({  }) => ({  }))(values);
            values.__typename = __typename;
            let result = {

            };
            return result;
          }
          operations.authors.data = (values = {}, options = {}) => {
            const __typename = '';
            values = (({ authors = null }) => ({ authors }))(values);
            values.__typename = __typename;
            let result = {
              authors: !values.authors ? values.authors : values.authors.map(item => ((values = {}, options = {}) => {
                const __typename = 'Author';
                values = (({ idField = null, stringField = null, stringFieldNonNull = null, intField = null, intFieldNonNull = null, posts = null, postsNonNull = null }) => ({ idField, stringField, stringFieldNonNull, intField, intFieldNonNull, posts, postsNonNull }))(values);
                values.__typename = __typename;
                let result = {
                  idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
                  stringField: values.stringField,
                  stringFieldNonNull: (values.stringFieldNonNull === null || values.stringFieldNonNull === undefined) ? [__typename, 'stringFieldNonNull'].filter(v => v).join('-') : values.stringFieldNonNull,
                  intField: values.intField,
                  intFieldNonNull: (values.intFieldNonNull === null || values.intFieldNonNull === undefined) ? 1 : values.intFieldNonNull,
                  posts: !values.posts ? values.posts : values.posts.map(item => ((values = {}, options = {}) => {
                    const __typename = 'Post';
                    values = (({ idField = null, author = null, authorNonNull = null }) => ({ idField, author, authorNonNull }))(values);
                    values.__typename = __typename;
                    let result = {
                      idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
                      author: !values.author ? values.author : ((values = {}, options = {}) => {
                        const __typename = 'Author';
                        values = (({ idField = null }) => ({ idField }))(values);
                        values.__typename = __typename;
                        let result = {
                          idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
                          ...(options.addTypename ? { __typename } : {})
                        };
                        return result;
                      })(values.author, options),
                      authorNonNull: ((values = {}, options = {}) => {
                        const __typename = 'Author';
                        values = (({ idField = null }) => ({ idField }))(values);
                        values.__typename = __typename;
                        let result = {
                          idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
                          ...(options.addTypename ? { __typename } : {})
                        };
                        return result;
                      })(values.authorNonNull || undefined, options),
                      ...(options.addTypename ? { __typename } : {})
                    };
                    return result;
                  })(item, options)),
                  postsNonNull: (values.postsNonNull || []).map(item => ((values = {}, options = {}) => {
                    const __typename = 'Post';
                    values = (({ idField = null, author = null, authorNonNull = null }) => ({ idField, author, authorNonNull }))(values);
                    values.__typename = __typename;
                    let result = {
                      idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
                      author: !values.author ? values.author : ((values = {}, options = {}) => {
                        const __typename = 'Author';
                        values = (({ idField = null }) => ({ idField }))(values);
                        values.__typename = __typename;
                        let result = {
                          idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
                          ...(options.addTypename ? { __typename } : {})
                        };
                        return result;
                      })(values.author, options),
                      authorNonNull: ((values = {}, options = {}) => {
                        const __typename = 'Author';
                        values = (({ idField = null }) => ({ idField }))(values);
                        values.__typename = __typename;
                        let result = {
                          idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
                          ...(options.addTypename ? { __typename } : {})
                        };
                        return result;
                      })(values.authorNonNull || undefined, options),
                      ...(options.addTypename ? { __typename } : {})
                    };
                    return result;
                  })(item, options)),
                  ...(options.addTypename ? { __typename } : {})
                };
                return result;
              })(item, options))
            };
            return result;
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
          "import { createApolloMock } from 'apollo-typed-documents';

          const operations = {};

          export default createApolloMock(operations);

          operations.authors = {};
          operations.authors.variables = (values = {}, options = {}) => {
            const __typename = '';
            values = (({  }) => ({  }))(values);
            values.__typename = __typename;
            let result = {

            };
            return result;
          }
          operations.authors.data = (values = {}, options = {}) => {
            const __typename = '';
            values = (({ authors = null }) => ({ authors }))(values);
            values.__typename = __typename;
            let result = {
              authors: !values.authors ? values.authors : values.authors.map(item => ((values = {}, options = {}) => {
                const __typename = 'Author';
                values = (({ idField = null }) => ({ idField }))(values);
                values.__typename = __typename;
                let result = {
                  idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
                  ...(options.addTypename ? { __typename } : {})
                };
                return result;
              })(item, options))
            };
            return result;
          }

          operations.authorsNonNull = {};
          operations.authorsNonNull.variables = (values = {}, options = {}) => {
            const __typename = '';
            values = (({  }) => ({  }))(values);
            values.__typename = __typename;
            let result = {

            };
            return result;
          }
          operations.authorsNonNull.data = (values = {}, options = {}) => {
            const __typename = '';
            values = (({ authorsNonNull = null }) => ({ authorsNonNull }))(values);
            values.__typename = __typename;
            let result = {
              authorsNonNull: (values.authorsNonNull || []).map(item => ((values = {}, options = {}) => {
                const __typename = 'Author';
                values = (({ idField = null }) => ({ idField }))(values);
                values.__typename = __typename;
                let result = {
                  idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
                  ...(options.addTypename ? { __typename } : {})
                };
                return result;
              })(item, options))
            };
            return result;
          }"
        `);

        done();
      });
    });

    describe("with interface", () => {
      let document: DocumentNode;
      let output: string;
      let apolloMock: ApolloMockFn;

      beforeEach(async (done) => {
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

        done();
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
            let result = {

            };
            return result;
          }
          operations.objects.data = (values = {}, options = {}) => {
            const __typename = '';
            values = (({ objects = null }) => ({ objects }))(values);
            values.__typename = __typename;
            let result = {
              objects: !values.objects ? values.objects : values.objects.map(item => ((values = {}, options = {}) => {
                const typenames = ['Author', 'Post'];
                const __typename = typenames.find(typename => typename === values.__typename) || typenames[0];
                values = (({ idField = null }) => ({ idField }))(values);
                values.__typename = __typename;
                let result = {
                  idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
                  ...(options.addTypename ? { __typename } : {})
                };
                return result;
              })(item, options))
            };
            return result;
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

      beforeEach(async (done) => {
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

        done();
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
            let result = {

            };
            return result;
          }
          operations.search.data = (values = {}, options = {}) => {
            const __typename = '';
            values = (({ search = null }) => ({ search }))(values);
            values.__typename = __typename;
            let result = {
              search: !values.search ? values.search : values.search.map(item => ((values = {}, options = {}) => {
                const typenames = ['Author', 'Post'];
                const __typename = typenames.find(typename => typename === values.__typename) || typenames[0];
                values = (({  }) => ({  }))(values);
                values.__typename = __typename;
                let result = {
                  ...(options.addTypename ? { __typename } : {})
                };
                if (['Author', 'Post'].find(typename => typename === __typename)) {
                  result = {...result, ...((values = {}, options = {}) => {
                    const typenames = ['Author', 'Post'];
                    const __typename = typenames.find(typename => typename === values.__typename) || typenames[0];
                    values = (({ idField = null }) => ({ idField }))(values);
                    values.__typename = __typename;
                    let result = {
                      idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
                      ...(options.addTypename ? { __typename } : {})
                    };
                    return result;
                  })(values, options)};
                }
                if (['Author'].find(typename => typename === __typename)) {
                  result = {...result, ...((values = {}, options = {}) => {
                    const __typename = 'Author';
                    values = (({ posts = null }) => ({ posts }))(values);
                    values.__typename = __typename;
                    let result = {
                      posts: !values.posts ? values.posts : values.posts.map(item => ((values = {}, options = {}) => {
                        const __typename = 'Post';
                        values = (({ idField = null }) => ({ idField }))(values);
                        values.__typename = __typename;
                        let result = {
                          idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
                          ...(options.addTypename ? { __typename } : {})
                        };
                        return result;
                      })(item, options)),
                      ...(options.addTypename ? { __typename } : {})
                    };
                    return result;
                  })(values, options)};
                }
                if (['Post'].find(typename => typename === __typename)) {
                  result = {...result, ...((values = {}, options = {}) => {
                    const __typename = 'Post';
                    values = (({ author = null }) => ({ author }))(values);
                    values.__typename = __typename;
                    let result = {
                      author: !values.author ? values.author : ((values = {}, options = {}) => {
                        const __typename = 'Author';
                        values = (({ idField = null }) => ({ idField }))(values);
                        values.__typename = __typename;
                        let result = {
                          idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
                          ...(options.addTypename ? { __typename } : {})
                        };
                        return result;
                      })(values.author, options),
                      ...(options.addTypename ? { __typename } : {})
                    };
                    return result;
                  })(values, options)};
                }
                return result;
              })(item, options))
            };
            return result;
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
                    "__typename": "Author",
                    "idField": "Author-idField",
                    "posts": null
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
                    "__typename": "Post",
                    "idField": "Post-idField",
                    "author": null
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
                    "__typename": "Author",
                    "idField": "Author-idField",
                    "posts": null
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
          "import { createApolloMock } from 'apollo-typed-documents';

          const operations = {};

          export default createApolloMock(operations);

          operations.createAuthor = {};
          operations.createAuthor.variables = (values = {}, options = {}) => {
            const __typename = '';
            values = (({  }) => ({  }))(values);
            values.__typename = __typename;
            let result = {

            };
            return result;
          }
          operations.createAuthor.data = (values = {}, options = {}) => {
            const __typename = '';
            values = (({ createAuthor = null }) => ({ createAuthor }))(values);
            values.__typename = __typename;
            let result = {
              createAuthor: ((values = {}, options = {}) => {
                const __typename = 'Author';
                values = (({ idField = null }) => ({ idField }))(values);
                values.__typename = __typename;
                let result = {
                  idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
                  ...(options.addTypename ? { __typename } : {})
                };
                return result;
              })(values.createAuthor || undefined, options)
            };
            return result;
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
          "import { createApolloMock } from 'apollo-typed-documents';

          const operations = {};

          export default createApolloMock(operations);

          operations.createAuthorExtensive = {};
          operations.createAuthorExtensive.variables = (values = {}, options = {}) => {
            const __typename = '';
            values = (({ author = undefined, authorNonNull = undefined }) => ({ author, authorNonNull }))(values);
            values.__typename = __typename;
            let result = {
              author: !values.author ? values.author : (AuthorInput)(values.author, options),
              authorNonNull: (AuthorInput)(values.authorNonNull || undefined, options)
            };
            return result;
          }
          operations.createAuthorExtensive.data = (values = {}, options = {}) => {
            const __typename = '';
            values = (({ createAuthorExtensive = null }) => ({ createAuthorExtensive }))(values);
            values.__typename = __typename;
            let result = {
              createAuthorExtensive: ((values = {}, options = {}) => {
                const __typename = 'Author';
                values = (({ idField = null }) => ({ idField }))(values);
                values.__typename = __typename;
                let result = {
                  idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
                  ...(options.addTypename ? { __typename } : {})
                };
                return result;
              })(values.createAuthorExtensive || undefined, options)
            };
            return result;
          }

          const PostInput = (values = {}, options = {}) => {
            const __typename = 'PostInput';
            values = (({ idField = undefined, author = undefined, authorNonNull = undefined }) => ({ idField, author, authorNonNull }))(values);
            values.__typename = __typename;
            let result = {
              idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
              author: !values.author ? values.author : (AuthorInput)(values.author, options),
              authorNonNull: (AuthorInput)(values.authorNonNull || undefined, options)
            };
            return result;
          }

          const AuthorInput = (values = {}, options = {}) => {
            const __typename = 'AuthorInput';
            values = (({ idField = undefined, stringField = undefined, stringFieldNonNull = undefined, intField = undefined, intFieldNonNull = undefined, posts = undefined, postsNonNull = undefined }) => ({ idField, stringField, stringFieldNonNull, intField, intFieldNonNull, posts, postsNonNull }))(values);
            values.__typename = __typename;
            let result = {
              idField: (values.idField === null || values.idField === undefined) ? [__typename, 'idField'].filter(v => v).join('-') : values.idField,
              stringField: values.stringField,
              stringFieldNonNull: (values.stringFieldNonNull === null || values.stringFieldNonNull === undefined) ? [__typename, 'stringFieldNonNull'].filter(v => v).join('-') : values.stringFieldNonNull,
              intField: values.intField,
              intFieldNonNull: (values.intFieldNonNull === null || values.intFieldNonNull === undefined) ? 1 : values.intFieldNonNull,
              posts: !values.posts ? values.posts : values.posts.map(item => (PostInput)(item, options)),
              postsNonNull: (values.postsNonNull || []).map(item => (PostInput)(item, options))
            };
            return result;
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
