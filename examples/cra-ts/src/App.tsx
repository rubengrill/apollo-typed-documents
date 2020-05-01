import { useMutation, useQuery } from "@apollo/client";
import React from "react";

import authorsQuery from "./authors.graphql";
import createAuthorMutation from "./createAuthor.graphql";

const App = () => {
  const { data } = useQuery(authorsQuery);
  const [createAuthor, { error }] = useMutation(createAuthorMutation, {
    refetchQueries: [{ query: authorsQuery }],
    onError: () => {},
  });

  return (
    <>
      <ul>
        {data?.authors.map((author) => (
          <li key={author.id}>{author.name}</li>
        ))}
      </ul>
      {error && <div style={{ color: "red" }}>{error.message}</div>}
      <button
        onClick={() => {
          createAuthor({
            variables: { input: { name: "Foo", books: [{ title: "Bar" }] } },
          });
        }}
      >
        Add
      </button>
    </>
  );
};

export default App;
