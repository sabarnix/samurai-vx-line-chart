import { compose, withState, withHandlers } from 'recompose';

export default compose(
  withState('range', 'updateRange', {
    start: undefined,
    end: undefined,
    isInRangeSelectionMode: false,
  }),
  withHandlers({
    onRangeSelect: ({ updateRange }) => ({ x0, x1 }) => {
      updateRange((prevState) => ({
        ...prevState,
        start: Math.min(x0, x1),
        end: Math.max(x0, x1),
        isInRangeSelectionMode: true,
      }));
    },
    onRangeSelectClose: ({ updateRange }) => () => {
      updateRange((prevState) => ({
        ...prevState,
        end: undefined,
        start: undefined,
        isInRangeSelectionMode: false,
      }));
    },
  })
);
