import { render } from '@testing-library/react';
import { ReactQueryTestWrapper, testRepositoryParamsResponse } from '../../testingHelpers';
import PopularRepositoriesTable from './PopularRepositoriesTable';
import {
  usePopularRepositoriesQuery,
  useRepositoryParams,
} from '../../services/Content/ContentQueries';

const EPEL_9 = {
  uuid: '',
  existing_name: '',
  suggested_name: 'EPEL 9 Everything x86_64',
  url: 'https://download-i2.fedoraproject.org/pub/epel/9/Everything/x86_64/',
  distribution_versions: ['9'],
  distribution_arch: 'x86_64',
  gpg_key:
    '-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nmQINBGE3mOsBEACsU+XwJWDJVkItBaugXhXIIkb9oe+7aadELuVo0kBmc3HXt/Yp\nCJW9hHEiGZ6z2jwgPqyJjZhCvcAWvgzKcvqE+9i0NItV1rzfxrBe2BtUtZmVcuE6\n2b+SPfxQ2Hr8llaawRjt8BCFX/ZzM4/1Qk+EzlfTcEcpkMf6wdO7kD6ulBk/tbsW\nDHX2lNcxszTf+XP9HXHWJlA2xBfP+Dk4gl4DnO2Y1xR0OSywE/QtvEbN5cY94ieu\nn7CBy29AleMhmbnx9pw3NyxcFIAsEZHJoU4ZW9ulAJ/ogttSyAWeacW7eJGW31/Z\n39cS+I4KXJgeGRI20RmpqfH0tuT+X5Da59YpjYxkbhSK3HYBVnNPhoJFUc2j5iKy\nXLgkapu1xRnEJhw05kr4LCbud0NTvfecqSqa+59kuVc+zWmfTnGTYc0PXZ6Oa3rK\n44UOmE6eAT5zd/ToleDO0VesN+EO7CXfRsm7HWGpABF5wNK3vIEF2uRr2VJMvgqS\n9eNwhJyOzoca4xFSwCkc6dACGGkV+CqhufdFBhmcAsUotSxe3zmrBjqA0B/nxIvH\nDVgOAMnVCe+Lmv8T0mFgqZSJdIUdKjnOLu/GRFhjDKIak4jeMBMTYpVnU+HhMHLq\nuDiZkNEvEEGhBQmZuI8J55F/a6UURnxUwT3piyi3Pmr2IFD7ahBxPzOBCQARAQAB\ntCdGZWRvcmEgKGVwZWw5KSA8ZXBlbEBmZWRvcmFwcm9qZWN0Lm9yZz6JAk4EEwEI\nADgWIQT/itE0RZcQbs6BO5GKOHK/MihGfAUCYTeY6wIbDwULCQgHAgYVCgkICwIE\nFgIDAQIeAQIXgAAKCRCKOHK/MihGfFX/EACBPWv20+ttYu1A5WvtHJPzwbj0U4yF\n3zTQpBglQ2UfkRpYdipTlT3Ih6j5h2VmgRPtINCc/ZE28adrWpBoeFIS2YAKOCLC\nnZYtHl2nCoLq1U7FSttUGsZ/t8uGCBgnugTfnIYcmlP1jKKA6RJAclK89evDQX5n\nR9ZD+Cq3CBMlttvSTCht0qQVlwycedH8iWyYgP/mF0W35BIn7NuuZwWhgR00n/VG\n4nbKPOzTWbsP45awcmivdrS74P6mL84WfkghipdmcoyVb1B8ZP4Y/Ke0RXOnLhNe\nCfrXXvuW+Pvg2RTfwRDtehGQPAgXbmLmz2ZkV69RGIr54HJv84NDbqZovRTMr7gL\n9k3ciCzXCiYQgM8yAyGHV0KEhFSQ1HV7gMnt9UmxbxBE2pGU7vu3CwjYga5DpwU7\nw5wu1TmM5KgZtZvuWOTDnqDLf0cKoIbW8FeeCOn24elcj32bnQDuF9DPey1mqcvT\n/yEo/Ushyz6CVYxN8DGgcy2M9JOsnmjDx02h6qgWGWDuKgb9jZrvRedpAQCeemEd\nfhEs6ihqVxRFl16HxC4EVijybhAL76SsM2nbtIqW1apBQJQpXWtQwwdvgTVpdEtE\nr4ArVJYX5LrswnWEQMOelugUG6S3ZjMfcyOa/O0364iY73vyVgaYK+2XtT2usMux\nVL469Kj5m13T6w==\n=Mjs/\n-----END PGP PUBLIC KEY BLOCK-----',
  metadata_verification: false,
};

jest.mock('../../services/Content/ContentQueries', () => ({
  useRepositoryParams: jest.fn(),
  usePopularRepositoriesQuery: jest.fn(),
  useAddPopularRepositoryQuery: () => ({ isLoading: false }),
  useDeletePopularRepositoryMutate: () => ({ isLoading: false }),
  useFetchGpgKey: () => ({ fetchGpgKey: () => '' }),
}));

jest.mock('../../middleware/AppContext', () => ({
  useAppContext: () => ({}),
}));

it('expect PopularRepositoriesTable to render with one item', () => {
  (useRepositoryParams as jest.Mock).mockImplementation(() => ({ isLoading: false }));
  (usePopularRepositoriesQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data: { data: [EPEL_9], meta: { count: 1, limit: 20, offset: 0 } },
  }));

  const { queryByText } = render(
    <ReactQueryTestWrapper>
      <PopularRepositoriesTable />
    </ReactQueryTestWrapper>,
  );

  expect(queryByText(EPEL_9.suggested_name)).toBeInTheDocument();
  expect(queryByText(EPEL_9.url)).toBeInTheDocument();
  expect(queryByText('Add')).toBeInTheDocument();
});

it('expect PopularRepositoriesTable to render with one item', () => {
  (useRepositoryParams as jest.Mock).mockImplementation(() => ({ isLoading: false }));
  (usePopularRepositoriesQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data: {
      data: [{ ...EPEL_9, uuid: 'ifThisExistsThanButtonIsRemove' }],
      meta: { count: 1, limit: 20, offset: 0 },
    },
  }));

  const { queryByText } = render(
    <ReactQueryTestWrapper>
      <PopularRepositoriesTable />
    </ReactQueryTestWrapper>,
  );

  expect(queryByText(EPEL_9.suggested_name)).toBeInTheDocument();
  expect(queryByText(EPEL_9.url)).toBeInTheDocument();
  expect(queryByText('Remove')).toBeInTheDocument();
});

it('Render a loading state checking search disabled', () => {
  (useRepositoryParams as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data: testRepositoryParamsResponse,
  }));
  (usePopularRepositoriesQuery as jest.Mock).mockImplementation(() => ({
    isLoading: true,
  }));

  const { queryByPlaceholderText } = render(
    <ReactQueryTestWrapper>
      <PopularRepositoriesTable />
    </ReactQueryTestWrapper>,
  );

  expect(queryByPlaceholderText('Filter by name/url')).toHaveAttribute('disabled');
});
