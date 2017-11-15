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
      {data.map(({ date, data: tooltipData }, gIndex) => (
        <Tooltip
          top={(singleChartHeight * gIndex) + top}
          left={left}
          style={{
            transform: (left < xMax / 2) ? 'translateX(10%)' : 'translateX(-110%)',
            padding: '.5rem',
          }}
        >
          <ul className="tooltip-data">
            <li className="tooltip-header">{date}</li>
            {tooltipData.map(({ label, data: pointData }) =>
              (
                <li key={pointData + label}>
                  <span className="marker" style={{ borderColor: colorScale(label) }}></span>
                  {label}: <span className="data">{formatNumber(pointData)}</span>
                </li>
              ))}
          </ul>
        </Tooltip>))}
      <style>
        {`
           .samurai-vx-tooltip .tooltip-data {
            list-style-type: none;
            margin: 0;
            padding: 0;
            maxHeight: ${singleChartHeight - (top + 20)}px,
            overflow: 'hidden',
           }
           .samurai-vx-tooltip .tooltip-data li {
            padding: 0;
            margin: 0;
            white-space: nowrap;
            font-size: .75rem;
            line-height: 20px;
           }
           .samurai-vx-tooltip .tooltip-data li.tooltip-header {
            color: #b2b5bc;
            font-size: .9rem;
            line-height: 24px;
           }
           .samurai-vx-tooltip .tooltip-data li .data {
            font-weight: bold;
           }
           .samurai-vx-tooltip .tooltip-data li .marker {
              width: 10px;
              height: 10px;
              display: inline-block;
              margin-right: .4rem;
              border-radius: 50%;
              border: 2px solid red;
           }
          `}
      </style>
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
