import React from 'react';
import PropTypes from 'prop-types';
import HorizontalListWrapper from 'list-wrapper';
import { LinePath, Bar } from '@vx/shape';
import { Group } from '@vx/group';
import { curveCatmullRom } from '@vx/curve';
import { withParentSize } from '@vx/responsive';
import { AxisBottom, AxisLeft, AxisRight } from '@vx/axis';
import { GridRows } from '@vx/grid';
import { TextOutline } from '@vx/text';
import { scaleOrdinal } from '@vx/scale';
import { LegendOrdinal } from '@vx/legend';
import { withTooltip } from '@vx/tooltip';
import { localPoint } from '@vx/event';
import { bisector } from 'd3-array';
import { format } from 'd3-format';
import { Motion, spring } from 'react-motion';
import { timeFormat } from 'd3-time-format';
import { withBrush, BoxBrush } from '@vx/brush';
import throttle from 'lodash.throttle';
import shallowEqual from 'fbjs/lib/shallowEqual';
import { compose } from 'recompose';
import RangeSelectionTooltip from './rangeSelectionTooltip';
import RangeSelectionBars from './rangeSelectionBars';
import withRangeSelection from './enhancer/withRangeSelection';
import HoverLine from './hoverline';
import Tooltips from './tooltips';
import { getXScale, getYScale } from './utils/scales';
import findPathYatX from './utils/findPathYatX';
import Delay from './utils/delay';
import './style.scss';

export class LineChart extends React.PureComponent {
  componentWillMount() {
    this.update();
  }

  componentWillReceiveProps(nextProps) {
    if (!shallowEqual(this.props, nextProps)) {
      this.update(nextProps);
    }
  }

  onMouseMove = (data) => (event) => {
    event.persist();
    this.handleMouseMove(data, event);
  };

  onMouseLeave = () => () => this.props.hideTooltip();

  onMouseDown = (event) => {
    event.persist();
    const { onBrushStart } = this.props;
    onBrushStart(this.localPoint(event));
  };

  onMouseUp = (event) => {
    event.persist();
    const { brush, onBrushReset, onRangeSelect } = this.props;
    if (brush.end && brush.start) {
      onBrushReset(event);
      const start = brush.start.x;
      const end = this.localPoint(event).x;

      onRangeSelect({ x0: this.roundX(Math.min(start, end), 'floor'), x1: this.roundX(Math.max(start, end), 'ceil') });
    } else if (brush.start) {
      onBrushReset(event);
    }
  };

  getSingleChartHeight = (props = this.props) => {
    const { parentHeight, data } = props;
    const { minHeight } = this.getConfig();
    return ((parentHeight - 60) / data.charts.length) < minHeight ? minHeight : (parentHeight - (60 + this.getConfig().margin.bottom)) / data.charts.length;
  };

  getConfig = (props = this.props) => Object.assign({}, this.defaultConfig, props.config);

  getXMax(props = this.props) {
    return props.parentWidth - this.getConfig(props).margin.left - this.getConfig(props).margin.right;
  }

  getYMax(props = this.props) {
    return this.getSingleChartHeight(props) - this.getConfig(props).margin.top;
  }

  getFormattedSeriesData = (data, dates = this.data.dates) => data.map((d, i) => [dates[i], d]);

  setPathRef = (ref) => {
    if (!ref) {
      this.pathRefs = [];
      return;
    }

    this.pathRefs[ref.getAttribute('data-index')] = ref;
  };

  getIndexMap = () => this.data.charts.map(({ chartId, series }) =>
    series.map(({ label }) => `${chartId}-${label}`));

  getPathYFromX = (index, x) => {
    const path = this.pathRefs[index];

    return path && findPathYatX(x, path, index);
  };

  getColorFromPath = (index) => this.pathRefs[index] && this.pathRefs[index].getAttribute('stroke');

  getAxisStyle = () => ({
    hideTicks: true,
    hideAxisLine: true,
    stroke: '#eaf0f6',
    /* tickLabelProps: () => ({
      fill: this.getConfig().tickTextColor || this.getConfig().fontColor,
      fontFamily: this.getConfig().tickTextFontFamily || this.getConfig().fontFamily,
      fontSize: this.getConfig().axisLabelSize,
    }), */
  });

  localPoint = (event) => {
    const { x, ...rest } = localPoint(this.svg, event);
    return { x: Math.max((x - this.getConfig().margin.left), 0), ...rest };
  };

  roundX = (x, precision = 'round') => {
    const { granularity = 1000 * 60 * 60 } = this.props;
    const date = this.xScale.invert(x);
    const timezoneOffset = date.getTimezoneOffset() * 1000 * 60;
    return this.xScale(new Date((Math[precision]((date.getTime() + timezoneOffset) / granularity) * granularity) - timezoneOffset));
  };

