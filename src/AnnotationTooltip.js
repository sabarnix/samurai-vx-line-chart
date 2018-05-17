/* eslint-disable react/no-array-index-key */
import React from 'react';
import { Tooltip } from '@vx/tooltip';
import PropTypes from 'prop-types';

function AnnotationTooltip({
  top, left, data, xMax, id, date,
}) {
  return (
    <Tooltip
      top={top}
      left={left}
      key={id}
      style={{
        transform: (left < xMax / 2) ? '' : 'translateX(-100%)',
        padding: '.5rem',
      }}
      className={`samurai-vx-annotation-tooltip ${(left < xMax / 2) ? 'left' : 'right'}`}
    >
      <div className="tooltip-header">{date}</div>
      <div className="tooltip-body">
        <table>
          {Object.keys(data).map((key) => (
            <tr>
              <th>{key}</th>
              <td><span className="event-count">{data[key]} Events</span></td>
            </tr>
          ))}
        </table>
      </div>
    </Tooltip>
  );
}
AnnotationTooltip.propTypes = {
  top: PropTypes.number,
  left: PropTypes.number,
  data: PropTypes.object,
  xMax: PropTypes.number,
  id: PropTypes.any,
  date: PropTypes.string,
};

export default AnnotationTooltip;
