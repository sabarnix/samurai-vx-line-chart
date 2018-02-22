import React from 'react';
import { Line } from '@vx/shape';
import { Group } from '@vx/group';
import PropTypes from 'prop-types';

function Hoverline({
  from, to, tooltipLeft, indexMap, getPathYFromX, margin, singleChartHeight, opacity, getColorFromPath,
}) {
  return (
    <Group style={{ opacity }} left={margin.left}>
      <Line
        from={from}
        to={to}
        stroke="black"
        strokeWidth={1}
        style={{ pointerEvents: 'none' }}
        strokeDasharray="2,2"
      />
      {
        indexMap.map((charts, gIndex) => (
          <Group top={(singleChartHeight * gIndex) + margin.top}>
            <Group>
              {charts.map((chartIndex) => [
                <circle
                  key={`${chartIndex}-outer`}
                  cx={tooltipLeft}
                  cy={getPathYFromX(chartIndex, tooltipLeft)}
                  r={12}
                  fill={getColorFromPath(chartIndex)}
                  stroke={getColorFromPath(chartIndex)}
                  style={{ pointerEvents: 'none' }}
                  fillOpacity={opacity / 12}
                  strokeOpacity={opacity / 2}
                  strokeWidth=".6"
                />,
                <circle
                  key={`${chartIndex}-inner`}
                  cx={tooltipLeft}
                  cy={getPathYFromX(chartIndex, tooltipLeft)}
                  r={4}
                  fill="white"
                  stroke={getColorFromPath(chartIndex)}
                  strokeWidth="1.5"
                  fillOpacity={opacity}
                  strokeOpacity={opacity}
                  style={{ pointerEvents: 'none' }}
                />,
              ])}
            </Group>
          </Group>))
      }
    </Group>
  );
}
Hoverline.propTypes = {
  from: PropTypes.object,
  to: PropTypes.object,
  tooltipLeft: PropTypes.number,
  indexMap: PropTypes.array,
  getPathYFromX: PropTypes.func,
  getColorFromPath: PropTypes.func,
  margin: PropTypes.object,
  singleChartHeight: PropTypes.number,
  opacity: PropTypes.number,
};

export default Hoverline;
