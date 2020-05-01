declare module "@apollo/react-hooks" {
  import {
    OperationVariables,
    TypedDocumentNode,
  } from "apollo-typed-documents";
  import { QueryResult } from "@apollo/react-common";
  import {
    MutationHookOptions,
    MutationTuple,
    QueryHookOptions,
    SubscriptionHookOptions,
  } from "@apollo/react-hooks/lib/types";

  export * from "@apollo/react-hooks/lib/index";

  export function useQuery<
    TData,
    TVariables extends OperationVariables,
    TOptions extends QueryHookOptions<TData, TVariables>
  >(
    query: TypedDocumentNode<TVariables, TData>,
    options?: TOptions
  ): QueryResult<TData, TVariables>;

  export function useMutation<
    TData,
    TVariables extends OperationVariables,
    TOptions extends MutationHookOptions<TData, TVariables>
  >(
    mutation: TypedDocumentNode<TVariables, TData>,
    options?: TOptions
  ): MutationTuple<TData, TVariables>;

  export function useSubscription<
    TData,
    TVariables extends OperationVariables,
    TOptions extends SubscriptionHookOptions<TData, TVariables>
  >(
    subscription: TypedDocumentNode<TVariables, TData>,
    options?: TOptions
  ): {
    variables: TVariables | undefined;
    loading: boolean;
    data?: TData | undefined;
    error?: import("apollo-client").ApolloError | undefined;
  };
}
