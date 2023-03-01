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
  ThProps,
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
import ContentListFilters from './components/ContentListFilters';
import Hide from '../../components/Hide/Hide';
import EmptyTableState from './components/EmptyTableState';
import { useQueryClient } from 'react-query';
import EditContentModal from './components/EditContentModal/EditContentModal';
import StatusIcon from './components/StatusIcon';
import UrlWithExternalIcon from '../../components/UrlWithLinkIcon/UrlWithLinkIcon';
import PackageCount from './components/PackageCount';
import { useAppContext } from '../../middleware/AppContext';
import ConditionalTooltip from '../../components/ConditionalTooltip/ConditionalTooltip';

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
  const { rbac } = useAppContext();
  const storedPerPage = Number(localStorage.getItem('perPage')) || 20;
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(storedPerPage);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editValues, setEditValues] = useState<ContentItem[]>([]);
  const [activeSortIndex, setActiveSortIndex] = useState<number>(0);
  const [activeSortDirection, setActiveSortDirection] = useState<'asc' | 'desc'>('asc');

  const [filterData, setFilterData] = useState<FilterData>({
    searchQuery: '',
    versions: [],
    arches: [],
    statuses: [],
  });

  const clearFilters = () =>
    setFilterData({ searchQuery: '', versions: [], arches: [], statuses: [] });

  const notFiltered =
    !filterData.arches?.length &&
    filterData.searchQuery === '' &&
    !filterData.versions?.length &&
    !filterData.statuses?.length;

  const {
    isLoading: repositoryParamsLoading,
    error: repositoryParamsError,
    isError: repositoryParamsIsError,
    data: { distribution_versions: distVersions, distribution_arches: distArches } = {
      distribution_versions: [],
      distribution_arches: [],
    },
  } = useRepositoryParams();

  const columnSortAttributes = [
    'name',
    'distribution_arch',
    'distribution_versions',
    'package_count',
    'status',
  ];

  const sortString = (): string =>
    columnSortAttributes[activeSortIndex] + ':' + activeSortDirection;

  const {
    isLoading,
    error,
    isError,
    isFetching,
    data = { data: [], meta: { count: 0, limit: 20, offset: 0 } },
  } = useContentListQuery(page, perPage, filterData, sortString());

  const { mutateAsync: deleteItem, isLoading: isDeleting } = useDeleteContentItemMutate(
    queryClient,
    page,
    perPage,
    filterData,
    sortString(),
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

  const sortParams = (columnIndex: number): ThProps['sort'] => ({
    sortBy: {
      index: activeSortIndex,
      direction: activeSortDirection,
      defaultDirection: 'asc', // starting sort direction when first sorting a column. Defaults to 'asc'
    },
    onSort: (_event, index, direction) => {
      setActiveSortIndex(index);
      setActiveSortDirection(direction);
    },
    columnIndex,
  });

  const columnHeaders = ['Name', 'Architecture', 'Versions', 'Packages', 'Status'];

  const archesDisplay = (arch: string) => distArches.find(({ label }) => arch === label)?.name;

  const versionDisplay = (versions: Array<string>): string =>
    distVersions
      .filter(({ label }) => versions?.includes(label))
      .map(({ name }) => name)
      .join(', ');

  // Error is caught in the wrapper component
  if (isError) throw error;
  if (repositoryParamsIsError) throw repositoryParamsError;

  const {
    data: contentList = [],
    meta: { count = 0 },
  } = data;

  const rowActions = useCallback(
    (rowData: ContentItem): IAction[] => [
      {
        title: 'Delete',
        onClick: () =>
          deleteItem(rowData?.uuid).then(() => {
            // If this is the last item on a page, go to previous page.
            if (page > 1 && count / perPage + 1 >= page && (count - 1) % perPage === 0) {
              setPage(page - 1);
            }
          }),
      },
      {
        isDisabled: actionTakingPlace,
        title: 'Edit',
        onClick: () => {
          setEditValues([rowData]);
          setEditModalOpen(true);
        },
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
      <EditContentModal
        values={editValues}
        open={editModalOpen}
        setClosed={() => {
          setEditModalOpen(false);
          setEditValues([]);
        }}
      />
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
        <Grid className={classes.mainContainer}>
          <SkeletonTable
            rowSize={perPage}
            colSize={columnHeaders.length}
            variant={TableVariant.compact}
          />
        </Grid>
      </Hide>
      <Hide hide={countIsZero || isLoading}>
        <>
          <TableComposable
            aria-label='Custom repositories table'
            ouiaId='custom_repositories_table'
            variant='compact'
          >
            <Thead>
              <Tr>
                {columnHeaders.map((columnHeader, index) => (
                  <Th key={columnHeader + 'column'} sort={sortParams(index)}>
                    {columnHeader}
                  </Th>
                ))}
                <Th>
                  <Spinner size='md' className={actionTakingPlace ? '' : classes.invisible} />
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {contentList.map((rowData: ContentItem) => {
                const {
                  uuid,
                  name,
                  url,
                  distribution_arch,
                  distribution_versions,
                  status,
                  last_introspection_error,
                } = rowData;
                return (
                  <Tr key={uuid}>
                    <Td>
                      {name}
                      <br />
                      <UrlWithExternalIcon href={url} />
                    </Td>
                    <Td>{archesDisplay(distribution_arch)}</Td>
                    <Td>{versionDisplay(distribution_versions)}</Td>
                    <Td>
                      <PackageCount rowData={rowData} />
                    </Td>
                    <Td>
                      <StatusIcon status={status} error={last_introspection_error} />
                    </Td>
                    <Td isActionCell>
                      <ConditionalTooltip
                        content='You do not have the required permissions to perform this action.'
                        show={!rbac?.write}
                        setDisabled
                      >
                        <ActionsColumn items={rowActions(rowData)} />
                      </ConditionalTooltip>
                    </Td>
                  </Tr>
                );
              })}
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
