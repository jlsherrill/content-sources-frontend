import { ErrorBoundary as _ErrorBoundaryPage } from '@redhat-cloud-services/frontend-components';
import { RouteComponentProps, withRouter } from 'react-router-dom';

const ErrorBoundaryPage = _ErrorBoundaryPage as unknown as React.FunctionComponent<{
  children: React.ReactNode;
  headerTitle: string;
  errorTitle?: string;
  errorDescription?: string;
}>;

interface ErrorPageProps extends RouteComponentProps {
  children: React.ReactNode;
}

export const ErrorPageInternal = (props: ErrorPageProps) => (
  <ErrorBoundaryPage
    headerTitle='Content Sources'
    errorTitle='Unhandled error'
    errorDescription='There was a problem trying to process your request.'
  >
    {props.children}
  </ErrorBoundaryPage>
);

export const ErrorPage = withRouter(ErrorPageInternal);
