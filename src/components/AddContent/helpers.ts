import { isEmpty } from 'lodash';
import { FormikErrors } from 'formik';
import { ValidationResponse } from '../../services/Content/ContentApi';

export const REGEX_URL =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

export const isValidURL = (val: string) => {
  const regex = new RegExp(REGEX_URL);
  return val.match(regex);
};

export const mapFormikToAPIValues = (
  formikValues: {
    name: string;
    url: string;
    gpgKey: string;
    arch: string;
    versions: never[];
    gpgLoading: boolean;
    expanded: boolean;
  }[],
) =>
  formikValues.map(({ name, url, arch, versions, gpgKey }) => ({
    name,
    url,
    distribution_arch: arch,
    distribution_versions: versions,
    gpgKey,
  }));

export const mapValidationData = (
  validationData: ValidationResponse,
  formikErrors: FormikErrors<
    | {
        name: string;
        url: string;
        gpgKey: string;
        arch: string;
        versions: never[];
        gpgLoading: boolean;
        expanded: boolean;
      }
    | undefined
  >[],
) => {
  const errors = validationData.map(({ name, url }, index: number) => ({
    // First apply the errors found in the ValidationAPI
    ...(name?.error ? { name: name?.error } : {}),
    ...(url?.error ? { url: url?.error } : {}),
    // Overwrite any errors with errors found within the UI itself
    ...formikErrors[index],
  }));

  if (errors.every((err) => isEmpty(err))) {
    return [];
  }

  return errors;
};
