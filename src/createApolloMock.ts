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
  scalarValues?: { [scalarTypeName: string]: unknown };
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
  data?: RecursivePartial<TData>,
  { addTypename = true, scalarValues }: ApolloMockOptions = {}
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

  const options = { addTypename, scalarValues, getDefaultScalarValue };

  return {
    request: {
      query: documentNode,
      variables: operation.variables(variables || undefined, options),
    },
    result: {
      data: operation.data(data || undefined, options),
    },
  };
};
