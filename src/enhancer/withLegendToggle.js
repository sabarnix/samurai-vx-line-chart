import { compose, withState, withHandlers } from 'recompose';

export default compose(
  withState('legendToggle', 'updateLegendToggle', []),
  withHandlers({
    onToggleLegend: ({ updateLegendToggle }) => (legend) => {
      updateLegendToggle((disabledLegends) => disabledLegends.includes(legend) ? disabledLegends.filter((l) => l !== legend) : [...disabledLegends, legend]);
    },
  })
);
