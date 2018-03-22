import React from 'react';
import PropTypes from 'prop-types';

function LegendShape({ fill, width, height }) {
  return (<div
    className="samurai-vx-legend-shape"
    style={{
      width, height, backgroundColor: fill, borderRadius: '50%',
    }}
  />);
}


LegendShape.propTypes = {
  fill: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,
};

export default LegendShape;
