import { Text } from '@patternfly/react-core';
import { global_Color_100 } from '@patternfly/react-tokens';
import {
  Main,
  PageHeader as _PageHeader,
  PageHeaderTitle,
} from '@redhat-cloud-services/frontend-components';
import { PageHeaderProps as _PageHeaderProps } from '@redhat-cloud-services/frontend-components/PageHeader/PageHeader';
import { FunctionComponent, ReactElement, useEffect } from 'react';
import { createUseStyles } from 'react-jss';
import { withRouter } from 'react-router-dom';

import ContentListTable from '../../components/ContentListTable/ContentListTable';

const useStyles = createUseStyles({
  subtext: {
    color: global_Color_100.value,
  },
});

// Example of how to extend inaccurately typed imports
interface PageHeaderProps extends _PageHeaderProps {
  children?: ReactElement;
}

const PageHeader = _PageHeader as FunctionComponent<PageHeaderProps>;

const SamplePage = () => {
  const classes = useStyles();
  useEffect(() => {
    insights?.chrome?.appAction?.('view-list-page');
  }, []);

  return (
    <>
      <PageHeader>
        <>
          <PageHeaderTitle title='Content Sources' />
          <Text className={classes.subtext}>
            View all custom content sources within your organization
          </Text>
        </>
      </PageHeader>
      <Main>
        <ContentListTable />
      </Main>
    </>
  );
};

export default withRouter(SamplePage);
