import styled from 'styled-components';
import { FormGroup, Button } from 'common/Form';
import { primaryBtn } from 'theme/btnTheme';
import * as CSS_VARS from 'theme/variables';

const List = styled.div`
  position: relative;
  width: ${props => props.width || '100%'};
  border: 1px solid ${CSS_VARS.lighterGray};
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  min-height: 8rem;
`;

const ListItem = styled.div`
  margin: 0.25rem 0;
  font-size: 13px;
  color: ${CSS_VARS.lightBlue};
`;

const FormRow = styled(FormGroup).attrs({
  isInline: true,
})`
  margin: ${props => props.margin || 0};
`;

const FormCol = styled(FormGroup)`
  width: ${props => props.width || '100%'};
`;

const AppendButton = styled(Button).attrs({
  theme: primaryBtn,
})`
  position: absolute;
  right: 0;
  top: -3rem;
`;

export { List, ListItem, FormRow, FormCol, AppendButton };
