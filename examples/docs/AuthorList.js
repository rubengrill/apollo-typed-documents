import { useMutation, useQuery } from "@apollo/react-hooks";
import React from "react";

import authorsQuery from "./documents/authors.graphql";
import createAuthorMutation from "./documents/createAuthor.graphql";

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
        onClick={() =>
          // Type of variables is inferred (CreateAuthorMutationVariables)
          createAuthor({
            variables: { input: { name: "Foo", books: [{ title: "Bar" }] } },
          })
        }
      >
        Add
      </button>
    </>
  );
};

export default AuthorList;
