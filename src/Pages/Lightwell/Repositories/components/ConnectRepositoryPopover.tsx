import {
  Button,
  ClipboardCopy,
  ClipboardCopyVariant,
  Content,
  Flex,
  FlexItem,
  Popover,
  Tab,
  TabContent,
  Tabs,
  TabTitleText,
} from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import { createRef, ReactElement, useMemo, useState } from 'react';

import { ContentItem } from 'services/Content/ContentApi';

import { ConnectSnippetTab, getConnectSnippetTabs } from './connectSnippets';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';

type ConnectRepositoryPopoverProps = {
  repository: Pick<ContentItem, 'name' | 'published_distribution_url' | 'content_type' | 'uuid'>;
  children: ReactElement;
};

const ConnectRepositoryPopover = ({ repository, children }: ConnectRepositoryPopoverProps) => {
  const tabs = useMemo(() => getConnectSnippetTabs(repository), [repository]);
  const [activeTabKey, setActiveTabKey] = useState(tabs[0]?.eventKey ?? '');
  const firstTabKey = tabs[0]?.eventKey ?? '';

  const tabRefs = useMemo(
    () =>
      tabs.reduce(
        (refs, tab) => {
          refs[tab.eventKey] = createRef<HTMLElement>();
          return refs;
        },
        {} as Record<string, React.RefObject<HTMLElement>>,
      ),
    [tabs],
  );

  const renderTabPanel = (tab: ConnectSnippetTab) => (
    <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
      {tab.snippets.map((snippet) => (
        <FlexItem key={snippet.label}>
          <Content component='p' style={{ textAlign: 'left' }}>
            {snippet.label}
          </Content>
          <ClipboardCopy
            isReadOnly
            isCode
            hoverTip='Copy'
            clickTip='Copied'
            variant={snippet.urlOnly ? ClipboardCopyVariant.inline : ClipboardCopyVariant.expansion}
            isExpanded={!snippet.urlOnly}
          >
            {snippet.code}
          </ClipboardCopy>
          {snippet.description && (
            <Content component='small' className={spacing.mtSm} style={{ textAlign: 'left' }}>
              {snippet.description}
            </Content>
          )}
        </FlexItem>
      ))}
      {tab.docsUrl && (
        <FlexItem>
          <Button
            variant='link'
            isInline
            component='a'
            href={tab.docsUrl}
            target='_blank'
            icon={<ExternalLinkAltIcon />}
            iconPosition='end'
          >
            Full documentation for {tab.title}
          </Button>
        </FlexItem>
      )}
    </Flex>
  );

  const bodyContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <Content component='h4' className={spacing.mbSm}>
          Authenticate build tools
        </Content>
        <Content component='p'>
          {'First, '}
          <Button
            variant='link'
            isInline
            component='a'
            href='https://access.redhat.com/terms-based-registry/'
            target='_blank'
            icon={<ExternalLinkAltIcon />}
            iconPosition='end'
            style={{ fontWeight: 'bold' }}
          >
            create a service account
          </Button>
          {
            ' for Lightwell. Use the username and token in the snippets below. For further help, see '
          }
          <Button
            variant='link'
            isInline
            component='a'
            href='https://docs.redhat.com/en/documentation/red_hat_lightwell_network/'
            target='_blank'
            icon={<ExternalLinkAltIcon />}
            iconPosition='end'
          >
            Documentation
          </Button>
          .
        </Content>
      </div>
      <div>
        <Content component='h4' className={spacing.mbSm}>
          Connect to your build tool
        </Content>
        <Tabs
          activeKey={activeTabKey}
          onSelect={(_, eventKey) => setActiveTabKey(eventKey as string)}
          aria-label='Connect repository snippets'
          ouiaId='lightwell-connect-snippets-tabs'
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.eventKey}
              eventKey={tab.eventKey}
              title={<TabTitleText>{tab.title}</TabTitleText>}
              tabContentRef={tabRefs[tab.eventKey]}
              ouiaId={`lightwell-connect-tab-${tab.eventKey}`}
            />
          ))}
        </Tabs>
        {tabs.map((tab, index) => (
          <TabContent
            key={tab.eventKey}
            eventKey={tab.eventKey}
            id={`lightwell-connect-panel-${tab.eventKey}`}
            aria-label={tab.title}
            ref={tabRefs[tab.eventKey]}
            hidden={index > 0}
            className={spacing.ptMd}
          >
            {renderTabPanel(tab)}
          </TabContent>
        ))}
      </div>
    </div>
  );

  return (
    <Popover
      aria-label='Connect to this repository'
      headerContent='Connect to this repository'
      bodyContent={bodyContent}
      position='right-start'
      flipBehavior={['right-start', 'left-start']}
      onShow={() => setActiveTabKey(firstTabKey)}
      minWidth='600px'
    >
      {children}
    </Popover>
  );
};

export default ConnectRepositoryPopover;
