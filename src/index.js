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
import HoverLine from './hoverline';
import Tooltips from './tooltips';
import { getXScale, getYScale } from './utils/scales';
import findPathYatX from './utils/findPathYatX';
import Delay from './utils/delay';
require('./style.scss');

const axisLeftTickLabel = (
  <text
    fill="rgb(25, 29, 34)"
    opacity="0.20"
    fontSize={10}
    dy="0.25em"
    textAnchor="middle"
    fontWeight="bold"
  />
);

const axisBottomTickLabel = (
  <text
    fill="rgb(25, 29, 34)"
    opacity="0.20"
    fontSize={10}
    dy="0.25em"
    textAnchor="middle"
    fontWeight="bold"
  />
);

export class LineChart extends React.PureComponent {
  componentWillMount() {
    this.update();
  }

  componentWillReceiveProps(nextProps) {
    this.update(nextProps);
  }

  onMouseMove = (data) => (event) => {
    const { showTooltip } = this.props;
    const { dates } = this.data;
    const { x: xPoint } = localPoint(this.svg, event);
    const x0 = this.xScale.invert(xPoint - this.getConfig().margin.left);
    const xAxisBisector = bisector((d) => d).left;
    const index = xAxisBisector(dates, x0, 1);
    const d0 = dates[index - 1];
    const d1 = dates[index];
    const effectiveIndex = x0 - d0 > d1 - x0 ? index : index - 1;

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
  };

  onMouseLeave = () => () => this.props.hideTooltip();

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

  getIndexMap = () => this.data.charts.map(({ title, series }) =>
    series.map(({ label }) => `${title}-${label}`));

  getPathYFromX = (index, x) => {
    const path = this.pathRefs[index];

    return path && findPathYatX(x, path, index);
  };

  getColorFromPath = (index) => this.pathRefs[index] && this.pathRefs[index].getAttribute('stroke');

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
        dates: data.dates.map((d) => new Date(d)),
        charts: data.charts.map(({ title, series, hasTooltip }) => {
          if (this.isDualAxis(data)) {
            const [{ data: seriesLeft = [], label: labelLeft }, { data: seriesRight = [], label: labelRight }] = series;
            return {
              title,
              series,
              hasTooltip,
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

  isDualAxis = (data = this.data) => data.axes.length === 2;

  defaultConfig = {
    margin: {
      top: 30,
      left: 60,
      bottom: 30,
      right: 50,
    },
    minHeight: 300,
    colors: ['rgb(107, 157, 255)', 'rgb(252, 137, 159)'],
    tooltipTimeFormat: '%b %d, %H:%M',
    tooltipTimeFormatWithoutDate: '%H:%M',
  };

  lineDefinedFunc = (d) => {
    if (d[1] !== null) {
      return true;
    }
    return false;
  };

  renderLines = ({ title, ...series }, gIndex) => {
    const height = this.getSingleChartHeight();
    return (
      <Group key={title} top={(height * gIndex)}>
        <TextOutline
          fontSize={12}
          x={this.getConfig().margin.left}
          dy="2em"
          textAnchor="start"
          fill="black"
          outlineStroke="white"
          outlineStrokeWidth={3}
        >
          {title}
        </TextOutline>
        {this.isDualAxis() ? this.renderDualAxis(series, gIndex, title) : this.renderSingleAxis(series, gIndex, title)}
      </Group>
    );
  };

  renderSingleAxis = ({ formattedSeries, yScale }, gIndex, title) => [
    <GridRows
      top={this.getConfig().margin.top}
      left={this.getConfig().margin.left}
      scale={yScale}
      numTicks={3}
      width={this.xMax}
    />,
    <Group top={this.getConfig().margin.top} left={this.getConfig().margin.left}>
      {formattedSeries.map(({ label, data: seriesData }) => this.renderLine(seriesData, yScale, `${title}-${label}`, label))}
    </Group>,
    <AxisLeft
      top={this.getConfig().margin.top}
      left={this.getConfig().margin.left}
      scale={yScale}
      hideTicks
      hideAxisLine
      numTicks={4}
      tickFormat={format('.0s')}
      stroke="#eaf0f6"
      tickLabelComponent={axisLeftTickLabel}
    />,
  ];

  renderDualAxis = ({
    yScaleLeft, yScaleRight, leftSeriesData, rightSeriesData, labelLeft, labelRight,
  }, gIndex, title) => {
    const { parentWidth } = this.props;
    return [
      <GridRows
        top={this.getConfig().margin.top}
        left={this.getConfig().margin.left}
        scale={yScaleLeft}
        numTicks={4}
        width={this.xMax}
      />,
      <Group left={this.getConfig().margin.left} top={this.getConfig().margin.top}>
        {this.renderLine(leftSeriesData, yScaleLeft, `${title}-${labelLeft}`, labelLeft)}
        {this.renderLine(rightSeriesData, yScaleRight, `${title}-${labelRight}`, labelRight)}
      </Group>,
      <AxisLeft
        top={this.getConfig().margin.top}
        left={this.getConfig().margin.left}
        scale={yScaleLeft}
        hideTicks
        hideAxisLine
        numTicks={4}
        tickFormat={format('.0s')}
        stroke="#eaf0f6"
        tickLabelComponent={axisLeftTickLabel}
      />,
      <AxisRight
        top={this.getConfig().margin.top}
        left={parentWidth - this.getConfig().margin.right}
        scale={yScaleRight}
        hideTicks
        hideAxisLine
        numTicks={4}
        tickFormat={format('.0s')}
        stroke="#eaf0f6"
        tickLabelComponent={axisLeftTickLabel}
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
            <svg width={width} height={(height * this.data.charts.length) + this.getConfig().margin.bottom} ref={(s) => { this.svg = s; }}>
              <rect x={0} y={0} width={width} height={height * this.data.charts.length} fill="white" />
              {this.data.charts.map(this.renderLines)}
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
              {tooltipData &&
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
                    y: height * this.data.charts.length,
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
            {tooltipData &&
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
        </div>
        <svg width={width} height={30} style={{ background: '#fff' }}>
          <AxisBottom
            top={0}
            left={this.getConfig().margin.left}
            scale={this.xScale}
            hideTicks
            stroke="#eaf0f6"
            tickLabelComponent={axisBottomTickLabel}
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
};

export default withParentSize(withTooltip(LineChart));
