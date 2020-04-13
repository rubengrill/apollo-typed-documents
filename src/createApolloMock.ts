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

export default (operations: any) => <
  TVariables extends OperationVariables,
  TData,
  TInput extends TVariables = TVariables,
  TOutput extends TData = TData
>(
  documentNode: TypedDocumentNode<TVariables, TData>,
  variables: TInput,
  data: TOutput
): ApolloMock<TVariables, TData> => {
  const definitionNode = documentNode.definitions[0];
  const operationNode = definitionNode as OperationDefinitionNode;
  const operationName = operationNode.name!.value;
  const operation = operations[operationName];

  if (!operation) {
    throw new Error(`Couldn't find operation "${operationName}"`);
  }

  return {
    request: {
      query: documentNode,
      variables,
    },
    result: {
      data: operation(data),
    },
  };
};
