import { configure } from '@storybook/react';
import { setOptions } from '@storybook/addon-options';

setOptions({
  name: 'samurai-vx-line-chart',
});

function loadStories() {
  require('../stories');
}

configure(loadStories, module);
