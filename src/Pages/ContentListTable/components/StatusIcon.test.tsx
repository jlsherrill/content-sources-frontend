import { act, render, waitFor } from '@testing-library/react';
import StatusIcon from './StatusIcon';
import { ContentItem } from '../../../services/Content/ContentApi';

const defaultData: ContentItem = {
  uuid: '',
  name: '',
  package_count: 100,
  url: '',
  status: 'Pending',
  account_id: '',
  org_id: 'acme',
  distribution_arch: '',
  gpg_key: '',
  distribution_versions: [''],
  last_introspection_error: '',
  last_introspection_time: '2023-03-07 17:13:48.619192 -0500 EST',
  failed_introspections_count: 0,
  metadata_verification: false,
};

jest.mock('../../../middleware/AppContext', () => ({
  useAppContext: () => ({ rbac: { read: true, write: true } }),
}));

it('Render with Pending status', () => {
  const { queryByText } = render(<StatusIcon rowData={{ ...defaultData, status: 'Pending' }} />);

  const SelectComponent = queryByText('In progress');
  expect(SelectComponent).toBeInTheDocument();
});

it('Render with Valid status', () => {
  const { queryByText } = render(<StatusIcon rowData={{ ...defaultData, status: 'Valid' }} />);
  const SelectComponent = queryByText('Valid');
  expect(SelectComponent).toBeInTheDocument();
});

it('Render with Invalid status', () => {
  const { queryByText } = render(<StatusIcon rowData={{ ...defaultData, status: 'Invalid' }} />);
  const SelectComponent = queryByText('Invalid');
  expect(SelectComponent).toBeInTheDocument();
});

it('Render with Unavailable status', async () => {
  const { queryByText } = render(
    <StatusIcon rowData={{ ...defaultData, status: 'Unavailable' }} />,
  );
  const SelectComponent = queryByText('Unavailable');
  expect(SelectComponent).toBeInTheDocument();

  await act(async () => {
    SelectComponent?.click();
  });

  await waitFor(() => {
    expect(queryByText('Retry')).toBeInTheDocument();
  });
});

it('Render with Invalid status', async () => {
  const { queryByText } = render(<StatusIcon rowData={{ ...defaultData, status: 'Invalid' }} />);
  const SelectComponent = queryByText('Invalid');
  expect(SelectComponent).toBeInTheDocument();

  await act(async () => {
    SelectComponent?.click();
  });

  await waitFor(() => {
    expect(queryByText('Retry')).toBeInTheDocument();
  });
});
