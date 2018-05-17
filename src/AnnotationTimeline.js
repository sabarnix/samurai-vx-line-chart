import React from 'react';
import { Line } from '@vx/shape';
import { Group } from '@vx/group';
import PropTypes from 'prop-types';
import AnnotationTooltipCircle from './AnnotationTooltipCircle';

function AnnotationTimeine({
  margin, xMax, annotations, xScale, onClick, active
}) {
  return (
    <Group left={margin.left}>
      <Line
        from={{
          x: 0,
          y: 29,
        }}
        to={{
          x: xMax,
          y: 29,
        }}
        stroke="#f5f5f5"
      />
      <Group>
        {annotations.map(({ timestamp }, index) => (<AnnotationTooltipCircle
          timestamp={timestamp}
          x={xScale(timestamp)}
          onClick={onClick}
          id={index}
          active={index === active}
        />))}
      </Group>
    </Group>
  );
}
AnnotationTimeine.propTypes = {
  margin: PropTypes.object,
  xMax: PropTypes.number,
  annotations: PropTypes.array,
  xScale: PropTypes.func,
  onClick: PropTypes.func,
  active: PropTypes.number,
};

export default AnnotationTimeine;
