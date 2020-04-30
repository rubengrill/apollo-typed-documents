import apolloMock from "./apolloMock";
import authors from "./authors.graphql";
import createAuthor from "./createAuthor.graphql";

describe("apolloMock", () => {
  it("produces the minimal output that is valid according to graphql schema", () => {
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
              createdAt: "Author-createdAt",
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
            createdAt: "Author-createdAt",
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

  it("allows overriding default values for scalar types", () => {
    const scalarValues = { Date: "2020-01-01" };

    expect(
      apolloMock(authors, {}, { authors: [{}] }, { scalarValues })
    ).toEqual({
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
              createdAt: "2020-01-01",
              name: "Author-name",
              description: null,
              books: [],
            },
          ],
        },
      },
    });
  });
});
