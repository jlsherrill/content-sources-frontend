import { AlertVariant } from '@patternfly/react-core';
import { QueryClient, useMutation, useQuery } from 'react-query';

import { useNotification } from './../Notifications/Notifications';
import {
  ContentListResponse,
  deleteContentListItem,
  getContentList,
  RepositoryParamsResponse,
  getRepositoryParams,
  AddContentListItems,
  CreateContentRequest,
  FilterData,
  validateContentListItems,
} from './ContentApi';

export const CONTENT_LIST_KEY = 'CONTENT_LIST_KEY';
export const REPOSITORY_PARAMS_KEY = 'REPOSITORY_PARAMS_KEY';
export const CREATE_PARAMS_KEY = 'CREATE_PARAMS_KEY';

export const useContentListQuery = (page: number, limit: number, filterData: FilterData) =>
  useQuery<ContentListResponse>(
    [CONTENT_LIST_KEY, page, limit, ...Object.values(filterData)],
    () => getContentList(page, limit, filterData),
    {
      keepPreviousData: true,
      staleTime: 20000,
      optimisticResults: true,
    },
  );

export const useAddContentQuery = (queryClient: QueryClient, request: CreateContentRequest) => {
  const { notify } = useNotification();
  return useMutation(() => AddContentListItems(request), {
    onSuccess: () => {
      notify({
        variant: AlertVariant.success,
        title: `Successfully added ${request.length} ${request.length > 1 ? 'items' : 'item'}.`,
      });
      queryClient.invalidateQueries(CONTENT_LIST_KEY);
    },
    onError: (err: { response?: { data: string | Array<{ error: string | null }> } }) => {
      let description = 'An error occurred.';

      switch (typeof err?.response?.data) {
        case 'string':
          description = err?.response?.data;
          break;
        case 'object':
          // Only show the first error
          err?.response?.data.find(({ error }) => {
            if (error) {
              description = error;
              return true;
            }
          })?.error;
          break;
        default:
          break;
      }

      notify({
        variant: AlertVariant.danger,
        title: 'Error adding items to content list',
        description,
      });
    },
  });
};

export const useValidateContentList = () => {
  const { notify } = useNotification();
  return useMutation((request: CreateContentRequest) => validateContentListItems(request), {
    onError: (err) => {
      const error = err as Error; // Forced Type
      notify({
        variant: AlertVariant.danger,
        title: 'Error validating form fields',
        description: error?.message,
      });
    },
  });
};

export const useDeleteContentItemMutate = (
  queryClient: QueryClient,
  page: number,
  perPage: number,
  filterData: FilterData,
) => {
  const contentListKeyArray = [CONTENT_LIST_KEY, page, perPage, ...Object.values(filterData)];
  const { notify } = useNotification();
  return useMutation(deleteContentListItem, {
    onMutate: async (uuid: string) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries(contentListKeyArray);
      // Snapshot the previous value
      const previousData: Partial<ContentListResponse> =
        queryClient.getQueryData(contentListKeyArray) || {};

      // Optimistically update to the new value
      queryClient.setQueryData(contentListKeyArray, () => ({
        ...previousData,
        data: previousData.data?.filter((data) => uuid !== data.uuid),
        meta: previousData.meta
          ? {
              ...previousData.meta,
              count: previousData.meta.count ? previousData.meta.count - 1 : 1,
            }
          : undefined,
      }));
      // Return a context object with the snapshotted value
      return { previousData, queryClient };
    },
    onSuccess: (_data, _variables, context) => {
      // Update all of the existing calls "count" to prevent number jumping on pagination
      const { previousData } = context as {
        previousData: ContentListResponse;
      };
      queryClient.setQueriesData(CONTENT_LIST_KEY, (data: Partial<ContentListResponse> = {}) => {
        if (data?.meta?.count) {
          data.meta.count = previousData?.meta?.count - 1;
        }

        return data;
      });
      queryClient.invalidateQueries(CONTENT_LIST_KEY);
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, _newData, context) => {
      if (context) {
        const { previousData } = context as {
          previousData: ContentListResponse;
        };
        queryClient.setQueryData(contentListKeyArray, previousData);
        const error = err as Error; // Forced Type
        notify({
          variant: AlertVariant.danger,
          title: 'Error deleting item from content list',
          description: error?.message,
        });
      }
    },
  });
};

export const useRepositoryParams = () =>
  useQuery<RepositoryParamsResponse>(REPOSITORY_PARAMS_KEY, getRepositoryParams, {
    keepPreviousData: true,
    staleTime: Infinity,
  });
