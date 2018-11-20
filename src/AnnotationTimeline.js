import React from 'react';
import { Line } from '@vx/shape';
import { Group } from '@vx/group';
import { Text } from '@vx/text';
import PropTypes from 'prop-types';
import AnnotationTooltipCircle from './AnnotationTooltipCircle';

function AnnotationTimeine({
  config, xMax, annotations, xScale, onClick, active,
}) {
  return (
    <Group left={config.margin.left}>
      <Text
        fontSize={14}
        x={config.margin.left + (xMax / 2)}
        y={30}
        textAnchor="middle"
        fill={config.fontColor}
        fontFamily={config.fontFamily}
        fontWeight="bold"
      >
        Events Timeline
      </Text>
      <Group top={40}>
        <Line
          from={{
            x: 0,
            y: 32,
          }}
          to={{
            x: xMax,
            y: 32,
          }}
          stroke-width="0.3"
          stroke={config.annotation.stroke}
        />
        <Group>
          {annotations.map(({ timestamp, data = {} }, index) => (<AnnotationTooltipCircle
            timestamp={timestamp}
            x={xScale(timestamp)}
            onClick={onClick}
            id={index}
            active={index === active}
            shouldHighlight={config.annotationCircle.shouldHighlight(data)}
            config={config.annotationCircle}
          />))}
        </Group>
      </Group>
    </Group>
  );
}
AnnotationTimeine.propTypes = {
  config: PropTypes.object,
  xMax: PropTypes.number,
  annotations: PropTypes.array,
  xScale: PropTypes.func,
  onClick: PropTypes.func,
  active: PropTypes.number,
};

export default AnnotationTimeine;
