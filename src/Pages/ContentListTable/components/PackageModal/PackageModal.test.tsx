import { render } from '@testing-library/react';
import PackageModal from './PackageModal';
import { ContentItem, PackageItem } from '../../../../services/Content/ContentApi';
import { ReactQueryTestWrapper } from '../../../../testingHelpers';
import { useGetPackagesQuery } from '../../../../services/Content/ContentQueries';

const rowData: ContentItem = {
  // Used variables
  uuid: 'boop-beep-boop-blop',
  name: 'steve',
  package_count: 0,
  // Placeholders for TS
  url: '',
  distribution_versions: [],
  distribution_arch: '',
  account_id: '',
  org_id: '',
  status: '',
  last_introspection_error: '',
  last_introspection_time: '2023-03-07 17:13:48.619192 -0500 EST',
  failed_introspections_count: 0,
  gpg_key: '',
  metadata_verification: false,
};

const packageItem: PackageItem = {
  // Used variables
  name: 'billy-the-bob',
  version: '2.2.2',
  release: '1.2.el9',
  arch: 'x86_64',
  // Placeholders for TS
  checksum: '',
  epoch: 0,
  summary: '',
  uuid: '',
};

jest.mock('../../../../services/Content/ContentQueries', () => ({
  useGetPackagesQuery: jest.fn(),
}));

it('Render 1 item', () => {
  (useGetPackagesQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data: {
      data: [packageItem],
      meta: { count: 1, limit: 20, offset: 0 },
    },
  }));

  const { queryByText } = render(
    <ReactQueryTestWrapper>
      <PackageModal rowData={{ ...rowData, package_count: 1 }} closeModal={() => undefined} />
    </ReactQueryTestWrapper>,
  );

  expect(queryByText('Packages')).toBeInTheDocument();
  expect(queryByText(rowData.name)).toBeInTheDocument();
  expect(queryByText(packageItem.name)).toBeInTheDocument();
  expect(queryByText(packageItem.version)).toBeInTheDocument();
  expect(queryByText(packageItem.release)).toBeInTheDocument();
  expect(queryByText(packageItem.arch)).toBeInTheDocument();
  expect(queryByText('Clear search')).not.toBeInTheDocument();
});

it('Render with no packages (after an unsuccessful search)', () => {
  (useGetPackagesQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data: {
      data: [],
      meta: { count: 0, limit: 20, offset: 0 },
    },
  }));

  const { queryByText } = render(
    <ReactQueryTestWrapper>
      <PackageModal rowData={rowData} closeModal={() => undefined} />
    </ReactQueryTestWrapper>,
  );

  expect(queryByText('Packages')).toBeInTheDocument();
  expect(queryByText(rowData.name)).toBeInTheDocument();
  expect(queryByText('No packages match the search criteria')).toBeInTheDocument();
  expect(queryByText('Clear search')).toBeInTheDocument();
});
