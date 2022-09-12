import { isEmpty } from 'lodash';
import * as Yup from 'yup';
import { FormikErrors } from 'formik';
import { ValidationResponse } from '../../services/Content/ContentApi';
import ERROR_CODE from './httpErrorCodes.json';

export interface FormikValues {
  name: string;
  url: string;
  gpgKey: string;
  arch: string;
  versions: string[];
  gpgLoading: boolean;
  expanded: boolean;
}

export const REGEX_URL =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

export const isValidURL = (val: string) => {
  const regex = new RegExp(REGEX_URL);
  return val.match(regex);
};

export const mapFormikToAPIValues = (formikValues: FormikValues[]) =>
  formikValues.map(({ name, url, arch, versions, gpgKey }) => ({
    name,
    url,
    distribution_arch: arch,
    distribution_versions: versions,
    gpgKey,
  }));

const mapNoMetaDataError = (validationData: ValidationResponse) =>
  validationData.map(({ url, ...rest }) => ({
    ...rest,
    url: {
      ...url,
      error:
        !url?.error && !url?.metadata_present
          ? `Unable to retrieve YUM Metadata, Recieved HTTP ${url?.http_code}: ${
              url ? ERROR_CODE[url.http_code] : ''
            }`
          : url?.error,
    },
  }));

export const mapValidationData = (
  validationData: ValidationResponse,
  formikErrors: FormikErrors<FormikValues | undefined>[],
) => {
  const updatedValidationData = mapNoMetaDataError(validationData);
  const errors = updatedValidationData.map(({ name, url }, index: number) => ({
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

export const makeValidationSchema = () => {
  // This adds the uniqueProperty function to the below schema validation
  Yup.addMethod(Yup.object, 'uniqueProperty', function (propertyName, message) {
    return this.test('unique', message, function (value) {
      if (!value || !value[propertyName]) {
        return true;
      }
      if (
        this.parent.filter((v) => v !== value).some((v) => v[propertyName] === value[propertyName])
      ) {
        throw this.createError({
          path: `${this.path}.${propertyName}`,
        });
      }

      return true;
    });
  });

  return Yup.array(
    Yup.object()
      .shape({
        name: Yup.string().min(2, 'Too Short!').max(50, 'Too Long!').required('Required'),
        url: Yup.string().url('Invalid URL').required('Required'),
        gpgKey: Yup.string().optional(),
      })
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore-next-line
      .uniqueProperty('name', 'Names must be unique')
      .uniqueProperty('url', 'Url\'s must be unique'),
  );
};

export const magicURLList = [
  'http://mirror.stream.centos.org/9-stream/BaseOS/x86_64/os/',
  'http://mirror.stream.centos.org/SIGs/9/kmods/x86_64/packages-main/',
  'http://mirror.stream.centos.org/9-stream/AppStream/x86_64/os/',
  'https://mirror.linux.duke.edu/pub/centos/8-stream/BaseOS/x86_64/os/',
  'https://download-i2.fedoraproject.org/pub/epel/7/x86_64/',
  'https://download-i2.fedoraproject.org/pub/epel/8/Everything/x86_64/',
  'https://download-i2.fedoraproject.org/pub/epel/9/Everything/x86_64/',
  'http://yum.theforeman.org/pulpcore/3.18/el7/x86_64/',
  'http://yum.theforeman.org/pulpcore/3.18/el8/x86_64/',
  'http://yum.theforeman.org/pulpcore/3.18/el9/x86_64/',
  'http://yum.theforeman.org/katello/4.6/katello/el8/x86_64/',
  'http://yum.theforeman.org/client/3.4/el7/x86_64/',
  'http://yum.theforeman.org/client/3.4/el8/x86_64/',
  'http://yum.theforeman.org/client/3.4/el9/x86_64/',
  'http://yum.theforeman.org/releases/3.4/el8/x86_64/',
  'https://dl.google.com/linux/chrome/rpm/stable/x86_64/',
  'http://yum.theforeman.org/client/3.3/el7/x86_64/',
  'http://yum.theforeman.org/client/3.3/el8/x86_64/',
  'http://yum.theforeman.org/client/3.3/el9/x86_64/',
  'http://yum.theforeman.org/client/3.2/el7/x86_64/',
  'http://yum.theforeman.org/client/3.2/el8/x86_64/',
  'https://developer.download.nvidia.com/compute/cuda/repos/rhel7/x86_64/',
  'https://developer.download.nvidia.com/compute/cuda/repos/rhel8/x86_64/',
  'https://developer.download.nvidia.com/compute/cuda/repos/rhel9/x86_64/',
  'http://download1.rpmfusion.org/nonfree/el/updates/7/x86_64/',
  'http://download1.rpmfusion.org/nonfree/el/updates/8/x86_64/',
  'http://download1.rpmfusion.org/nonfree/el/updates/9/x86_64/',
  'http://download1.rpmfusion.org/free/el/updates/7/x86_64/',
  'http://download1.rpmfusion.org/free/el/updates/8/x86_64/',
  'http://download1.rpmfusion.org/free/el/updates/9/x86_64/',
  'https://rpms.remirepo.net/enterprise/7/safe/x86_64/',
  'https://rpms.remirepo.net/enterprise/8/safe/x86_64/',
  'https://rpms.remirepo.net/enterprise/9/safe/x86_64/',
  'https://rpms.remirepo.net/enterprise/7/remi/x86_64/',
  'https://rpms.remirepo.net/enterprise/8/remi/x86_64/',
  'http://yum.theforeman.org/pulpcore/3.9/el7/x86_64/',
  'http://yum.theforeman.org/katello/nightly/katello/el8/x86_64/',
];
