import { MockedProvider } from "@apollo/react-testing";
import { fireEvent, render, wait } from "@testing-library/react";
import React from "react";

import apolloMock from "./apolloMock";
import App from "./App";
import authorsQuery from "./authors.graphql";
import createAuthorMutation from "./createAuthor.graphql";

test("adds author", async () => {
  const mocks = [
    apolloMock(authorsQuery, {}, { authors: [] }),
    apolloMock(
      createAuthorMutation,
      { input: { name: "Foo", books: [{ title: "Bar" }] } },
      { createAuthor: { name: "Foo", books: [{ title: "Bar" }] } }
    ),
    apolloMock(
      authorsQuery,
      {},
      { authors: [{ name: "Foo", books: [{ title: "Bar" }] }] }
    ),
  ];

  const { getByText } = render(
    <MockedProvider mocks={mocks}>
      <App />
    </MockedProvider>
  );

  fireEvent.click(getByText("Add"));

  await wait(() => {
    expect(getByText("Foo")).toBeInTheDocument();
  });
});
