import {
  Button,
  FileUpload,
  Form,
  FormGroup,
  Modal,
  ModalVariant,
  Popover,
  SelectVariant,
  Stack,
  StackItem,
  TextInput,
  Tooltip,
} from '@patternfly/react-core';
import {
  OutlinedQuestionCircleIcon,
  PlusCircleIcon,
  MinusCircleIcon,
} from '@patternfly/react-icons';
import { TableComposable, Tbody, Td, Tr } from '@patternfly/react-table';
import { global_Color_200, global_link_Color } from '@patternfly/react-tokens';
import { useFormik } from 'formik';
import { useEffect, useMemo, useState } from 'react';
import { createUseStyles } from 'react-jss';
import Hide from '../Hide/Hide';
import {
  isValidURL,
  mapFormikToAPIValues,
  mapValidationData,
  makeValidationSchema,
  magicURLList,
  FormikValues,
} from './helpers';
import useDebounce from '../../services/useDebounce';
import ContentValidity from './components/ContentValidity';
import {
  REPOSITORY_PARAMS_KEY,
  useAddContentQuery,
  useValidateContentList,
} from '../../services/Content/ContentQueries';
import { RepositoryParamsResponse } from '../../services/Content/ContentApi';
import DropdownSelect from '../DropdownSelect/DropdownSelect';
import { useQueryClient } from 'react-query';

interface Props {
  isLoading?: boolean;
}

const useStyles = createUseStyles({
  description: {
    color: global_Color_200.value,
  },
  removeSideBorder: {
    '&:after': {
      borderLeft: 'none!important',
    },
  },
  toggleAllRow: {
    composes: ['$removeSideBorder'],
    cursor: 'pointer',
    borderBottom: 'none!important',
    '& td': {
      color: global_link_Color.value + '!important',
      padding: '8px 0!important',
    },
    '& svg': {
      fill: global_link_Color.value + '!important',
      padding: '',
    },
  },
  colHeader: {
    '& td': {
      '&:not(:last-child)': { cursor: 'pointer' },
      padding: '8px 0!important',
    },
  },
  mainContentCol: {
    composes: ['$removeSideBorder'],
    padding: '16px 0px 16px 36px!important',
  },
  toggleAction: {
    composes: ['$removeSideBorder'],
    '& button': {
      padding: '8px',
    },
  },
  addRepositoryButton: {
    marginBottom: '24px',
  },
  saveButton: {
    marginRight: '36px',
    transition: 'unset!important',
  },
  removeButton: {
    display: 'flex!important',
    justifyContent: 'flex-end',
  },
});

const defaultValues: FormikValues = {
  name: '',
  url: '',
  gpgKey: '',
  arch: '',
  versions: [],
  gpgLoading: false,
  expanded: true,
};

