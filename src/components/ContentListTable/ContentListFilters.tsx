import { ReactElement, useEffect, useState } from 'react';
import {
  Button,
  Chip,
  ChipGroup,
  Flex,
  FlexItem,
  InputGroup,
  SelectVariant,
  TextInput,
} from '@patternfly/react-core';
import DropdownSelect from '../DropdownSelect/DropdownSelect';
import { FilterIcon } from '@patternfly/react-icons';
import { global_BackgroundColor_100 } from '@patternfly/react-tokens';
import Hide from '../Hide/Hide';
import { FilterData, RepositoryParamsResponse } from '../../services/Content/ContentApi';
import { useQueryClient } from 'react-query';
import { REPOSITORY_PARAMS_KEY } from '../../services/Content/ContentQueries';
import useDebounce from '../../services/useDebounce';
import { AddContent } from '../AddContent/AddContent';
import { createUseStyles } from 'react-jss';

interface Props {
  isLoading?: boolean;
  setFilterData: (filterData: FilterData) => void;
  filterData: FilterData;
}

const useStyles = createUseStyles({
  chipsContainer: {
    backgroundColor: global_BackgroundColor_100.value,
    paddingTop: '16px',
  },
  clearFilters: {
    marginLeft: '16px',
  },
});

export type Filters = 'Name/URL' | 'Version' | 'Architecture';

const ContentListFilters = ({ isLoading, setFilterData, filterData }: Props) => {
  const classes = useStyles();
  const queryClient = useQueryClient();
  const filters = ['Name/URL', 'Version', 'Architecture'];
  const [filterType, setFilterType] = useState<Filters>('Name/URL');
  const [versionNamesLabels, setVersionNamesLabels] = useState({});
  const [archNamesLabels, setArchNamesLabels] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [selectedArches, setSelectedArches] = useState<string[]>([]);

  const { distribution_arches = [], distribution_versions = [] } =
    queryClient.getQueryData<RepositoryParamsResponse>(REPOSITORY_PARAMS_KEY) || {};

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedVersions([]);
    setSelectedArches([]);
    setFilterData({ searchQuery: '', versions: [], arches: [] });
  };

  useEffect(() => {
    // If the filters get cleared at the top level, sense that and clear them here.
    if (
      filterData.arches.length === 0 &&
      filterData.versions.length === 0 &&
      filterData.searchQuery === '' &&
      (searchQuery !== '' || selectedArches.length !== 0 || selectedVersions.length !== 0)
    ) {
      clearFilters();
    }
  }, [filterData]);

  const {
    searchQuery: debouncedSearchQuery,
    selectedVersions: debouncedSelectedVersions,
    selectedArches: debouncedSelectedArches,
  } = useDebounce({
    searchQuery,
    selectedVersions,
    selectedArches,
  });

  const getLabels = (type: string, names: Array<string>) => {
    const namesLabels = type === 'arch' ? distribution_arches : distribution_versions;
    const labels: Array<string> = [];
    names.forEach((name) => {
      const found = namesLabels.find((v) => v.name === name);
      if (found) {
        labels.push(found.label);
      }
    });
    return labels;
  };

  useEffect(() => {
    setFilterData({
      searchQuery: debouncedSearchQuery,
      versions: getLabels('version', debouncedSelectedVersions),
      arches: getLabels('arch', debouncedSelectedArches),
    });
  }, [debouncedSearchQuery, debouncedSelectedVersions, debouncedSelectedArches]);

  const deleteItem = (id: string, chips, setChips) => {
    const copyOfChips = [...chips];
    const filteredCopy = copyOfChips.filter((chip) => chip !== id);
    setChips(filteredCopy);
  };

  useEffect(() => {
    const arches = {};
    const versions = {};
    distribution_arches.forEach((arch) => (arches[arch.name] = arch.label));
    distribution_versions.forEach((version) => (versions[version.name] = version.label));
    setVersionNamesLabels(versions);
    setArchNamesLabels(arches);
  }, [distribution_arches, distribution_versions]);

  const getSelectionByType = (): ReactElement => {
    switch (filterType) {
      case 'Name/URL':
        return (
          <TextInput
            isDisabled={isLoading}
            id='search'
            placeholder='Filter by name/url'
            iconVariant='search'
            onChange={(value) => setSearchQuery(value)}
          />
        );
      case 'Version':
        return (
          <DropdownSelect
            toggleId='versionSelect'
            isDisabled={isLoading}
            options={Object.keys(versionNamesLabels)}
            variant={SelectVariant.checkbox}
            selectedProp={selectedVersions}
            setSelected={setSelectedVersions}
            placeholderText='Filter by version'
          />
        );
      case 'Architecture':
        return (
          <DropdownSelect
            toggleId='archSelect'
            isDisabled={isLoading}
            options={Object.keys(archNamesLabels)}
            variant={SelectVariant.checkbox}
            selectedProp={selectedArches}
            setSelected={setSelectedArches}
            placeholderText='Filter by architecture'
          />
        );
      default:
        return <></>;
    }
  };

  return (
    <Flex>
      <FlexItem>
        <InputGroup>
          <FlexItem>
            <DropdownSelect
              toggleId='filterSelectionDropdown'
              isDisabled={isLoading}
              options={filters}
              variant={SelectVariant.single}
              selectedProp={filterType}
              setSelected={setFilterType}
              placeholderText='filter'
              toggleIcon={<FilterIcon />}
            />
          </FlexItem>
          <FlexItem>{getSelectionByType()}</FlexItem>
        </InputGroup>
      </FlexItem>
      <FlexItem>
        <AddContent isLoading={isLoading} />
      </FlexItem>
      <Hide hide={!(selectedVersions.length || selectedArches.length || searchQuery != '')}>
        <FlexItem fullWidth={{ default: 'fullWidth' }} className={classes.chipsContainer}>
          <ChipGroup categoryName='Version'>
            {selectedVersions.map((version) => (
              <Chip
                key={version}
                onClick={() => deleteItem(version, selectedVersions, setSelectedVersions)}
              >
                {version}
              </Chip>
            ))}
          </ChipGroup>
          <ChipGroup categoryName='Architecture'>
            {selectedArches.map((arch) => (
              <Chip key={arch} onClick={() => deleteItem(arch, selectedArches, setSelectedArches)}>
                {arch}
              </Chip>
            ))}
          </ChipGroup>
          {searchQuery !== '' && (
            <ChipGroup categoryName='Name/URL'>
              <Chip key='search_chip' onClick={() => setSearchQuery('')}>
                {searchQuery}
              </Chip>
            </ChipGroup>
          )}
          {((debouncedSearchQuery !== '' && searchQuery !== '') ||
            !!selectedVersions?.length ||
            !!selectedArches?.length) && (
            <Button className={classes.clearFilters} onClick={clearFilters} variant='link' isInline>
              Clear filters
            </Button>
          )}
        </FlexItem>
      </Hide>
    </Flex>
  );
};

export default ContentListFilters;
