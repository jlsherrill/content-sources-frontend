import React from 'react';
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { DELETE_ROUTE, TEMPLATES_ROUTE } from 'Routes/constants';
import ConditionalTooltip from 'components/ConditionalTooltip/ConditionalTooltip';
import { useAppContext } from 'middleware/AppContext';

export default function TemplateActionDropdown() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { pathname } = useLocation();
  const [mainRoute] = pathname?.split(`${TEMPLATES_ROUTE}/`) || [];
  const baseRoute = mainRoute + `${TEMPLATES_ROUTE}`;
  const navigate = useNavigate();  
  const { templateUUID: uuid } = useParams();
  const { rbac } = useAppContext();

  const onToggleClick = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = (_, value: string | number | undefined) => {
    switch (value) {
      case 'edit':
        navigate(`${baseRoute}/${uuid}/edit`);
        setIsOpen(false);
        break;
      case 'delete':
        navigate(`${baseRoute}/${uuid}/${DELETE_ROUTE}`)      
        break;

      default:
        setIsOpen(false);
        break;
    }
  };

  return (
    <Dropdown
      isOpen={isOpen}
      onSelect={onSelect}
      onOpenChange={(isOpen: boolean) => setIsOpen(isOpen)}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <ConditionalTooltip
          content='You do not have the required permissions to perform this action.'
          show={!rbac?.templateWrite}
          setDisabled
        >
          <MenuToggle
            ref={toggleRef}
            onClick={onToggleClick}
            isExpanded={isOpen}
          >
            Actions
          </MenuToggle>
        </ConditionalTooltip>
      )}
      ouiaId='template_actions'
    >
      <DropdownList>
        <DropdownItem value='edit'>Edit</DropdownItem>
        <DropdownItem value='delete'>
          Delete
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
}
