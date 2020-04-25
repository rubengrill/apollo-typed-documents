import { createApolloMock } from "apollo-typed-documents";

const operations = {};

export default createApolloMock(operations);

operations.authors = {};
operations.authors.variables = (values = {}, options = {}) => {
  values = (({  }) => ({  }))(values);
  return {

  };
}
operations.authors.data = (values = {}, options = {}) => {
  values = (({ authors = null }) => ({ authors }))(values);
  return {
    authors: (values.authors || []).map(item => ((values = {}, options = {}) => {
      values = (({ id = null, name = null, description = null, books = null }) => ({ id, name, description, books }))(values);
      return {
        id: (values.id === null || values.id === undefined) ? "Author-id" : values.id,
        name: (values.name === null || values.name === undefined) ? "Author-name" : values.name,
        description: values.description,
        books: (values.books || []).map(item => ((values = {}, options = {}) => {
          values = (({ id = null, title = null }) => ({ id, title }))(values);
          return {
            id: (values.id === null || values.id === undefined) ? "Book-id" : values.id,
            title: (values.title === null || values.title === undefined) ? "Book-title" : values.title,
            ...(options.addTypename ? {__typename: "Book"} : {})
          };
        })(item, options)),
        ...(options.addTypename ? {__typename: "Author"} : {})
      };
    })(item, options))
  };
}

operations.createAuthor = {};
operations.createAuthor.variables = (values = {}, options = {}) => {
  values = (({ input = undefined }) => ({ input }))(values);
  return {
    input: (AuthorInput)(values.input || undefined, options)
  };
}
operations.createAuthor.data = (values = {}, options = {}) => {
  values = (({ createAuthor = null }) => ({ createAuthor }))(values);
  return {
    createAuthor: ((values = {}, options = {}) => {
      values = (({ id = null, name = null, description = null, books = null }) => ({ id, name, description, books }))(values);
      return {
        id: (values.id === null || values.id === undefined) ? "Author-id" : values.id,
        name: (values.name === null || values.name === undefined) ? "Author-name" : values.name,
        description: values.description,
        books: (values.books || []).map(item => ((values = {}, options = {}) => {
          values = (({ id = null, title = null }) => ({ id, title }))(values);
          return {
            id: (values.id === null || values.id === undefined) ? "Book-id" : values.id,
            title: (values.title === null || values.title === undefined) ? "Book-title" : values.title,
            ...(options.addTypename ? {__typename: "Book"} : {})
          };
        })(item, options)),
        ...(options.addTypename ? {__typename: "Author"} : {})
      };
    })(values.createAuthor || undefined, options)
  };
}

const BookInput = (values = {}, options = {}) => {
  values = (({ title = undefined }) => ({ title }))(values);
  return {
    title: (values.title === null || values.title === undefined) ? "BookInput-title" : values.title
  };
}

const AuthorInput = (values = {}, options = {}) => {
  values = (({ name = undefined, description = undefined, books = undefined }) => ({ name, description, books }))(values);
  return {
    name: (values.name === null || values.name === undefined) ? "AuthorInput-name" : values.name,
    description: values.description,
    books: (values.books || []).map(item => (BookInput)(item, options))
  };
}