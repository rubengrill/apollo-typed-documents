import { MockedResponse } from "@apollo/react-testing";
import { FetchResult } from "apollo-link";
import { GraphQLError, OperationDefinitionNode } from "graphql";

import { OperationVariables, TypedDocumentNode } from "./types";

export interface TypedMockedResponse<
  TVariables extends OperationVariables,
  TData
> extends MockedResponse {
  request: {
    query: TypedDocumentNode<TVariables, TData>;
    variables: TVariables;
  };
  result?: FetchResult<TData>;
}

export interface ApolloMockOptions {
  addTypename?: boolean;
  scalarValues?: { [scalarTypeName: string]: unknown };
}

export type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};

export type ApolloMockFn = {
  <TVariables extends OperationVariables, TData>(
    documentNode: TypedDocumentNode<TVariables, TData>,
    variables?: RecursivePartial<TVariables>,
    result?: FetchResult<RecursivePartial<TData>>,
    options?: ApolloMockOptions
  ): TypedMockedResponse<TVariables, TData>;
  <TVariables extends OperationVariables, TData>(
    documentNode: TypedDocumentNode<TVariables, TData>,
    variables: RecursivePartial<TVariables>,
    error: Error,
    options?: ApolloMockOptions
  ): TypedMockedResponse<TVariables, TData>;
};

const getDefaultScalarValue = ({
  scalarTypeName,
  mappedTypeName,
  fieldName,
  __typename,
  scalarValues,
}: {
  scalarTypeName: string;
  mappedTypeName: string;
  fieldName: string;
  __typename: string;
  scalarValues?: { [scalarTypeName: string]: unknown };
}) => {
  if (scalarValues && scalarTypeName in scalarValues) {
    const value = scalarValues[scalarTypeName];

    if (value === undefined || value === null) {
      throw new Error(
        `Scalar value for "${scalarTypeName}" must not be null or undefined. Please fix "scalarValues" option.`
      );
    }

    return value;
  }

  if (mappedTypeName === "number") {
    return 1;
  } else if (mappedTypeName === "string") {
    return [__typename, fieldName].filter((v) => v).join("-");
  } else if (mappedTypeName === "boolean") {
    return false;
  } else {
    throw new Error(
      `Could not generate default value for "${scalarTypeName}". ` +
        `Please either provide a mapping in "scalarValues" option ` +
        `or provide a mapping in "scalars" option of codegen plugins to map "${scalarTypeName}" to number, string or boolean.`
    );
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default (operations: any): ApolloMockFn => <
  TVariables extends OperationVariables,
  TData
>(
  documentNode: TypedDocumentNode<TVariables, TData>,
  variables?: RecursivePartial<TVariables>,
  resultOrError?: FetchResult<RecursivePartial<TData>> | Error,
  options?: ApolloMockOptions
): TypedMockedResponse<TVariables, TData> => {
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

  let error: Error | undefined;
  let errors: ReadonlyArray<GraphQLError> | undefined;
  let data: RecursivePartial<TData> | null | undefined;

  if (resultOrError instanceof Error) {
    error = resultOrError;
  } else if (resultOrError) {
    const result = resultOrError;
    errors = result.errors;
    data = result.data;
  }

  options = Object.assign(
    { addTypename: true, getDefaultScalarValue },
    options || {}
  );

  const response: TypedMockedResponse<TVariables, TData> = {
    request: {
      query: documentNode,
      variables: operation.variables(variables || undefined, options),
    },
  };

  if (error) {
    response.error = error;
  } else if (errors) {
    response.result = {};
    response.result.errors = errors;

    if (data === null) {
      response.result.data = null;
    } else if (data) {
      response.result.data = operation.data(data, options);
    }
  } else {
    response.result = {};
    response.result.data = operation.data(data || undefined, options);
  }

  return response;
};
