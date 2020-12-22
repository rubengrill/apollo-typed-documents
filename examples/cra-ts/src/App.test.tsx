import { MockedProvider } from "@apollo/react-testing";
import { fireEvent, render, waitFor } from "@testing-library/react";
import React from "react";

import apolloMock from "./apolloMock";
import App from "./App";
import authorsQuery from "./authors.graphql";
import createAuthorMutation from "./createAuthor.graphql";

test("adds author", async () => {
  const mocks = [
    apolloMock(authorsQuery, {}, { data: { authors: [] } }),
    apolloMock(
      createAuthorMutation,
      { input: { name: "Foo", books: [{ title: "Bar" }] } },
      { data: { createAuthor: { name: "Foo", books: [{ title: "Bar" }] } } }
    ),
    apolloMock(
      authorsQuery,
      {},
      { data: { authors: [{ name: "Foo", books: [{ title: "Bar" }] }] } }
    ),
  ];

  const { getByText } = render(
    <MockedProvider mocks={mocks}>
      <App />
    </MockedProvider>
  );

  fireEvent.click(getByText("Add"));

  await waitFor(() => {
    expect(getByText("Foo")).toBeInTheDocument();
  });
});
