/* eslint-disable */

import { createApolloMock } from 'apollo-typed-documents';

const operations = {};

export default createApolloMock(operations);

operations.authors = {};
operations.authors.variables = (values = {}, options = {}) => {
  const __typename = '';
  values = (({  }) => ({  }))(values);
  return {

  };
}
operations.authors.data = (values = {}, options = {}) => {
  const __typename = '';
  values = (({ authors = null }) => ({ authors }))(values);
  return {
    authors: (values.authors || []).map(item => ((values = {}, options = {}) => {
      const __typename = 'Author';
      values = (({ id = null, name = null, description = null, books = null }) => ({ id, name, description, books }))(values);
      return {
        id: (values.id === null || values.id === undefined) ? [__typename, 'id'].filter(v => v).join('-') : values.id,
        name: (values.name === null || values.name === undefined) ? [__typename, 'name'].filter(v => v).join('-') : values.name,
        description: values.description,
        books: (values.books || []).map(item => ((values = {}, options = {}) => {
          const __typename = 'Book';
          values = (({ id = null, title = null }) => ({ id, title }))(values);
          return {
            id: (values.id === null || values.id === undefined) ? [__typename, 'id'].filter(v => v).join('-') : values.id,
            title: (values.title === null || values.title === undefined) ? [__typename, 'title'].filter(v => v).join('-') : values.title,
            ...(options.addTypename ? { __typename } : {})
          };
        })(item, options)),
        ...(options.addTypename ? { __typename } : {})
      };
    })(item, options))
  };
}

operations.createAuthor = {};
operations.createAuthor.variables = (values = {}, options = {}) => {
  const __typename = '';
  values = (({ input = undefined }) => ({ input }))(values);
  return {
    input: (AuthorInput)(values.input || undefined, options)
  };
}
operations.createAuthor.data = (values = {}, options = {}) => {
  const __typename = '';
  values = (({ createAuthor = null }) => ({ createAuthor }))(values);
  return {
    createAuthor: ((values = {}, options = {}) => {
      const __typename = 'Author';
      values = (({ id = null, name = null, description = null, books = null }) => ({ id, name, description, books }))(values);
      return {
        id: (values.id === null || values.id === undefined) ? [__typename, 'id'].filter(v => v).join('-') : values.id,
        name: (values.name === null || values.name === undefined) ? [__typename, 'name'].filter(v => v).join('-') : values.name,
        description: values.description,
        books: (values.books || []).map(item => ((values = {}, options = {}) => {
          const __typename = 'Book';
          values = (({ id = null, title = null }) => ({ id, title }))(values);
          return {
            id: (values.id === null || values.id === undefined) ? [__typename, 'id'].filter(v => v).join('-') : values.id,
            title: (values.title === null || values.title === undefined) ? [__typename, 'title'].filter(v => v).join('-') : values.title,
            ...(options.addTypename ? { __typename } : {})
          };
        })(item, options)),
        ...(options.addTypename ? { __typename } : {})
      };
    })(values.createAuthor || undefined, options)
  };
}

const BookInput = (values = {}, options = {}) => {
  const __typename = 'BookInput';
  values = (({ title = undefined }) => ({ title }))(values);
  return {
    title: (values.title === null || values.title === undefined) ? [__typename, 'title'].filter(v => v).join('-') : values.title
  };
}

const AuthorInput = (values = {}, options = {}) => {
  const __typename = 'AuthorInput';
  values = (({ name = undefined, description = undefined, books = undefined }) => ({ name, description, books }))(values);
  return {
    name: (values.name === null || values.name === undefined) ? [__typename, 'name'].filter(v => v).join('-') : values.name,
    description: values.description,
    books: (values.books || []).map(item => (BookInput)(item, options))
  };
}