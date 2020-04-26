declare module "*/authors.graphql" {
  import { TypedDocumentNode } from "apollo-typed-documents";
  import { AuthorsQuery, AuthorsQueryVariables } from "@codegen-types";
  export const authors: TypedDocumentNode<AuthorsQueryVariables, AuthorsQuery>;
  export default authors;
}

declare module "*/createAuthor.graphql" {
  import { TypedDocumentNode } from "apollo-typed-documents";
  import { CreateAuthorMutation, CreateAuthorMutationVariables } from "@codegen-types";
  export const createAuthor: TypedDocumentNode<CreateAuthorMutationVariables, CreateAuthorMutation>;
  export default createAuthor;
}