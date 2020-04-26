import { MockedProvider } from "@apollo/react-testing";
import React from "react";
import ReactDOM from "react-dom";

import apolloMock from "./apolloMock";
import App from "./App";
import authorsQuery from "./authors.graphql";
import createAuthorMutation from "./createAuthor.graphql";

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

ReactDOM.render(
  <React.StrictMode>
    <MockedProvider mocks={mocks}>
      <App />
    </MockedProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
