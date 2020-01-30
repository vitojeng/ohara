/*
 * Copyright 2019 is-land
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import styled, { css } from 'styled-components';

import List from '@material-ui/core/List';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
import TextField from '@material-ui/core/TextField';
import IconButton from '@material-ui/core/IconButton';

export const StyleTitle = styled(MuiDialogTitle)(
  ({ theme }) => css`
    margin: 0;
    padding: ${theme.spacing(2)}px;
  `,
);

export const StyleIconButton = styled(IconButton)(
  ({ theme }) => css`
    position: absolute;
    right: ${theme.spacing(1)}px;
    top: ${theme.spacing(1)}px;
    color: ${theme.palette.grey[500]};
  `,
);

export const StyleMuiDialogContent = styled(MuiDialogContent)(
  ({ theme }) => css`
    height: 100%;
    padding: ${theme.spacing(2)}px;
  `,
);

export const StyleMuiDialogActions = styled(MuiDialogActions)(
  ({ theme }) => css`
    margin: 0;
    padding: ${theme.spacing(1)}px;
  `,
);

export const LeftBody = styled.div(
  ({ theme }) => css`
    float: left;
    height: 600px;
    width: 256px;

    .nested {
      padding-left: ${theme.spacing(3)}px;

      .MuiListItemText-root {
        padding-left: ${theme.spacing(3)}px;
      }

      ::before {
        content: '';
        left: ${theme.spacing(3)}px;
        top: 0;
        bottom: 0;
        position: absolute;
        width: ${theme.spacing(0.25)}px;
        background-color: ${theme.palette.grey[300]};
      }

      :first-child::before {
        margin-top: ${theme.spacing(1.5)}px;
      }

      :last-child::before {
        margin-bottom: ${theme.spacing(1.5)}px;
      }

      &.Mui-selected {
        background-color: white;

        .MuiListItemText-root {
          border-left: ${theme.palette.primary[600]} ${theme.spacing(0.25)}px
            solid;
          z-index: 0;
        }
      }
    }
  `,
);
export const RightBody = styled.div(
  ({ theme }) => css`
    float: left;
    height: 600px;
    width: 656px;
    overflow: scroll;
    margin-left: ${theme.spacing(2)}px;
    padding-right: ${theme.spacing(2)}px;

    & > form > * {
      margin: ${theme.spacing(0, 0, 3, 2)};
    }

    & > form > div > .MuiPaper-elevation2 {
      padding-left: ${theme.spacing(1)}px;
      margin-left: ${theme.spacing(1)}px;
    }
  `,
);

export const StyleFilter = styled(TextField)(
  ({ theme }) => css`
    width: 100%;
    margin-bottom: ${theme.spacing(2)}px;
  `,
);

export const StyleExpansionPanel = styled(ExpansionPanel)(
  () => css`
    &.MuiExpansionPanel-root.Mui-expanded {
      margin: 0;
    }
  `,
);

export const StyleList = styled(List)(
  () => css`
    width: 100%;
  `,
);

export const StyleDiv = styled.div`
  max-height: 540px;
  overflow: scroll;
  padding: 1px;
`;