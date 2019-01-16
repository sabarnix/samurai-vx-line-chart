import React from 'react';
import { Line } from '@vx/shape';
import { Group } from '@vx/group';
import PropTypes from 'prop-types';

function Hoverline({
  from, to, tooltipLeft, indexMap, margin, singleChartHeight, opacity, getColorFromPath,
  tooltipData, hoverlineColor, tooltipTop,
}) {
  return (
    <Group style={{ opacity }} left={margin.left}>
      <Line
        from={from}
        to={to}
        stroke={hoverlineColor}
        strokeWidth={1}
        style={{ pointerEvents: 'none' }}
        strokeDasharray="2,2"
      />
      {
        indexMap.map((charts, gIndex) => (
          <Group top={(singleChartHeight * gIndex) + margin.top}>
            { charts.map((chartIndex, seriesIndex) => !tooltipData[gIndex] || !tooltipData[gIndex].data || !tooltipData[gIndex].data[seriesIndex] || [null, undefined, 'null', 'undefined'].includes(tooltipData[gIndex].data[seriesIndex].data) ? [] : [
              <circle
                key={`${chartIndex}-outer`}
                cx={tooltipLeft}
                cy={tooltipTop[gIndex][seriesIndex]}
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
                cy={tooltipTop[gIndex][seriesIndex]}
                r={4}
                fill="white"
                stroke={getColorFromPath(chartIndex)}
                strokeWidth="1.5"
                fillOpacity={opacity}
                strokeOpacity={opacity}
                style={{ pointerEvents: 'none' }}
              />,
            ])}
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
  getColorFromPath: PropTypes.func,
  margin: PropTypes.object,
  singleChartHeight: PropTypes.number,
  opacity: PropTypes.number,
  tooltipData: PropTypes.array.isRequired,
  hoverlineColor: PropTypes.string,
  tooltipTop: PropTypes.array,
};

export default Hoverline;
