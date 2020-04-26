declare module "@codegen-types" {
export type Maybe<T> = T | null;


/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type Author = {
   __typename?: 'Author';
  id: Scalars['ID'];
  name: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  books: Array<Book>;
};

export type AuthorInput = {
  name: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  books: Array<BookInput>;
};

export type Book = {
   __typename?: 'Book';
  id: Scalars['ID'];
  title: Scalars['String'];
};

export type BookInput = {
  title: Scalars['String'];
};

export type Mutation = {
   __typename?: 'Mutation';
  createAuthor: Author;
};


export type MutationCreateAuthorArgs = {
  input: AuthorInput;
};

export type Query = {
   __typename?: 'Query';
  authors: Array<Author>;
};

export type AuthorsQueryVariables = {};


export type AuthorsQuery = (
  { __typename?: 'Query' }
  & { authors: Array<(
    { __typename?: 'Author' }
    & Pick<Author, 'id' | 'name' | 'description'>
    & { books: Array<(
      { __typename?: 'Book' }
      & Pick<Book, 'id' | 'title'>
    )> }
  )> }
);

export type CreateAuthorMutationVariables = {
  input: AuthorInput;
};


export type CreateAuthorMutation = (
  { __typename?: 'Mutation' }
  & { createAuthor: (
    { __typename?: 'Author' }
    & Pick<Author, 'id' | 'name' | 'description'>
    & { books: Array<(
      { __typename?: 'Book' }
      & Pick<Book, 'id' | 'title'>
    )> }
  ) }
);

}