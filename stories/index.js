import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import LineChart from '../src';
import samData from './data';

storiesOf('Line Chart', module)
  .add('default', () => (
    <div style={{ position: 'fixed', left: '0', right: '0', top: '0', bottom: '0' }}>
      <LineChart data={samData} />
    </div>
  ));
