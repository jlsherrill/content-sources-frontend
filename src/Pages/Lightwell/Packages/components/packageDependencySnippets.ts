import { ConnectSnippetTab } from '../../Repositories/components/connectSnippets';

interface PackageCoordinate {
  group: string;
  name: string;
  release: string;
  sourceUrl: string;
}

const normalizeSourceUrl = (url: string): string => {
  return url.replace('/api/pulp-content/lightwell', '/lightwell');
};

export const getPackageDependencySnippetTabs = (pkg: PackageCoordinate): ConnectSnippetTab[] => {
  const normalizedUrl = normalizeSourceUrl(pkg.sourceUrl);

  return [
  {
    eventKey: 'maven',
    title: 'Maven',
    snippets: [
      {
        label: 'Add to your pom.xml:',
        code: `<!-- Source: ${normalizedUrl} -->
<dependency>
  <groupId>${pkg.group}</groupId>
  <artifactId>${pkg.name}</artifactId>
  <version>${pkg.release}</version>
</dependency>`,
      },
    ],
  },
  {
    eventKey: 'gradle',
    title: 'Gradle',
    snippets: [
      {
        label: 'Add to your build.gradle:',
        code: `// Source: ${normalizedUrl}
implementation("${pkg.group}:${pkg.name}:${pkg.release}")`,
      },
    ],
  },
];
};