  handleRangeSelectOk = (event) => {
    event.stopPropagation();
    const { onRangeSelectClose, range: { start, end }, onRangeChange } = this.props;
    onRangeSelectClose();
    if (onRangeChange) {
      onRangeChange({ start: this.xScale.invert(start), end: this.xScale.invert(end) });
    }
  };

  handleRangeSelectCancel = (event) => {
    event.stopPropagation();
    const { onRangeSelectClose } = this.props;
    onRangeSelectClose();
  };

  isDualAxis = (data = this.data) => data.axes.length === 2;

  defaultConfig = {
    margin: {
      top: 100,
      left: 60,
      bottom: 10,
      right: 50,
    },
    minHeight: 300,
    colors: ['rgb(107, 157, 255)', 'rgb(252, 137, 159)'],
    tooltipTimeFormat: '%b %d, %H:%M',
    tooltipTimeFormatWithoutDate: '%H:%M',
    fontFamily: 'Arial',
    fontColor: 'black',
    axisLabelSize: 10,
  };

  pathRefs = {};

  x = (d) => new Date(d[0]);
  y = (d) => d[1];

  update(props = this.props) {
    const { data } = props;
    if (data) {
      this.xMax = this.getXMax(props);
      this.yMax = this.getYMax(props);
      this.uniqueSeriesLabel = data.charts.reduce((a, c) => c.series.reduce((ai, s) => ai.includes(s.label) ? ai : ai.concat(s.label), a), []);
      this.data = {
        ...data,
        dates: data.dates.map((d) => (d instanceof Date) ? d : new Date(d)),
        charts: data.charts.map(({
          title, series, hasTooltip, chartId = `${title}${new Date().getTime()}`,
        }) => {
          if (this.isDualAxis(data)) {
            const [{ data: seriesLeft = [], label: labelLeft }, { data: seriesRight = [], label: labelRight }] = series;
            return {
              title,
              series,
              hasTooltip,
              chartId,
              labelLeft,
              labelRight,
              yScaleLeft: getYScale(seriesLeft, this.yMax),
              yScaleRight: getYScale(seriesRight, this.yMax),
              leftSeriesData: this.getFormattedSeriesData(seriesLeft, data.dates),
              rightSeriesData: this.getFormattedSeriesData(seriesRight, data.dates),
            };
          }
          const allData = series.reduce((acc, { data: seriesData }) => ([...acc, ...seriesData]), []);
          return {
            title,
            series,
            hasTooltip,
            chartId,
            formattedSeries: series.map(({ data: seriesData, ...rest }) => ({ data: this.getFormattedSeriesData(seriesData, data.dates), ...rest })),
            yScale: getYScale(allData, this.yMax),
          };
        }),
      };
    }

    this.xScale = getXScale(this.data.dates, this.xMax);

    this.legendScale = scaleOrdinal({
      domain: this.uniqueSeriesLabel,
      range: this.getConfig(props).colors,
    });

    this.tooltipTimeFormat = timeFormat(this.getConfig(props).tooltipTimeFormat);
    this.tooltipTimeFormatWithoutDate = timeFormat(this.getConfig(props).tooltipTimeFormatWithoutDate);
  }

  handleMouseMove = throttle((data, event) => {
    const { showTooltip } = this.props;
    const { dates } = this.data;
    const { x: xPoint } = this.localPoint(event);
    const x0 = this.xScale.invert(xPoint);
    const xAxisBisector = bisector((d) => d).left;
    const index = xAxisBisector(dates, x0, 1);
    const d0 = dates[index - 1];
    const d1 = dates[index];
    const effectiveIndex = x0 - d0 > d1 - x0 ? index : index - 1;
    const { brush, onBrushDrag } = this.props;

    if (brush.start && brush.isBrushing) onBrushDrag(this.localPoint(event));

    showTooltip({
      tooltipData: data.charts.map(({ series, hasTooltip }) => ({
        date: (hasTooltip) ? this.tooltipTimeFormatWithoutDate(dates[effectiveIndex]) : this.tooltipTimeFormat(dates[effectiveIndex]),
        data: series.map(({ label, data: seriesData, tooltip = [] }) => ({
          label: (tooltip.length) ? this.tooltipTimeFormat(new Date(tooltip[effectiveIndex])) : label,
          data: seriesData[effectiveIndex],
        })),
      })),
      tooltipLeft: this.xScale(dates[effectiveIndex]),
    });
  }, 100);

  lineDefinedFunc = (d) => d[1] !== null;

