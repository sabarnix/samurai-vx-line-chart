import React from 'react';
import { Line } from '@vx/shape';
import { Group } from '@vx/group';
import PropTypes from 'prop-types';

function AnnotationLine({
  height, left, margin, style,
}) {
  return (
    <Group left={margin.left}>
      <Line
        from={{
          x: left,
          y: 0,
        }}
        to={{
          x: left,
          y: height,
        }}
        {...style}
      />
    </Group>
  );
}
AnnotationLine.propTypes = {
  height: PropTypes.number,
  left: PropTypes.number,
  margin: PropTypes.object,
  style: PropTypes.object,
};

export default AnnotationLine;
