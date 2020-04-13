import { DocumentNode } from "graphql";

export type OperationVariables = Record<string, any>;

export interface TypedDocumentNode<
  TVariables extends OperationVariables,
  TData
> extends DocumentNode {}