  renderLines = ({ title, chartId, ...series }, gIndex) => {
    const height = this.getSingleChartHeight();
    return (
      <Group key={chartId} top={(height * gIndex)}>
        <TextOutline
          fontSize={`${14 / 16}rem`}
          x={this.getConfig().margin.left}
          dy="3rem"
          textAnchor="start"
          fill={this.getConfig().fontColor}
          outlineStroke="white"
          outlineStrokeWidth={1}
          fontFamily={this.getConfig().fontFamily}

        >
          {title}
        </TextOutline>
        {this.isDualAxis() ? this.renderDualAxis(series, gIndex, chartId) : this.renderSingleAxis(series, gIndex, chartId)}
      </Group>
    );
  };

  renderSingleAxis = ({ formattedSeries, yScale }, gIndex, chartId) => [
    <GridRows
      top={this.getConfig().margin.top}
      left={this.getConfig().margin.left}
      scale={yScale}
      numTicks={4}
      width={this.xMax}
    />,
    <Group top={this.getConfig().margin.top} left={this.getConfig().margin.left} key={`${chartId}`}>
      {formattedSeries.map(({ label, data: seriesData }) => this.renderLine(seriesData, yScale, `${chartId}-${label}`, label))}
    </Group>,
    <AxisLeft
      top={this.getConfig().margin.top}
      left={this.getConfig().margin.left}
      scale={yScale}
      numTicks={4}
      tickFormat={format('.0s')}
      {...this.getAxisStyle()}
    />,
  ];

  renderDualAxis = ({
    yScaleLeft, yScaleRight, leftSeriesData, rightSeriesData, labelLeft, labelRight,
  }, gIndex, chartId) => {
    const { parentWidth } = this.props;
    return [
      <GridRows
        top={this.getConfig().margin.top}
        left={this.getConfig().margin.left}
        scale={yScaleLeft}
        numTicks={4}
        width={this.xMax}
      />,
      <Group left={this.getConfig().margin.left} top={this.getConfig().margin.top} key={`${chartId}`}>
        {this.renderLine(leftSeriesData, yScaleLeft, `${chartId}-${labelLeft}`, labelLeft)}
        {this.renderLine(rightSeriesData, yScaleRight, `${chartId}-${labelRight}`, labelRight)}
      </Group>,
      <AxisLeft
        top={this.getConfig().margin.top}
        left={this.getConfig().margin.left}
        scale={yScaleLeft}
        numTicks={4}
        tickFormat={format('.0s')}
        {...this.getAxisStyle()}
      />,
      <AxisRight
        top={this.getConfig().margin.top}
        left={parentWidth - this.getConfig().margin.right}
        scale={yScaleRight}
        numTicks={4}
        tickFormat={format('.0s')}
        {...this.getAxisStyle()}
      />,
    ];
  };

  renderLine = (seriesData, yScale, id, label) => (
    <LinePath
      key={id}
      data-index={id}
      data={seriesData}
      xScale={this.xScale}
      yScale={yScale}
      x={this.x}
      y={this.y}
      defined={this.lineDefinedFunc}
      stroke={this.legendScale(label)}
      strokeLinecap="round"
      curve={curveCatmullRom}
      innerRef={this.setPathRef}
    />
  );

