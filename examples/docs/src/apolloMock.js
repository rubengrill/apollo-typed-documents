import { createApolloMock } from 'apollo-typed-documents';

const operations = {};

export default createApolloMock(operations);

operations.authors = {};
operations.authors.variables = (values = {}, options = {}) => {
  const __typename = '';
  values = (({  }) => ({  }))(values);
  values.__typename = __typename;
  let result = {

  };
  return result;
}
operations.authors.data = (values = {}, options = {}) => {
  const __typename = '';
  values = (({ authors = null }) => ({ authors }))(values);
  values.__typename = __typename;
  let result = {
    authors: (values.authors || []).map(item => ((values = {}, options = {}) => {
      const __typename = 'Author';
      values = (({ id = null, name = null, description = null, books = null }) => ({ id, name, description, books }))(values);
      values.__typename = __typename;
      let result = {
        id: (values.id === null || values.id === undefined) ? [__typename, 'id'].filter(v => v).join('-') : values.id,
        name: (values.name === null || values.name === undefined) ? [__typename, 'name'].filter(v => v).join('-') : values.name,
        description: values.description,
        books: (values.books || []).map(item => ((values = {}, options = {}) => {
          const __typename = 'Book';
          values = (({ id = null, title = null }) => ({ id, title }))(values);
          values.__typename = __typename;
          let result = {
            id: (values.id === null || values.id === undefined) ? [__typename, 'id'].filter(v => v).join('-') : values.id,
            title: (values.title === null || values.title === undefined) ? [__typename, 'title'].filter(v => v).join('-') : values.title,
            ...(options.addTypename ? { __typename } : {})
          };
          return result;
        })(item, options)),
        ...(options.addTypename ? { __typename } : {})
      };
      return result;
    })(item, options))
  };
  return result;
}

operations.createAuthor = {};
operations.createAuthor.variables = (values = {}, options = {}) => {
  const __typename = '';
  values = (({ input = undefined }) => ({ input }))(values);
  values.__typename = __typename;
  let result = {
    input: (AuthorInput)(values.input || undefined, options)
  };
  return result;
}
operations.createAuthor.data = (values = {}, options = {}) => {
  const __typename = '';
  values = (({ createAuthor = null }) => ({ createAuthor }))(values);
  values.__typename = __typename;
  let result = {
    createAuthor: ((values = {}, options = {}) => {
      const __typename = 'Author';
      values = (({ id = null, name = null, description = null, books = null }) => ({ id, name, description, books }))(values);
      values.__typename = __typename;
      let result = {
        id: (values.id === null || values.id === undefined) ? [__typename, 'id'].filter(v => v).join('-') : values.id,
        name: (values.name === null || values.name === undefined) ? [__typename, 'name'].filter(v => v).join('-') : values.name,
        description: values.description,
        books: (values.books || []).map(item => ((values = {}, options = {}) => {
          const __typename = 'Book';
          values = (({ id = null, title = null }) => ({ id, title }))(values);
          values.__typename = __typename;
          let result = {
            id: (values.id === null || values.id === undefined) ? [__typename, 'id'].filter(v => v).join('-') : values.id,
            title: (values.title === null || values.title === undefined) ? [__typename, 'title'].filter(v => v).join('-') : values.title,
            ...(options.addTypename ? { __typename } : {})
          };
          return result;
        })(item, options)),
        ...(options.addTypename ? { __typename } : {})
      };
      return result;
    })(values.createAuthor || undefined, options)
  };
  return result;
}

const BookInput = (values = {}, options = {}) => {
  const __typename = 'BookInput';
  values = (({ title = undefined }) => ({ title }))(values);
  values.__typename = __typename;
  let result = {
    title: (values.title === null || values.title === undefined) ? [__typename, 'title'].filter(v => v).join('-') : values.title
  };
  return result;
}

const AuthorInput = (values = {}, options = {}) => {
  const __typename = 'AuthorInput';
  values = (({ name = undefined, description = undefined, books = undefined }) => ({ name, description, books }))(values);
  values.__typename = __typename;
  let result = {
    name: (values.name === null || values.name === undefined) ? [__typename, 'name'].filter(v => v).join('-') : values.name,
    description: values.description,
    books: (values.books || []).map(item => (BookInput)(item, options))
  };
  return result;
}