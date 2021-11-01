declare module "@codegen-types" {
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  Date: string;
};

export type Author = {
  __typename?: 'Author';
  books: Array<Book>;
  createdAt: Scalars['Date'];
  description?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  name: Scalars['String'];
};

export type AuthorInput = {
  books: Array<BookInput>;
  description?: Maybe<Scalars['String']>;
  name: Scalars['String'];
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

export type AuthorsQueryVariables = Exact<{ [key: string]: never; }>;


export type AuthorsQuery = { __typename?: 'Query', authors: Array<{ __typename?: 'Author', id: string, createdAt: string, name: string, description?: string | null | undefined, books: Array<{ __typename?: 'Book', id: string, title: string }> }> };

export type CreateAuthorMutationVariables = Exact<{
  input: AuthorInput;
}>;


export type CreateAuthorMutation = { __typename?: 'Mutation', createAuthor: { __typename?: 'Author', id: string, createdAt: string, name: string, description?: string | null | undefined, books: Array<{ __typename?: 'Book', id: string, title: string }> } };

}