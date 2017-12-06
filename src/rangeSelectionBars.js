import React from 'react';
import { Group } from '@vx/group';
import PropTypes from 'prop-types';
function RangeSelectionBars(props) {
  const {
    range,
    className,
    height,
    xMax,
    fill = 'rgba(0, 0, 0, 0.1)',
    stroke = 'rgba(0, 0, 0, .7)',
    strokeWidth = 1,
    ...otherProps
  } = props;
  const { start, end, isInRangeSelectionMode } = range;
  if (start === undefined || end === undefined || !isInRangeSelectionMode) return null;
  return (
    <Group className={className}>
      <rect
        fill={fill}
        stroke="none"
        strokeWidth={0}
        x={0}
        y={0}
        width={start}
        height={height}
        {...otherProps}
      />
      <rect
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray="10 5"
        x={start}
        y={0}
        width={Math.abs(end - start)}
        height={height}
        {...otherProps}
      />
      <rect
        fill={fill}
        stroke="none"
        strokeWidth={0}
        x={end}
        y={0}
        width={Math.abs(xMax - end)}
        height={height}
        {...otherProps}
      />
    </Group>
  );
}

RangeSelectionBars.propTypes = {
  range: PropTypes.object,
  className: PropTypes.string,
  height: PropTypes.number,
  xMax: PropTypes.number,
  fill: PropTypes.string,
  stroke: PropTypes.string,
  strokeWidth: PropTypes.number,
};

export default RangeSelectionBars;
