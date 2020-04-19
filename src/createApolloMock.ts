import { OperationDefinitionNode } from "graphql";

import { OperationVariables, TypedDocumentNode } from "./types";

export interface ApolloMock<TVariables extends OperationVariables, TData> {
  request: {
    query: TypedDocumentNode<TVariables, TData>;
    variables: TVariables;
  };
  result: {
    data: TData;
  };
}

export interface ApolloMockOptions {
  addTypename?: boolean;
}

export type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};

export type ApolloMockFn = <TVariables extends OperationVariables, TData>(
  documentNode: TypedDocumentNode<TVariables, TData>,
  variables?: RecursivePartial<TVariables>,
  data?: RecursivePartial<TData>,
  options?: ApolloMockOptions
) => ApolloMock<TVariables, TData>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default (operations: any): ApolloMockFn => <
  TVariables extends OperationVariables,
  TData
>(
  documentNode: TypedDocumentNode<TVariables, TData>,
  variables?: RecursivePartial<TVariables>,
  data?: RecursivePartial<TData>,
  { addTypename = true }: ApolloMockOptions = {}
): ApolloMock<TVariables, TData> => {
  const definitionNode = documentNode.definitions[0];
  const operationNode = definitionNode as OperationDefinitionNode;

  if (!operationNode.name) {
    throw new Error("Missing operation name");
  }

  const operationName = operationNode.name.value;
  const operation = operations[operationName];

  if (!operation) {
    throw new Error(`Couldn't find operation "${operationName}"`);
  }

  return {
    request: {
      query: documentNode,
      variables: operation.variables(variables || undefined),
    },
    result: {
      data: operation.data(data || undefined, { addTypename }),
    },
  };
};
