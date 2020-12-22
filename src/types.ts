import { DocumentNode } from "graphql";

export type OperationVariables = Record<string, unknown>;

// eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/no-unused-vars
export interface TypedDocumentNode<TVariables extends OperationVariables, TData>
  extends DocumentNode {}
