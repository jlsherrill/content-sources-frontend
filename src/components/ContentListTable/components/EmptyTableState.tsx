import {
  EmptyStateBody,
  EmptyState,
  EmptyStateVariant,
  Title,
  EmptyStateIcon,
  Button,
} from '@patternfly/react-core';
import { SearchIcon, PlusCircleIcon } from '@patternfly/react-icons/dist/js/icons';
import { createUseStyles } from 'react-jss';
import { AddContent } from '../../AddContent/AddContent';

const useStyles = createUseStyles({
  emptyStateContainer: {
    display: 'flex',
    flexGrow: 1,
  },
});

interface Props {
  notFiltered: boolean;
  clearFilters: () => void;
}

const EmptyTableState = ({ notFiltered, clearFilters }: Props) => {
  const classes = useStyles();
  return (
    <EmptyState variant={EmptyStateVariant.full} className={classes.emptyStateContainer}>
      <EmptyStateIcon icon={notFiltered ? PlusCircleIcon : SearchIcon} />
      <Title headingLevel='h2' size='lg'>
        {notFiltered ? 'No content sources' : 'No content sources match the filter criteria.'}
      </Title>
      <EmptyStateBody>
        {notFiltered
          ? 'To get started, create a content source.'
          : 'Clear all filters to show more results.'}
      </EmptyStateBody>
      {notFiltered ? (
        <AddContent />
      ) : (
        <Button variant='link' onClick={clearFilters}>
          Clear all filters
        </Button>
      )}
    </EmptyState>
  );
};

export default EmptyTableState;
