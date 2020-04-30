/* eslint-disable */

import { createApolloMock } from 'apollo-typed-documents';

const operations = {};

export default createApolloMock(operations);

operations.authors = {};
operations.authors.variables = (values = {}, options = {}) => {
  const __typename = '';
  values = (({  }) => ({  }))(values);
  values.__typename = __typename;
  return {

  };
};
operations.authors.data = (values = {}, options = {}) => {
  const __typename = '';
  values = (({ authors = null }) => ({ authors }))(values);
  values.__typename = __typename;
  return {
    authors: (values.authors || []).map(item => ((values = {}, options = {}) => {
      const __typename = 'Author';
      values = (({ id = null, createdAt = null, name = null, description = null, books = null }) => ({ id, createdAt, name, description, books }))(values);
      values.__typename = __typename;
      return {
        id: (values.id === null || values.id === undefined) ? options.getDefaultScalarValue({ scalarTypeName: 'ID', mappedTypeName: 'string', fieldName: 'id', __typename, scalarValues: options.scalarValues }) : values.id,
        createdAt: (values.createdAt === null || values.createdAt === undefined) ? options.getDefaultScalarValue({ scalarTypeName: 'Date', mappedTypeName: 'string', fieldName: 'createdAt', __typename, scalarValues: options.scalarValues }) : values.createdAt,
        name: (values.name === null || values.name === undefined) ? options.getDefaultScalarValue({ scalarTypeName: 'String', mappedTypeName: 'string', fieldName: 'name', __typename, scalarValues: options.scalarValues }) : values.name,
        description: values.description,
        books: (values.books || []).map(item => ((values = {}, options = {}) => {
          const __typename = 'Book';
          values = (({ id = null, title = null }) => ({ id, title }))(values);
          values.__typename = __typename;
          return {
            id: (values.id === null || values.id === undefined) ? options.getDefaultScalarValue({ scalarTypeName: 'ID', mappedTypeName: 'string', fieldName: 'id', __typename, scalarValues: options.scalarValues }) : values.id,
            title: (values.title === null || values.title === undefined) ? options.getDefaultScalarValue({ scalarTypeName: 'String', mappedTypeName: 'string', fieldName: 'title', __typename, scalarValues: options.scalarValues }) : values.title,
            ...(options.addTypename ? { __typename } : {})
          };
        })(item, options)),
        ...(options.addTypename ? { __typename } : {})
      };
    })(item, options))
  };
};

operations.createAuthor = {};
operations.createAuthor.variables = (values = {}, options = {}) => {
  const __typename = '';
  values = (({ input = undefined }) => ({ input }))(values);
  values.__typename = __typename;
  return {
    input: (AuthorInput)(values.input || undefined, options)
  };
};
operations.createAuthor.data = (values = {}, options = {}) => {
  const __typename = '';
  values = (({ createAuthor = null }) => ({ createAuthor }))(values);
  values.__typename = __typename;
  return {
    createAuthor: ((values = {}, options = {}) => {
      const __typename = 'Author';
      values = (({ id = null, createdAt = null, name = null, description = null, books = null }) => ({ id, createdAt, name, description, books }))(values);
      values.__typename = __typename;
      return {
        id: (values.id === null || values.id === undefined) ? options.getDefaultScalarValue({ scalarTypeName: 'ID', mappedTypeName: 'string', fieldName: 'id', __typename, scalarValues: options.scalarValues }) : values.id,
        createdAt: (values.createdAt === null || values.createdAt === undefined) ? options.getDefaultScalarValue({ scalarTypeName: 'Date', mappedTypeName: 'string', fieldName: 'createdAt', __typename, scalarValues: options.scalarValues }) : values.createdAt,
        name: (values.name === null || values.name === undefined) ? options.getDefaultScalarValue({ scalarTypeName: 'String', mappedTypeName: 'string', fieldName: 'name', __typename, scalarValues: options.scalarValues }) : values.name,
        description: values.description,
        books: (values.books || []).map(item => ((values = {}, options = {}) => {
          const __typename = 'Book';
          values = (({ id = null, title = null }) => ({ id, title }))(values);
          values.__typename = __typename;
          return {
            id: (values.id === null || values.id === undefined) ? options.getDefaultScalarValue({ scalarTypeName: 'ID', mappedTypeName: 'string', fieldName: 'id', __typename, scalarValues: options.scalarValues }) : values.id,
            title: (values.title === null || values.title === undefined) ? options.getDefaultScalarValue({ scalarTypeName: 'String', mappedTypeName: 'string', fieldName: 'title', __typename, scalarValues: options.scalarValues }) : values.title,
            ...(options.addTypename ? { __typename } : {})
          };
        })(item, options)),
        ...(options.addTypename ? { __typename } : {})
      };
    })(values.createAuthor || undefined, options)
  };
};

const BookInput = (values = {}, options = {}) => {
  const __typename = 'BookInput';
  values = (({ title = undefined }) => ({ title }))(values);
  values.__typename = __typename;
  return {
    title: (values.title === null || values.title === undefined) ? options.getDefaultScalarValue({ scalarTypeName: 'String', mappedTypeName: 'string', fieldName: 'title', __typename, scalarValues: options.scalarValues }) : values.title
  };
};

const AuthorInput = (values = {}, options = {}) => {
  const __typename = 'AuthorInput';
  values = (({ name = undefined, description = undefined, books = undefined }) => ({ name, description, books }))(values);
  values.__typename = __typename;
  return {
    name: (values.name === null || values.name === undefined) ? options.getDefaultScalarValue({ scalarTypeName: 'String', mappedTypeName: 'string', fieldName: 'name', __typename, scalarValues: options.scalarValues }) : values.name,
    description: values.description,
    books: (values.books || []).map(item => (BookInput)(item, options))
  };
};