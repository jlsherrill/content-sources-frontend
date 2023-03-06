import {
  Button,
  Flex,
  FlexItem,
  Grid,
  InputGroup,
  OnPerPageSelect,
  OnSetPage,
  Pagination,
  PaginationVariant,
  Spinner,
  TextInput,
} from '@patternfly/react-core';
import { TableComposable, TableVariant, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import {
  global_BackgroundColor_100,
  global_secondary_color_100,
  global_disabled_color_100,
} from '@patternfly/react-tokens';
import { useEffect, useState, useMemo } from 'react';
import { createUseStyles } from 'react-jss';
import { SkeletonTable } from '@redhat-cloud-services/frontend-components';

import {
  usePopularRepositoriesQuery,
  useDeletePopularRepositoryMutate,
  useRepositoryParams,
  useAddPopularRepositoryQuery,
} from '../../services/Content/ContentQueries';
import { CreateContentRequest, FilterData } from '../../services/Content/ContentApi';
import Hide from '../../components/Hide/Hide';
import { useQueryClient } from 'react-query';
import { useAppContext } from '../../middleware/AppContext';
import ConditionalTooltip from '../../components/ConditionalTooltip/ConditionalTooltip';
import UrlWithExternalIcon from '../../components/UrlWithLinkIcon/UrlWithLinkIcon';
import { SearchIcon } from '@patternfly/react-icons';
import useDebounce from '../../services/useDebounce';
import EmptyTableState from './components/EmptyTableState';

const useStyles = createUseStyles({
  mainContainer: {
    backgroundColor: global_BackgroundColor_100.value,
    display: 'flex',
    flexDirection: 'column',
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
  searchInput: {
    paddingRight: '35px',
    marginRight: '-23px',
  },
  searchIcon: {
    color: global_secondary_color_100.value,
    position: 'relative',
    left: '-5px',
    pointerEvents: 'none',
  },
  addRepositoriesButton: {
    marginLeft: '16px',
  },
  checkboxMinWidth: {
    minWidth: '45px!important',
  },
  disabled: {
    color: global_disabled_color_100.value,
  },
});

const PopularRepositoriesTable = () => {
  const classes = useStyles();
  const queryClient = useQueryClient();
  const { rbac } = useAppContext();
  const [checkedRepositories, setCheckedRepositories] = useState<boolean[]>([]);
  const [selectedData, setSelectedData] = useState<CreateContentRequest>([]);
  const [selectedUUID, setSelectedUUID] = useState<string>('');

  const storedPerPage = Number(localStorage.getItem('perPage')) || 20;
  const [page, setPage] = useState(1);
  const [searchValue, setSearchValue] = useState('');
  const debouncedSearchValue = useDebounce(searchValue);
  const [perPage, setPerPage] = useState(storedPerPage);

  const {
    isLoading,
    error,
    isError,
    isFetching,
    data = { data: [], meta: { count: 0, limit: 20, offset: 0 } },
  } = usePopularRepositoriesQuery(page, perPage, { searchQuery: debouncedSearchValue });

  const areAllReposAdded = useMemo(() => data.data.every(({ uuid }) => !!uuid), [data]);

  const atLeastOneRepoChecked = useMemo(
    () => checkedRepositories.some((val) => val),
    [checkedRepositories],
  );

  const areAllReposSelected = useMemo(
    () =>
      !areAllReposAdded && data.data.every(({ uuid }, key) => !!uuid || checkedRepositories[key]),
    [data, checkedRepositories, areAllReposAdded],
  );

  const {
    isLoading: repositoryParamsLoading,
    error: repositoryParamsError,
    isError: repositoryParamsIsError,
    data: { distribution_versions: distVersions, distribution_arches: distArches } = {
      distribution_versions: [],
      distribution_arches: [],
    },
  } = useRepositoryParams();

  const { mutateAsync: addContentQuery, isLoading: isAdding } = useAddPopularRepositoryQuery(
    queryClient,
    selectedData,
    page,
    perPage,
    { searchQuery: debouncedSearchValue } as FilterData,
  );

  useEffect(() => {
    if (!isFetching) {
      setSelectedData([]);
      setSelectedUUID('');
      setCheckedRepositories(data.data.map(() => false));
    }
  }, [isFetching]);

  useEffect(() => {
    if (data?.data?.length > 0 && checkedRepositories.length === 0) {
      setCheckedRepositories(data.data.map(() => false));
    }
  }, [data?.data?.length]);

  useEffect(() => {
    if (selectedData.length != 0) {
      addContentQuery().then(
        () => setSelectedData([]),
        () => setSelectedData([]),
      );
    }
  }, [selectedData]);

  useEffect(() => {
    if (selectedUUID) {
      deleteItem(selectedUUID).then(undefined, () => setSelectedUUID(''));
    }
  }, [selectedUUID]);

  const onSelectRepo = (index: number, value: boolean) => {
    const newValue = checkedRepositories;
    newValue[index] = value;
    setCheckedRepositories([...newValue]);
  };

  const selectAllRepos = (_, checked: boolean) =>
    setCheckedRepositories(data.data.map(() => checked));

  const archesDisplay = (arch: string) => distArches.find(({ label }) => arch === label)?.name;

  const versionDisplay = (versions: Array<string>): string =>
    distVersions
      .filter(({ label }) => versions?.includes(label))
      .map(({ name }) => name)
      .join(', ');

  const { mutateAsync: deleteItem, isLoading: isDeleting } = useDeletePopularRepositoryMutate(
    queryClient,
    page,
    perPage,
    { searchQuery: debouncedSearchValue } as FilterData,
  );

  // Other update actions will be added to this later.
  const actionTakingPlace = isDeleting || isFetching || repositoryParamsLoading || isAdding;

  const onSetPage: OnSetPage = (_, newPage) => setPage(newPage);

  const onPerPageSelect: OnPerPageSelect = (_, newPerPage, newPage) => {
    // Save this value through page refresh for use on next reload
    localStorage.setItem('perPage', newPerPage.toString());
    setPerPage(newPerPage);
    setPage(newPage);
  };

  const addSelected = () => {
    const request: CreateContentRequest = [];
    checkedRepositories.forEach((checked, index) => {
      if (checked && data?.data[index] && !data.data[index].uuid) {
        const {
          suggested_name,
          url,
          distribution_versions,
          distribution_arch,
          gpg_key,
          metadata_verification,
        } = data.data[index];

        request.push({
          name: suggested_name,
          url,
          distribution_versions,
          distribution_arch,
          gpg_key,
          metadata_verification,
        });
      }
    });
    setSelectedData(request);
  };

  const columnHeaders = ['Name', 'Architecture', 'Versions'];

  // Error is caught in the wrapper component
  if (isError) throw error;
  if (repositoryParamsIsError) throw repositoryParamsError;

  const {
    data: popularData = [],
    meta: { count = 0 },
  } = data;

  return (
    <Grid className={classes.mainContainer}>
      <Flex className={classes.topContainer}>
        <FlexItem>
          <InputGroup>
            <FlexItem>
              <TextInput
                isDisabled={isLoading}
                id='search'
                ouiaId='popular_filter_search'
                placeholder='Filter by name/url'
                value={searchValue}
                onChange={setSearchValue}
                className={classes.searchInput}
              />
              <SearchIcon size='sm' className={classes.searchIcon} />
            </FlexItem>
            <FlexItem>
              <ConditionalTooltip
                content='You do not have the required permissions to perform this action.'
                show={!rbac?.write}
                setDisabled
              >
                <Button
                  onClick={addSelected}
                  className={classes.addRepositoriesButton}
                  isDisabled={!atLeastOneRepoChecked}
                  ouiaId='add_checked_repos'
                >
                  Add repositories
                </Button>
              </ConditionalTooltip>
            </FlexItem>
          </InputGroup>
        </FlexItem>
        <FlexItem>
          <Hide hide={isLoading}>
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
      <Hide hide={isLoading}>
        <>
          <TableComposable
            aria-label='Popular repositories table'
            ouiaId='popular_repos_table'
            variant='compact'
          >
            <Thead>
              <Tr>
                <Hide hide={!rbac?.write}>
                  <Th
                    className={classes.checkboxMinWidth}
                    select={{
                      onSelect: selectAllRepos,
                      isSelected: areAllReposSelected,
                      isHeaderSelectDisabled: areAllReposAdded,
                    }}
                  />
                </Hide>
                {columnHeaders.map((columnHeader) => (
                  <Th key={columnHeader + 'column'}>{columnHeader}</Th>
                ))}
                <Th>
                  <Spinner size='md' className={actionTakingPlace ? '' : classes.invisible} />
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {popularData.map(
                (
                  {
                    uuid,
                    existing_name,
                    suggested_name,
                    url,
                    distribution_arch,
                    distribution_versions,
                    gpg_key,
                    metadata_verification,
                  },
                  key,
                ) => (
                  <Tr key={suggested_name + key}>
                    <Hide hide={!rbac?.write}>
                      <Td
                        select={{
                          rowIndex: key,
                          onSelect: (_event, isSelecting) => onSelectRepo(key, isSelecting),
                          isSelected: uuid ? false : checkedRepositories[key],
                          disable: !!uuid,
                        }}
                      />
                    </Hide>
                    <Td>
                      <>
                        <Flex direction={{ default: 'row' }}>
                          <FlexItem> {suggested_name}</FlexItem>
                          {existing_name && suggested_name !== existing_name && (
                            <FlexItem className={classes.disabled}>
                              Current name: {existing_name}
                            </FlexItem>
                          )}
                        </Flex>
                        <UrlWithExternalIcon href={url} />
                      </>
                    </Td>
                    <Td>{archesDisplay(distribution_arch)}</Td>
                    <Td>{versionDisplay(distribution_versions)}</Td>
                    <Td width={10}>
                      <ConditionalTooltip
                        content='You do not have the required permissions to perform this action.'
                        show={!rbac?.write}
                        setDisabled
                      >
                        {uuid ? (
                          <Button
                            isDisabled={uuid === selectedUUID || isAdding}
                            onClick={() => setSelectedUUID(uuid)}
                            variant='danger'
                            ouiaId='remove_popular_repo'
                          >
                            Remove
                          </Button>
                        ) : (
                          <Button
                            variant='secondary'
                            isDisabled={selectedData[key]?.url === url || isFetching || isDeleting}
                            onClick={() => {
                              const newData: CreateContentRequest = [];
                              newData[key] = {
                                name: suggested_name,
                                url,
                                distribution_versions,
                                distribution_arch,
                                gpg_key,
                                metadata_verification,
                              };
                              setSelectedData(newData);
                            }}
                            ouiaId='add_popular_repo'
                          >
                            Add
                          </Button>
                        )}
                      </ConditionalTooltip>
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
      <Hide hide={data.data.length !== 0 || isLoading}>
        <EmptyTableState clearFilters={() => setSearchValue('')} />
      </Hide>
    </Grid>
  );
};

export default PopularRepositoriesTable;
