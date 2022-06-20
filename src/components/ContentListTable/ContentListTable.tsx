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
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@patternfly/react-table';
import { global_BackgroundColor_100 } from '@patternfly/react-tokens';
import React, { useContext, useState } from 'react';
import { createUseStyles } from 'react-jss';
import { useQueryClient } from 'react-query';
import { ContentItem } from '../../services/Content/ContentApi';

import {
  useContentListQuery,
  useDeleteContentItemMutate,
} from '../../services/Content/ContentQueries';
import ContentListFilters from './ContentListFilters';
import ContentListChips from './ContentListChips';
import { ContentListContext } from './ContentListContext';
import Hide from '../Hide/Hide';
import { AddContent } from '../AddContent/AddContent';

const useStyles = createUseStyles({
  actionContainer: {
    backgroundColor: global_BackgroundColor_100.value,
    justifyContent: 'space-between',
    padding: '16px 24px',
  },
  chipsContainer: {
    backgroundColor: global_BackgroundColor_100.value,
    justifyContent: 'flex-start',
    padding: '16px 24px',
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

  const { filterData, searchQuery, selectedVersions, selectedArches } =
    useContext(ContentListContext);

  const showListChips = selectedVersions.length || selectedArches.length || searchQuery != '';

  const hasActionPermissions = true; // TODO: Incorporate permissions here later.

  const {
    isLoading,
    error,
    isError,
    isFetching,
    data = { data: [], meta: { count: 0, limit: 20, offset: 0 } },
  } = useContentListQuery(page, perPage, filterData);

  const { mutate, isLoading: isDeleting } = useDeleteContentItemMutate(queryClient, page, perPage);

  // Other update actions will be added to this later.
  const actionTakingPlace = isDeleting || isFetching;

  const onSetPage: OnSetPage = (_, newPage) => setPage(newPage);

  const onPerPageSelect: OnPerPageSelect = (_, newPerPage, newPage) => {
    // Save this value through page refresh for use on next reload
    localStorage.setItem('perPage', newPerPage.toString());

    setPerPage(newPerPage);
    setPage(newPage);
  };

  const rowActions = ({ uuid }: { uuid: string }): IAction[] => [
    {
      isDisabled: actionTakingPlace,
      title: 'Delete',
      onClick: () => mutate(uuid),
    },
  ];

  const columnHeaders = ['Name', 'Url', 'Arch', 'Versions', 'Account ID', 'Org ID'];

  const versionDisplay = (versions: Array<string>): string => {
    if (versions.length === 0) {
      return 'Any';
    } else {
      return versions.join(', ');
    }
  };

  if (isLoading) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (isError) throw error; // Error is caught in the wrapper component
  const {
    data: contentList,
    meta: { count },
  } = data;
  return (
    <Grid>
      <Flex className={classes.actionContainer}>
        <FlexItem>
          <Flex>
            <FlexItem>
              <ContentListFilters />
            </FlexItem>
            <FlexItem>
              <AddContent />
            </FlexItem>
          </Flex>
        </FlexItem>
        <FlexItem>
          <Pagination
            perPageComponent='button'
            itemCount={count}
            perPage={perPage}
            page={page}
            onSetPage={onSetPage}
            widgetId='pagination-options-menu-top'
            isCompact
            onPerPageSelect={onPerPageSelect}
          />
        </FlexItem>
      </Flex>
      <Hide hide={!showListChips}>
        <Flex className={classes.chipsContainer}>
          <ContentListChips />
        </Flex>
      </Hide>
      <TableComposable aria-label='content sources table' variant='compact' borders={false}>
        <Thead>
          <Tr>
            {columnHeaders.map((columnHeader) => (
              <Th key={columnHeader}>{columnHeader}</Th>
            ))}
            <Th>
              <Spinner size='md' className={actionTakingPlace ? '' : classes.invisible} />
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {contentList.map(
            ({
              uuid,
              name,
              url,
              distribution_arch,
              distribution_versions,
              account_id,
              org_id,
            }: ContentItem) => (
              <Tr key={uuid}>
                <Td>{name}</Td>
                <Td>{url}</Td>
                <Td>{distribution_arch ? distribution_arch : 'Any'}</Td>
                <Td>{versionDisplay(distribution_versions)}</Td>
                <Td>{account_id}</Td>
                <Td>{org_id}</Td>
                <Td isActionCell>
                  {hasActionPermissions ? <ActionsColumn items={rowActions({ uuid })} /> : null}
                </Td>
              </Tr>
            ),
          )}
        </Tbody>
      </TableComposable>
      <Flex className={classes.actionContainer}>
        <FlexItem />
        <FlexItem>
          <Pagination
            perPageComponent='button'
            itemCount={count}
            perPage={perPage}
            page={page}
            onSetPage={onSetPage}
            widgetId='pagination-options-menu-bottom'
            variant={PaginationVariant.bottom}
            onPerPageSelect={onPerPageSelect}
          />
        </FlexItem>
      </Flex>
    </Grid>
  );
};

export default ContentListTable;
