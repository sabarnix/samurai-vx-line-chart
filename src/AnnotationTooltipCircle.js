import React from 'react';
import { Group } from '@vx/group';
import PropTypes from 'prop-types';

function AnnotationTooltipCircle({
  timestamp, x, onClick, id, active,
}) {
  const handleClick = () => {
    if (onClick) {
      onClick(id);
    }
  };
  const color = active ? '#eb5b59' : '#575d6d';
  return (
    <Group onClick={handleClick}>
      <circle
        key={`annotation-${timestamp.toString()}-outer`}
        cx={x}
        cy={32}
        r={7}
        fill={color}
        stroke={color}
        style={{ cursor: 'pointer' }}
        fillOpacity={0.1}
        strokeOpacity={0.7}
        strokeWidth=".6"
      />,
      <circle
        key={`annotation-${timestamp.toString()}-inner`}
        cx={x}
        cy={32}
        r={3}
        fill={color}
        stroke={color}
        strokeWidth="1.5"
        style={{ pointerEvents: 'none' }}
      />
    </Group>
  );
}
AnnotationTooltipCircle.propTypes = {
  timestamp: PropTypes.instanceOf(Date),
  x: PropTypes.number,
  onClick: PropTypes.func,
  id: PropTypes.any,
  active: PropTypes.bool,
};

export default AnnotationTooltipCircle;
