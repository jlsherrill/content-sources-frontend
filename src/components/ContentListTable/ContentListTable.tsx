import {
  Bullseye,
  Flex,
  FlexItem,
  Grid,
  OnPerPageSelect,
  OnSetPage,
  Pagination,
  PaginationVariant,
  Spinner,
} from '@patternfly/react-core';
import {
  ActionsColumn,
  IAction,
  TableComposable,
  TableVariant,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@patternfly/react-table';
import { global_BackgroundColor_100 } from '@patternfly/react-tokens';
import { useCallback, useState } from 'react';
import { createUseStyles } from 'react-jss';
import { ContentItem, FilterData } from '../../services/Content/ContentApi';
import { SkeletonTable } from '@redhat-cloud-services/frontend-components';

import {
  useContentListQuery,
  useDeleteContentItemMutate,
  useRepositoryParams,
} from '../../services/Content/ContentQueries';
import ContentListFilters from './ContentListFilters';
import Hide from '../Hide/Hide';
import EmptyTableState from './components/EmptyTableState';
import { useQueryClient } from 'react-query';

const useStyles = createUseStyles({
  mainContainer: {
    backgroundColor: global_BackgroundColor_100.value,
    display: 'flex',
    flexDirection: 'column',
  },
  mainContainer100Height: {
    composes: ['$mainContainer'], // This extends another class within this stylesheet
    minHeight: '100%',
  },
  topContainer: {
    justifyContent: 'space-between',
    padding: '16px 24px', // This is needed
    height: 'fit-content',
  },
  bottomContainer: {
    justifyContent: 'space-between',
    height: 'fit-content',
  },
  invisible: {
    opacity: 0,
  },
});

const ContentListTable = () => {
  const classes = useStyles();
  const queryClient = useQueryClient();
  const storedPerPage = Number(localStorage.getItem('perPage')) || 20;
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(storedPerPage);

  const [filterData, setFilterData] = useState<FilterData>({
    searchQuery: '',
    versions: [],
    arches: [],
  });

  const clearFilters = () => setFilterData({ searchQuery: '', versions: [], arches: [] });

  const notFiltered =
    !filterData.arches?.length && filterData.searchQuery === '' && !filterData.versions?.length;

  const hasActionPermissions = true; // TODO: Incorporate permissions here later.

  const {
    isLoading: repositoryParamsLoading,
    error: repositoryParamsError,
    isError: repositoryParamsIsError,
  } = useRepositoryParams();

  const {
    isLoading,
    error,
    isError,
    isFetching,
    data = { data: [], meta: { count: 0, limit: 20, offset: 0 } },
  } = useContentListQuery(page, perPage, filterData);

  const { mutateAsync: deleteItem, isLoading: isDeleting } = useDeleteContentItemMutate(
    queryClient,
    page,
    perPage,
    filterData,
  );

  // Other update actions will be added to this later.
  const actionTakingPlace = isDeleting || isFetching || repositoryParamsLoading;

  const onSetPage: OnSetPage = (_, newPage) => setPage(newPage);

  const onPerPageSelect: OnPerPageSelect = (_, newPerPage, newPage) => {
    // Save this value through page refresh for use on next reload
    localStorage.setItem('perPage', newPerPage.toString());
    setPerPage(newPerPage);
    setPage(newPage);
  };

  const columnHeaders = ['Name', 'Url', 'Arch', 'Versions'];

  const versionDisplay = (versions: Array<string>): string => {
    if (versions.length === 0) {
      return 'Any';
    } else {
      return versions.join(', ');
    }
  };

  // Error is caught in the wrapper component
  if (isError) throw error;
  if (repositoryParamsIsError) throw repositoryParamsError;

  const {
    data: contentList = [],
    meta: { count = 0 },
  } = data;

  const rowActions = useCallback(
    (uuid: string): IAction[] => [
      {
        isDisabled: actionTakingPlace,
        title: 'Delete',
        onClick: () =>
          deleteItem(uuid).then(() => {
            // If this is the last item on a page, go to previous page.
            if (page > 1 && count / perPage + 1 >= page && (count - 1) % perPage === 0) {
              setPage(page - 1);
            }
          }),
      },
    ],
    [actionTakingPlace],
  );

  const countIsZero = count === 0;

  if (countIsZero && notFiltered && !isLoading)
    return (
      <Bullseye>
        <EmptyTableState notFiltered={notFiltered} clearFilters={clearFilters} />
      </Bullseye>
    );

  return (
    <Grid className={countIsZero ? classes.mainContainer100Height : classes.mainContainer}>
      <Flex className={classes.topContainer}>
        <ContentListFilters
          isLoading={isLoading}
          setFilterData={(values) => {
            setFilterData(values);
            setPage(1);
          }}
          filterData={filterData}
        />
        <FlexItem>
          <Hide hide={countIsZero}>
            <Pagination
              id='top-pagination-id'
              widgetId='topPaginationWidgetId'
              perPageComponent='button'
              isDisabled={isLoading}
              itemCount={count}
              perPage={perPage}
              page={page}
              onSetPage={onSetPage}
              isCompact
              onPerPageSelect={onPerPageSelect}
            />
          </Hide>
        </FlexItem>
      </Flex>
      <Hide hide={!isLoading}>
        <Grid className={classes.mainContainer100Height}>
          <SkeletonTable
            rowSize={perPage}
            colSize={columnHeaders.length}
            variant={TableVariant.compact}
          />
        </Grid>
      </Hide>
      <Hide hide={countIsZero || isLoading}>
        <>
          <TableComposable aria-label='content sources table' variant='compact' borders={false}>
            <Thead>
              <Tr>
                {columnHeaders.map((columnHeader) => (
                  <Th key={columnHeader + 'column'}>{columnHeader}</Th>
                ))}
                <Th>
                  <Spinner size='md' className={actionTakingPlace ? '' : classes.invisible} />
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {contentList.map(
                ({ uuid, name, url, distribution_arch, distribution_versions }: ContentItem) => (
                  <Tr key={uuid}>
                    <Td>{name}</Td>
                    <Td>{url}</Td>
                    <Td>{distribution_arch ? distribution_arch : 'Any'}</Td>
                    <Td>{versionDisplay(distribution_versions)}</Td>
                    <Td isActionCell>
                      {hasActionPermissions ? <ActionsColumn items={rowActions(uuid)} /> : ''}
                    </Td>
                  </Tr>
                ),
              )}
            </Tbody>
          </TableComposable>
          <Flex className={classes.bottomContainer}>
            <FlexItem />
            <FlexItem>
              <Pagination
                id='bottom-pagination-id'
                widgetId='bottomPaginationWidgetId'
                perPageComponent='button'
                itemCount={count}
                perPage={perPage}
                page={page}
                onSetPage={onSetPage}
                variant={PaginationVariant.bottom}
                onPerPageSelect={onPerPageSelect}
              />
            </FlexItem>
          </Flex>
        </>
      </Hide>
      <Hide hide={!countIsZero || isLoading}>
        <EmptyTableState notFiltered={notFiltered} clearFilters={clearFilters} />
      </Hide>
    </Grid>
  );
};

export default ContentListTable;
