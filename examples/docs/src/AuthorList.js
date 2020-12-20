import { useMutation, useQuery } from "@apollo/client";
import React from "react";

import authorsQuery from "./authors.graphql";
import createAuthorMutation from "./createAuthor.graphql";

const AuthorList = () => {
  // Type of `data` is inferred (AuthorsQuery)
  const { data } = useQuery(authorsQuery);
  const [createAuthor] = useMutation(createAuthorMutation);

  return (
    <>
      <ul>
        {data?.authors.map((author) => (
          <li key={author.id}>{author.name}</li>
        ))}
      </ul>
      <button
        onClick={() => {
          createAuthor({
            // Type of variables is inferred (CreateAuthorMutationVariables)
            variables: { input: { name: "Foo", books: [{ title: "Bar" }] } },
          });
        }}
      >
        Add
      </button>
    </>
  );
};

export default AuthorList;
