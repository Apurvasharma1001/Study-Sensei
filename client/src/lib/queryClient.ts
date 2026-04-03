import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { apiGet, type UnauthorizedBehavior } from "./api";

type QueryKeyPath = string | readonly unknown[];

function getPathFromQueryKey(queryKey: QueryKeyPath): string {
  if (typeof queryKey === "string") {
    return queryKey;
  }

  const [path] = queryKey;
  if (typeof path !== "string") {
    throw new Error("The first query key item must be a path string");
  }

  return path;
}

export function getQueryFn<T>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> {
  return async ({ queryKey }) => {
    const path = getPathFromQueryKey(queryKey);
    const result = await apiGet<T>(path, {
      on401: options.on401,
    });

    return result as T;
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