  render() {
    const {
      parentWidth,
      parentHeight,
      tooltipData,
      tooltipLeft,
      brush,
      range,
    } = this.props;

    if (!this.data) {
      return null;
    }

    const width = parentWidth;
    const height = this.getSingleChartHeight();

    const arrowStyle = {
      height: '20px',
      width: '20px',
      backgroundColor: '#f5f5f5',
      marginTop: '-5px',
      marginBottom: '5px',
    };

    return (
      <div style={{ background: '#fff' }}>
        <HorizontalListWrapper parentWidth={parentWidth} rightOffset={85} isVisible arrowStyle={arrowStyle} wrapperClassName="list-wrapper-prop">
          <LegendOrdinal
            scale={this.legendScale}
            direction="row"
            labelMargin="0 15px 0 0"
            style={{
              display: 'flex', maxWidth: `${parentWidth - 85}px`, whiteSpace: 'nowrap', overflow: 'hidden', marginLeft: '35px',
            }}

          />
        </HorizontalListWrapper>
        <div
          id="charts"
          style={{
            height: parentHeight - 30 - 30, overflowY: 'auto', overflowX: 'hidden', cursor: 'crosshair',
          }}
        >
          <div style={{ position: 'relative', height: height * this.data.charts.length }}>
            <svg
              width={width}
              height={(height * this.data.charts.length) + this.getConfig().margin.bottom}
              ref={(s) => { this.svg = s; }}
              onMouseDown={this.onMouseDown}
              onMouseUp={this.onMouseUp}
            >
              <rect x={0} y={0} width={width} height={height * this.data.charts.length} fill="white" />
              {this.data.charts.map(this.renderLines)}
              <Group left={this.getConfig().margin.left}>
                {brush.start && brush.end &&
                  <BoxBrush
                    brush={{ ...brush, start: { ...brush.start, y: 0 }, end: { ...brush.end, y: height * this.data.charts.length } }}
                    fill="none"
                    stroke="rgba(0, 0, 0, .7)"
                    strokeDasharray="10 5"
                  />
                }
                <RangeSelectionBars range={range} height={height * this.data.charts.length} xMax={this.xMax} />
              </Group>
              <Bar
                data={this.data}
                width={width}
                height={height * this.data.charts.length}
                fill="transparent"
                onMouseLeave={this.onMouseLeave}
                onMouseMove={this.onMouseMove}
              />
              <Delay initial={0} value={width} period={300}>
                {(delayed) => (
                  <Motion defaultStyle={{ x: 0 }} style={{ x: spring(delayed) }}>
                    {(style) => (
                      <rect
                        x={style.x}
                        y="0"
                        width={Math.max(width - style.x, 0)}
                        height={height * this.data.charts.length}
                        fill="white"
                      />
                    )}
                  </Motion>
                )}
              </Delay>
              {tooltipData && !brush.isBrushing && !range.isInRangeSelectionMode &&
              <Motion
                defaultStyle={{ left: 0, opacity: 0 }}
                style={{ left: spring(tooltipLeft || 0), opacity: spring(tooltipData ? 1 : 0) }}
              >
                {(style) => (<HoverLine
                  from={{
                    x: style.left,
                    y: 0,
                  }}
                  to={{
                    x: style.left,
                    y: (height * this.data.charts.length) + this.getConfig().margin.bottom,
                  }}
                  tooltipLeft={style.left}
                  indexMap={this.getIndexMap()}
                  getPathYFromX={this.getPathYFromX}
                  getColorFromPath={this.getColorFromPath}
                  margin={this.getConfig().margin}
                  opacity={style.opacity}
                  singleChartHeight={this.getSingleChartHeight()}
                />)}
              </Motion>}
            </svg>
            {tooltipData && !brush.isBrushing && !range.isInRangeSelectionMode &&
              <Motion
                defaultStyle={{ left: 0, opacity: 0 }}
                style={{ left: spring(tooltipLeft || 0), opacity: spring(tooltipData ? 1 : 0) }}
              >
                {(style) => (<Tooltips
                  top={60}
                  left={style.left + this.getConfig().margin.left}
                  data={tooltipData}
                  singleChartHeight={this.getSingleChartHeight()}
                  xMax={this.xMax}
                  opacity={style.opacity}
                  colorScale={this.legendScale}
                />)}
              </Motion>}
          </div>
          {brush.isBrushing && brush.start && brush.end &&
            <RangeSelectionTooltip
              start={this.roundX(brush.start.x, 'floor')}
              end={this.roundX(brush.end.x, 'ceil')}
              dateFormat={this.tooltipTimeFormat}
              offset={this.getConfig().margin.left}
              xScale={this.xScale}
              top={100}
            />}
          {range.isInRangeSelectionMode && !brush.isBrushing &&
            <RangeSelectionTooltip
              start={range.start}
              end={range.end}
              dateFormat={this.tooltipTimeFormat}
              offset={this.getConfig().margin.left}
              xScale={this.xScale}
              showActions
              onSelect={this.handleRangeSelectOk}
              onCancel={this.handleRangeSelectCancel}
              top={100}
            />
          }
        </div>
        <svg width={width} height={30} style={{ background: '#fff' }}>
          <AxisBottom
            top={0}
            left={this.getConfig().margin.left}
            scale={this.xScale}
            numTicks={Math.round(width / 80)}
            {...this.getAxisStyle()}
          />
        </svg>
      </div>
    );
  }
}

LineChart.propTypes = {
  data: PropTypes.object.isRequired,
  // eslint-disable-next-line react/no-unused-prop-types
  config: PropTypes.object,
  parentWidth: PropTypes.number,
  parentHeight: PropTypes.number,
  hideTooltip: PropTypes.func,
  showTooltip: PropTypes.func,
  tooltipData: PropTypes.array,
  tooltipLeft: PropTypes.number,
  onBrushStart: PropTypes.func,
  onBrushReset: PropTypes.func,
  onBrushDrag: PropTypes.func,
  onRangeSelect: PropTypes.func,
  onRangeSelectClose: PropTypes.func,
  onRangeChange: PropTypes.func,
  granularity: PropTypes.number,
  range: PropTypes.object,
  brush: PropTypes.object,
};

export default compose(
  withParentSize,
  withTooltip,
  withBrush,
  withRangeSelection,
)(LineChart);
