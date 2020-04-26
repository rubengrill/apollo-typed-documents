import { useMutation, useQuery } from "@apollo/react-hooks";
import React from "react";

import authorsQuery from "./authors.graphql";
import createAuthorMutation from "./createAuthor.graphql";

const App = () => {
  const { data } = useQuery(authorsQuery);
  const [createAuthor, { data: createAuthorData }] = useMutation(
    createAuthorMutation,
    {
      refetchQueries: [{ query: authorsQuery }],
    }
  );

  return (
    <>
      <ul>
        {data?.authors.map((author) => (
          <li key={author.id}>{author.name}</li>
        ))}
      </ul>
      {!createAuthorData && (
        <button
          onClick={() => {
            createAuthor({
              variables: { input: { name: "Foo", books: [{ title: "Bar" }] } },
            });
          }}
        >
          Add
        </button>
      )}
    </>
  );
};

export default App;
