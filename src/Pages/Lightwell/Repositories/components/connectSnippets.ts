import { ContentItem } from 'services/Content/ContentApi';

export interface ConnectCodeSnippet {
  label: string;
  code: string;
  urlOnly?: boolean;
  description?: string;
}

export interface ConnectSnippetTab {
  eventKey: string;
  title: string;
  snippets: ConnectCodeSnippet[];
  docsUrl?: string;
}

type RepositoryContext = Pick<ContentItem, 'name' | 'published_distribution_url' | 'content_type'>;

const getMavenRepoId = (repository: RepositoryContext): string => {
  const securityLevel = repository.name.includes('remediated') ? 'remediated' : 'validated';
  return `lightwell-${securityLevel}`;
};

const getMavenRepoName = (repository: RepositoryContext): string => {
  const securityLevel = repository.name.includes('remediated') ? 'Remediated' : 'Validated';
  return `Red Hat Lightwell Network - ${securityLevel}`;
};

const getMavenSnippetTabs = (repository: RepositoryContext): ConnectSnippetTab[] => {
  const { published_distribution_url } = repository;
  const repoId = getMavenRepoId(repository);
  const repoName = getMavenRepoName(repository);

  return [
    {
      eventKey: 'maven',
      title: 'Maven',
      docsUrl: 'https://docs.redhat.com/en/documentation/red_hat_lightwell_network/current/configure-configure_java_build_tool',
      snippets: [
        {
          label: 'Add to your settings.xml:',
          code: `<settings>
  <profiles>
    <profile>
      <id>${repoId}</id>
      <repositories>
        <repository>
          <id>${repoId}</id>
          <name>${repoName}</name>
          <url>${published_distribution_url}</url>
          <releases>
            <enabled>true</enabled>
          </releases>
          <snapshots>
            <enabled>false</enabled>
          </snapshots>
        </repository>
      </repositories>
    </profile>
  </profiles>
  <activeProfiles>
    <activeProfile>${repoId}</activeProfile>
  </activeProfiles>
</settings>`,
        },
        {
          label: 'Add server credentials to your settings.xml:',
          code: `<servers>
  <server>
    <id>${repoId}</id>
    <username><service_account_username></username>
    <password><service_account_token></password>
  </server>
</servers>`,
          description: 'Username format: XXXXXXX|service-account-name',
        },
      ],
    },
    {
      eventKey: 'gradle',
      title: 'Gradle',
      docsUrl: 'https://docs.redhat.com/en/documentation/red_hat_lightwell_network/current/configure-configure_java_build_tool',
      snippets: [
        {
          label: 'Add to your build.gradle:',
          code: `repositories {
    maven {
        credentials {
            username "$mavenUser"
            password "$mavenPassword"
        }
        url "${published_distribution_url}"
    }
    mavenCentral()
}`,
          description: 'Place above mavenCentral() to prioritize patched versions.',
        },
        {
          label: 'Add credentials to ~/.gradle/gradle.properties:',
          code: `mavenUser=<service_account_username>
mavenPassword=<service_account_token>`,
          description: 'Do not commit credentials. Store in ~/.gradle/gradle.properties.',
        },
      ],
    },
    {
      eventKey: 'artifactory',
      title: 'Artifactory',
      docsUrl: 'https://docs.redhat.com/en/documentation/red_hat_lightwell_network/current/configure-configure_artifactory_to_use_rhln_repository',
      snippets: [
        {
          label: 'Configure as a remote Maven repository:',
          code: published_distribution_url || '',
          urlOnly: true,
          description:
            'Set as the remote URL in Artifactory. Configure basic authentication with your service account credentials.',
        },
      ],
    },
    {
      eventKey: 'nexus',
      title: 'Nexus',
      docsUrl: 'https://docs.redhat.com/en/documentation/red_hat_lightwell_network/current/configure-configure_nexus_to_use_rhln_repository',
      snippets: [
        {
          label: 'Configure as a Maven proxy repository:',
          code: published_distribution_url || '',
          urlOnly: true,
          description:
            'Set as the remote URL in Nexus. Authentication uses mTLS client certificates.',
        },
      ],
    },
  ];
};

const getPythonSnippetTabs = (repository: RepositoryContext): ConnectSnippetTab[] => {
  const { published_distribution_url } = repository;

  return [
    {
      eventKey: 'pip',
      title: 'pip',
      docsUrl: 'https://docs.redhat.com/en/documentation/red_hat_lightwell_network/current/configure-configure_python_build_tool',
      snippets: [
        {
          label: 'Add credentials to ~/.netrc:',
          code: `machine packages.redhat.com login <service_account_username> password <service_account_token>`,
          description: 'Username format: XXXXXXX|service-account-name',
        },
        {
          label: 'Set as default index:',
          code: `pip config set global.index-url ${published_distribution_url}`,
        },
      ],
    },
    {
      eventKey: 'pipenv',
      title: 'Pipenv',
      docsUrl: 'https://docs.redhat.com/en/documentation/red_hat_lightwell_network/current/configure-configure_python_build_tool',
      snippets: [
        {
          label: 'Add credentials to ~/.netrc:',
          code: `machine packages.redhat.com login <service_account_username> password <service_account_token>`,
          description: 'Username format: XXXXXXX|service-account-name',
        },
        {
          label: 'Install from the repository:',
          code: `pipenv install --index ${published_distribution_url}`,
        },
      ],
    },
    {
      eventKey: 'poetry',
      title: 'Poetry',
      docsUrl: 'https://docs.redhat.com/en/documentation/red_hat_lightwell_network/current/configure-configure_python_build_tool',
      snippets: [
        {
          label: 'Configure authentication:',
          code: `poetry config http-basic.lightwell "<service_account_username>" "<service_account_token>"`,
          description: 'Username format: XXXXXXX|service-account-name',
        },
        {
          label: 'Add as default source:',
          code: `poetry source add --priority=default lightwell ${published_distribution_url}`,
        },
      ],
    },
    {
      eventKey: 'artifactory',
      title: 'Artifactory',
      docsUrl: 'https://docs.redhat.com/en/documentation/red_hat_lightwell_network/current/configure-configure_artifactory_to_use_rhln_repository',
      snippets: [
        {
          label: 'Configure as a remote PyPI repository:',
          code: published_distribution_url || '',
          urlOnly: true,
          description:
            'Set as the remote URL in Artifactory. Configure basic authentication with your service account credentials.',
        },
      ],
    },
    {
      eventKey: 'nexus',
      title: 'Nexus',
      docsUrl: 'https://docs.redhat.com/en/documentation/red_hat_lightwell_network/current/configure-configure_nexus_to_use_rhln_repository',
      snippets: [
        {
          label: 'Configure as a PyPI proxy repository:',
          code: published_distribution_url || '',
          urlOnly: true,
          description:
            'Set as the remote URL in Nexus. Authentication uses mTLS client certificates.',
        },
      ],
    },
  ];
};

export const getConnectSnippetTabs = (repository: RepositoryContext): ConnectSnippetTab[] => {
  const contentType = repository.content_type;

  if (contentType === 'maven') {
    return getMavenSnippetTabs(repository);
  }

  return getPythonSnippetTabs(repository);
};