const AddContent = ({ isLoading }: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const classes = useStyles();
  const queryClient = useQueryClient();
  const formik = useFormik({
    initialValues: [defaultValues],
    validateOnBlur: false,
    validateOnChange: false,
    validationSchema: makeValidationSchema(),
    initialTouched: [{ name: false, url: false }],
    onSubmit: () => undefined,
  });

  const { distribution_arches: distArches = [], distribution_versions: distVersions = [] } =
    queryClient.getQueryData<RepositoryParamsResponse>(REPOSITORY_PARAMS_KEY) || {};

  const { distributionArches, distributionVersions } = useMemo(() => {
    const distributionArches = { 'Any architecture': '' };
    const distributionVersions = {};
    distArches.forEach(({ name, label }) => (distributionArches[name] = label));
    distVersions.forEach(({ name, label }) => (distributionVersions[name] = label));
    return { distributionArches, distributionVersions };
  }, [distArches, distVersions]);

  const handleModalToggle = () => setIsModalOpen(!isModalOpen);

  const closeModal = () => {
    setIsModalOpen(false);
    formik.resetForm();
  };

  const { mutateAsync: addContent, isLoading: isAdding } = useAddContentQuery(
    queryClient,
    mapFormikToAPIValues(formik.values),
  );

  const createDataLengthOf1 = formik.values.length === 1;

  const allExpanded = !formik.values.some(({ expanded }) => !expanded);

  const expandAllToggle = () => {
    formik.setValues([...formik.values.map((vals) => ({ ...vals, expanded: !allExpanded }))]);
    setTouchedOnLastItemIfUntouchedAndCollapsed();
  };

  const updateVariable = (index: number, newValue) => {
    const updatedData = [...formik.values];
    updatedData[index] = { ...updatedData[index], ...newValue };
    formik.setValues(updatedData);
  };

  const updateTouched = (index: number, field: 'name' | 'url') => {
    if (!formik.touched[index]?.[field]) {
      const updatedTouched = [...formik.touched];
      updatedTouched[index] = { ...updatedTouched[index], [field]: true };
      formik.setTouched(updatedTouched);
    }
  };

  const addRepository = () => {
    formik.setTouched([...formik.touched, { name: false, url: false }]);
    formik.setValues([
      ...formik.values.map((vals) => ({ ...vals, expanded: false })),
      defaultValues,
    ]);
  };

  const removeRepository = (index: number) => {
    const newValues = formik.values;
    newValues.splice(index, 1);

    const newTouched = formik.touched;
    newTouched.splice(index, 1);

    const newErrors = formik.errors;
    newErrors.splice(index, 1);

    formik.setTouched(newTouched);
    formik.setErrors(newErrors);
    formik.setValues(newValues);
  };

  const getFieldValidation = (
    index: number,
    field: 'name' | 'url',
  ): 'default' | 'success' | 'error' => {
    const value = !!formik.values[index]?.[field];
    const errors = !!formik.errors[index]?.[field];
    const touched = formik.touched[index]?.[field];
    switch (true) {
      case errors && touched:
        return 'error';
      case value && touched:
        return 'success';
      default:
        return 'default';
    }
  };

  // The below sets the item as touched if the user closes the expansion without touching any fields
  // This is to ensure that the user understands that the item needs attention (and is in error)
  const setTouchedOnLastItemIfUntouchedAndCollapsed = () => {
    const lastItem = formik.touched?.length - 1 || 0;
    const { name, url } = formik.touched[lastItem] || {};
    if (!name && !url) {
      const updatedTouched = [...formik.touched];
      updatedTouched[lastItem] = { ...updatedTouched[lastItem], name: true, url: true };
      formik.setTouched(updatedTouched);
    }
  };

  let debouncedValues = useDebounce(formik.values) || []; // Initial value of []

  const { mutateAsync: validateContentList } = useValidateContentList();

  useEffect(() => {
    if (isModalOpen) {
      if (debouncedValues.length !== formik.values.length) debouncedValues = formik.values;
      validateContentList(debouncedValues.map(({ name, url }) => ({ name, url }))).then(
        async (validationData) => {
          const formikErrors = await formik.validateForm(debouncedValues);
          const mappedErrorData = mapValidationData(validationData, formikErrors);
          formik.setErrors(mappedErrorData);
        },
      );
    }
  }, [debouncedValues, debouncedValues.length, formik.touched, isModalOpen]);

  const onToggle = (index: number) => {
    if (formik.values[index]?.expanded) {
      updateVariable(index, { ...formik.values[index], expanded: false });
      setTouchedOnLastItemIfUntouchedAndCollapsed();
    } else updateVariable(index, { ...formik.values[index], expanded: true });
  };

  const updateArchAndVersion = (index: number) => {
    const url = formik.values[index]?.url;
    if (isValidURL(url)) {
      const arch =
        formik.values[index]?.arch ||
        distArches.find(({ name, label }) => url.includes(name) || url.includes(label))?.label ||
        '';

      let versions: Array<string> = [];
      if (formik.values[index]?.versions?.length) {
        versions = formik.values[index]?.versions;
      } else {
        const newVersion = distVersions.find(
          ({ name, label }) => url.includes(name) || url.includes(label),
        )?.label;
        if (newVersion) versions = [newVersion];
      }
      updateVariable(index, { arch, versions });
    }
  };

  const urlOnBlur = (index: number) => {
    updateTouched(index, 'url');
    updateArchAndVersion(index);
  };

  const magicButtonThatWillBeDeletedAtSomePoint = () => {
    const baseArray = Array.from(Array(20).keys());
    formik.setTouched(baseArray.map(() => ({ name: true, url: true })));
    const newValues = baseArray.map((index) => ({
      name: (Math.random() + 1).toString(36).substring(7),
      url: magicURLList[index],
      gpgKey: '',
      arch: !(index % 3) ? 'x86_64' : '',
      versions: !(index % 2) ? ['7'] : [],
      gpgLoading: false,
      expanded: false,
    }));
    formik.setValues(newValues);
  };

  return (
    <>
      <Button
        id='createContentSourceButton'
        ouiaId='create_content_source'
        variant='primary'
        isDisabled={isLoading}
        onClick={handleModalToggle}
      >
        Create a content source
      </Button>
      {isModalOpen ? (
        <Modal
          variant={ModalVariant.medium}
          title='Add Custom Content'
          ouiaId='add_custom_repository'
          help={
            <Popover
              headerContent={<div>Help Popover</div>}
              bodyContent={
                <div>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam id feugiat augue,
                  nec fringilla turpis.
                </div>
              }
              footerContent='Popover Footer'
            >
              <Button variant='plain' aria-label='Help'>
                <OutlinedQuestionCircleIcon />
              </Button>
            </Popover>
          }
          description={
            <p className={classes.description}>
              Add by completing the form. Default values may be provided automatically.
            </p>
          }
          isOpen
          onClose={closeModal}
          footer={
            <Stack>
              <StackItem>
                <Button
                  isDisabled={!formik.isValid || formik.values.length > 19}
                  className={classes.addRepositoryButton}
                  variant='link'
                  onClick={addRepository}
                  icon={<PlusCircleIcon />}
                  ouiaId='add_row'
                >
                  Add another repository
                </Button>
              </StackItem>
              <StackItem>
                <Button
                  className={classes.saveButton}
                  key='confirm'
                  ouiaId='modal_save'
                  variant='primary'
                  isLoading={isAdding}
                  isDisabled={
                    !formik.isValid || isAdding || formik.values?.length !== debouncedValues?.length
                  }
                  onClick={() => addContent().then(closeModal)}
                >
                  Save
                </Button>
                <Button key='cancel' variant='link' onClick={closeModal} ouiaId='modal_cancel'>
                  Cancel
                </Button>
                <Button
                  key='magic'
                  variant='link'
                  isDisabled={formik.values.length > 19}
                  color='green'
                  onClick={magicButtonThatWillBeDeletedAtSomePoint}
                >
                  Add 20
                </Button>
              </StackItem>
            </Stack>
          }
        >
          <TableComposable ouiaId='modal_table_expandable' aria-label='Expandable table'>
            <Hide hide={createDataLengthOf1}>
              <Tbody isExpanded={allExpanded}>
                <Tr onClick={expandAllToggle} className={classes.toggleAllRow}>
                  <Td
                    className={classes.toggleAction}
                    isActionCell
                    expand={{
                      rowIndex: 0,
                      isExpanded: allExpanded,
                    }}
                  />
                  <Td dataLabel='expand-collapse'>{allExpanded ? 'Collapse all' : 'Expand all'}</Td>
                </Tr>
              </Tbody>
            </Hide>
            {formik.values.map(
              ({ expanded, name, url, arch, gpgKey, versions, gpgLoading }, index) => (
                <Tbody key={index} isExpanded={createDataLengthOf1 ? undefined : expanded}>
                  <Hide hide={createDataLengthOf1}>
                    <Tr className={classes.colHeader}>
                      <Td
                        onClick={() => onToggle(index)}
                        className={classes.toggleAction}
                        isActionCell
                        expand={{
                          rowIndex: index,
                          isExpanded: expanded,
                        }}
                      />
                      <Td width={35} onClick={() => onToggle(index)} dataLabel={name}>
                        {name || 'New content'}
                      </Td>
                      <Td onClick={() => onToggle(index)} dataLabel='validity'>
                        <ContentValidity
                          touched={formik.touched[index]}
                          errors={formik.errors[index]}
                        />
                      </Td>
                      <Td dataLabel='removeButton' className={classes.removeButton}>
                        <Hide hide={formik.values.length === 1}>
                          <Button
                            onClick={() => removeRepository(index)}
                            variant='link'
                            icon={<MinusCircleIcon />}
                          >
                            Remove
                          </Button>
                        </Hide>
                      </Td>
                    </Tr>
                  </Hide>
                  <Tr isExpanded={createDataLengthOf1 ? undefined : expanded}>
                    <Td colSpan={4} className={createDataLengthOf1 ? '' : classes.mainContentCol}>
                      <Form>
                        <FormGroup
                          label='Name'
                          isRequired
                          fieldId='namegroup'
                          validated={getFieldValidation(index, 'name')}
                          helperTextInvalid={formik.errors[index]?.name}
                        >
                          <TextInput
                            isRequired
                            id='name'
                            name='name'
                            label='Name'
                            type='text'
                            validated={getFieldValidation(index, 'name')}
                            onBlur={() => updateTouched(index, 'name')}
                            onChange={(value) => {
                              updateVariable(index, { name: value });
                            }}
                            value={name || ''}
                            placeholder='Enter name'
                          />
                        </FormGroup>
                        <FormGroup
                          label='URL'
                          isRequired
                          fieldId='url'
                          validated={getFieldValidation(index, 'url')}
                          helperTextInvalid={formik.errors[index]?.url}
                        >
                          <TextInput
                            isRequired
                            type='url'
                            validated={getFieldValidation(index, 'url')}
                            onBlur={() => urlOnBlur(index)}
                            onChange={(value) => updateVariable(index, { url: value })}
                            value={url || ''}
                            placeholder='https://'
                            id='url'
                            name='url'
                            label='Url'
                          />
                        </FormGroup>
                        <FormGroup
                          label='Restrict architecture'
                          labelIcon={
                            <Tooltip content='Something super important and stuff'>
                              <OutlinedQuestionCircleIcon
                                className='pf-u-ml-xs'
                                color={global_Color_200.value}
                              />
                            </Tooltip>
                          }
                          fieldId='arch'
                        >
                          <DropdownSelect
                            menuAppendTo={document.body}
                            toggleId={'archSelection' + index}
                            options={Object.keys(distributionArches)}
                            variant={SelectVariant.single}
                            selectedProp={arch}
                            setSelected={(value) =>
                              updateVariable(index, { arch: distributionArches[value] })
                            }
                          />
                        </FormGroup>
                        <FormGroup
                          label='Restrict OS version'
                          labelIcon={
                            <Tooltip content='Something super important and stuff'>
                              <OutlinedQuestionCircleIcon
                                className='pf-u-ml-xs'
                                color={global_Color_200.value}
                              />
                            </Tooltip>
                          }
                          fieldId='version'
                        >
                          <DropdownSelect
                            menuAppendTo={document.body}
                            toggleId={'versionSelection' + index}
                            options={Object.keys(distributionVersions)}
                            variant={SelectVariant.typeaheadMulti}
                            selectedProp={Object.keys(distributionVersions).filter((key: string) =>
                              versions?.includes(distributionVersions[key]),
                            )}
                            placeholderText={versions?.length ? '' : 'Any version'}
                            setSelected={(value) =>
                              updateVariable(index, {
                                versions: value.map((val) => distributionVersions[val]),
                              })
                            }
                          />
                        </FormGroup>
                        <Hide hide>
                          <FormGroup
                            label='GPG key'
                            labelIcon={
                              <Tooltip content='Something super important and stuff'>
                                <OutlinedQuestionCircleIcon
                                  className='pf-u-ml-xs'
                                  color={global_Color_200.value}
                                />
                              </Tooltip>
                            }
                            fieldId='gpgKey'
                          >
                            <FileUpload
                              id='gpgKey-uploader'
                              type='text'
                              filenamePlaceholder='Drag a file here or upload one'
                              textAreaPlaceholder='Paste GPG key or URL here'
                              value={gpgKey}
                              isLoading={gpgLoading}
                              // filename={filename}
                              // onFileInputChange={(e, { name }) => console.log(name)}
                              onDataChange={(value) => updateVariable(index, { gpgKey: value })}
                              onTextChange={(value) => {
                                if (isValidURL(value)) {
                                  updateVariable(index, { gpgLoading: true });
                                  // TODO: add call to GPGkey api
                                  return setTimeout(
                                    () => updateVariable(index, { gpgLoading: false }),
                                    1500,
                                  );
                                }
                                updateVariable(index, { gpgKey: value });
                              }}
                              onClearClick={() => updateVariable(index, { gpgKey: '' })}
                              dropzoneProps={{
                                accept: '.txt',
                                maxSize: 4096,
                                onDropRejected: (e) => console.log('onDropRejected', e),
                              }}
                              allowEditingUploadedText
                              browseButtonText='Upload'
                            />
                          </FormGroup>
                        </Hide>
                      </Form>
                    </Td>
                  </Tr>
                </Tbody>
              ),
            )}
          </TableComposable>
        </Modal>
      ) : (
        ''
      )}
    </>
  );
};

export default AddContent;
