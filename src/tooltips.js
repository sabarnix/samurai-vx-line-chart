/* eslint-disable react/no-array-index-key */
import React from 'react';
import { Tooltip } from '@vx/tooltip';
import { format } from 'd3-format';
import PropTypes from 'prop-types';

const formatNumber = format(',');

function Tooltips({
  top, left, data, singleChartHeight, xMax, opacity, colorScale,
}) {
  return (
    <div style={{ opacity }} className="samurai-vx-tooltip">
      {data.map(({ date, data: tooltipData, id }, gIndex) => (
        <Tooltip
          top={(singleChartHeight * gIndex) + top}
          left={left}
          key={`${id}-${gIndex}`}
          style={{
            transform: (left < xMax / 2) ? 'translateX(10%)' : 'translateX(-110%)',
            padding: '.5rem',
          }}
        >
          <ul className="tooltip-data" style={{ maxHeight: singleChartHeight - (top + 20) }}>
            <li key="header" className="tooltip-header">{date}</li>
            {tooltipData.filter(({ data: pointData }) => ![null, undefined].includes(pointData)).map(({ label, data: pointData, series }) =>
              (
                <li key={pointData + label + series}>
                  <span className="marker" style={{ backgroundColor: colorScale(series) }}></span>
                  {label}: <span className="data">{formatNumber(pointData)}</span>
                </li>
              ))}
          </ul>
        </Tooltip>))}
    </div>
  );
}
Tooltips.propTypes = {
  top: PropTypes.number,
  left: PropTypes.number,
  data: PropTypes.array,
  singleChartHeight: PropTypes.number,
  xMax: PropTypes.number,
  opacity: PropTypes.number,
  colorScale: PropTypes.func,
};

export default Tooltips;
