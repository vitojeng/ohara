import { PIPELINE, DEPLOYMENT, MONITORING } from './urls';

const NAVS = [
  {
    testId: 'pipelines-link',
    to: PIPELINE,
    text: 'Pipelines',
    iconCls: 'fa-code-branch',
  },
  {
    testId: 'deployment-link',
    to: DEPLOYMENT,
    text: 'Deployment',
    iconCls: 'fa-sitemap',
  },
  {
    testId: 'monitoring-link',
    to: MONITORING,
    text: 'Monitoring',
    iconCls: 'fa-desktop',
  },
];

export default NAVS;
