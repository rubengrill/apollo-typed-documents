import { MockedProvider } from "@apollo/react-testing";
import { GraphQLError } from "graphql";
import React from "react";
import ReactDOM from "react-dom";

import apolloMock from "./apolloMock";
import App from "./App";
import authorsQuery from "./authors.graphql";
import createAuthorMutation from "./createAuthor.graphql";

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
  apolloMock(
    createAuthorMutation,
    {
      input: { name: "Foo", books: [{ title: "Bar" }] },
    },
    { errors: [new GraphQLError("Foo already exists")] }
  ),
  apolloMock(
    createAuthorMutation,
    {
      input: { name: "Foo", books: [{ title: "Bar" }] },
    },
    new Error("Connection problem")
  ),
];

ReactDOM.render(
  <React.StrictMode>
    <MockedProvider mocks={mocks}>
      <App />
    </MockedProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
