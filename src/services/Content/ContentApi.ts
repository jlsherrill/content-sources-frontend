import axios from 'axios';

export interface ContentItem {
  uuid: string;
  name: string;
  url: string;
  distribution_versions: Array<string>;
  distribution_arch: string;
  account_id: string;
  org_id: string;
}

export interface CreateContentRequestItem {
  name: string;
  url: string;
  distribution_versions?: Array<string>;
  distribution_arch?: string;
  gpgKey?: string;
}

export type CreateContentRequest = Array<CreateContentRequestItem>;

export type ContentList = Array<ContentItem>;

export type Links = {
  first: string;
  last: string;
  next: string;
};

export type Meta = {
  count: number;
  limit: number;
  offset: number;
};

export interface ContentListResponse {
  data: ContentList;
  links: Links;
  meta: Meta;
}

export interface RepositoryParamsResponse {
  distribution_versions: Array<NameLabel>;
  distribution_arches: Array<NameLabel>;
}

export type NameLabel = {
  name: string;
  label: string;
};

export type FilterData = {
  searchQuery: string;
  versions: Array<string>;
  arches: Array<string>;
};

export type ValidateItem = {
  skipped: boolean;
  valid: boolean;
  error: string;
  http_code: number;
  metadata_present: boolean;
};

export type ValidationResponse = {
  name?: ValidateItem;
  url?: ValidateItem;
  distribution_versions?: ValidateItem;
  distribution_arch?: ValidateItem;
  gpgKey?: ValidateItem;
}[];

export const getContentList: (
  page: number,
  limit: number,
  filterData: FilterData,
) => Promise<ContentListResponse> = async (page, limit, filterData) => {
  const searchQuery = filterData.searchQuery;
  const versionParam = filterData.versions.join(',');
  const archParam = filterData.arches.join(',');
  const { data } = await axios.get(
    `/api/content_sources/v1/repositories/?offset=${
      (page - 1) * limit
    }&limit=${limit}&search=${searchQuery}&version=${versionParam}&arch=${archParam}`,
  );
  return data;
};

export const deleteContentListItem: (uuid: string) => Promise<void> = async (uuid: string) => {
  const { data } = await axios.delete(`/api/content_sources/v1/repositories/${uuid}`);
  return data;
};

export const AddContentListItems: (request: CreateContentRequest) => Promise<void> = async (
  request,
) => {
  const { data } = await axios.post('/api/content_sources/v1.0/repositories/bulk_create/', request);
  return data;
};

export const getRepositoryParams: () => Promise<RepositoryParamsResponse> = async () => {
  const { data } = await axios.get('/api/content_sources/v1/repository_parameters/');
  return data;
};

export const validateContentListItems: (
  request: CreateContentRequest,
) => Promise<ValidationResponse> = async (request) => {
  const { data } = await axios.post(
    '/api/content_sources/v1.0/repository_parameters/validate/',
    request,
  );
  return data;
};
