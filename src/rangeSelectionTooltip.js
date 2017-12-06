import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from '@vx/tooltip';

function RangeSelectionTooltip({
  start,
  end,
  xScale,
  top,
  dateFormat,
  offset = 0,
  showActions = false,
  onSelect,
  onCancel,
}) {
  return (
    <Tooltip
      left={(start + ((end - start) / 2)) + offset}
      top={top}
      style={{
        transform: 'translate(-50%, -50%)',
        padding: '1rem',
        pointerEvents: 'auto',
      }}
      className="samurai-vx-tooltip-range-selection"
    >
      {`${dateFormat(xScale.invert(start))} to ${dateFormat(xScale.invert(end))}`}
      {showActions &&
        <div className="actions">
          <button className="btn btn-primary" onClick={onSelect}>Ok</button>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        </div>
      }
    </Tooltip>
  );
}
RangeSelectionTooltip.propTypes = {
  start: PropTypes.number,
  end: PropTypes.number,
  xScale: PropTypes.func,
  top: PropTypes.number,
  dateFormat: PropTypes.func,
  offset: PropTypes.number,
  showActions: PropTypes.bool,
  onSelect: PropTypes.func,
  onCancel: PropTypes.func,
};

export default RangeSelectionTooltip;
