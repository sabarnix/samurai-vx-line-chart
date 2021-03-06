import React from 'react';
import PropTypes from 'prop-types';
import HorizontalListWrapper from 'list-wrapper';
import { LinePath, Bar } from '@vx/shape';
import { Group } from '@vx/group';
import { AxisBottom, AxisLeft, AxisRight } from '@vx/axis';
import { GridRows } from '@vx/grid';
import { Text } from '@vx/text';
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
import moize from 'moize';
import shallowEqual from 'fbjs/lib/shallowEqual';
import { compose } from 'recompose';
import commarize from './utils/commarize';
import withParentSize from './enhancer/withParentSize';
import withAnnotation from './enhancer/withAnnotation';
import AnnotationLine from './AnnotationLine';
import AnnotationTimeline from './AnnotationTimeline';
import RangeSelectionTooltipComp from './rangeSelectionTooltip';
import LegendShapeComp from './LegendShape';
import RangeSelectionBarsComp from './rangeSelectionBars';
import withRangeSelection from './enhancer/withRangeSelection';
import withLegendToggle from './enhancer/withLegendToggle';
import HoverLineComp from './hoverline';
import TooltipsComp from './tooltips';
import { getXScale, getYScale } from './utils/scales';
import Delay from './utils/delay';
import './style.scss';

const RangeSelectionTooltip = moize.reactSimple(RangeSelectionTooltipComp);
const LegendShape = moize.reactSimple(LegendShapeComp);
const RangeSelectionBars = moize.reactSimple(RangeSelectionBarsComp);
const HoverLine = moize.reactSimple(HoverLineComp);
const Tooltips = moize.reactSimple(TooltipsComp);

const LEGEND_HEIGHT = 75;
const ANNOTATION_HEIGHT = 80;

export class LineChart extends React.PureComponent {
  componentWillMount() {
    this.update();
  }

  componentWillReceiveProps(nextProps) {
    if (!shallowEqual(this.props, nextProps)) {
      this.update(nextProps);
    }

    if (this.props.data !== nextProps.data || this.props.legendToggle !== nextProps.legendToggle || this.props.hasAnnotation !== nextProps.hasAnnotation) {
      this.resetAllSelection();
    }
  }

  onMouseMove = (data) => (event) => {
    event.persist();
    if (this.props.disableTooltip) return;
    this.handleMouseMove(data, event);
  };

  onMouseLeave = () => compose(this.handleMouseMove.cancel, this.props.hideTooltip);

  onMouseDown = (event) => {
    const { onBrushStart, enableRangeSelection } = this.props;
    if (!enableRangeSelection) return;
    event.persist();
    onBrushStart(this.localPoint(event));
  };

  onMouseUp = (event) => {
    event.persist();
    const {
      brush, onBrushReset, onRangeSelect, enableRangeSelection,
    } = this.props;
    if (!enableRangeSelection) return;
    if (brush.end && brush.start) {
      onBrushReset(event);
      const start = brush.start.x;
      const end = this.localPoint(event).x;
      if (start === end) return;

      onRangeSelect({ x0: this.roundX(Math.min(start, end), 'floor'), x1: this.roundX(Math.max(start, end), 'ceil') });
    } else if (brush.start) {
      onBrushReset(event);
    }
  };

  getOffsetHeight = () => this.props.hasAnnotation ? LEGEND_HEIGHT + ANNOTATION_HEIGHT : LEGEND_HEIGHT;

  getSingleChartHeight = (props = this.props) => {
    const { parentHeight } = props;
    const data = this.data || props.data;
    const { minHeight } = this.getConfig();
    if (!data.charts.length) return 0;
    return Math.max((parentHeight - (this.getOffsetHeight() + this.getConfig().margin.bottom)) / data.charts.length, minHeight);
  };


  getConfig = (props = this.props) => {
    const config = { ...this.defaultConfig, ...props.config };
    if (this.isDualAxis()) {
      const { margin } = config;
      return { ...config, margin: { ...margin, left: margin.left + 20, right: margin.right + 20 } };
    }

    return config;
  }

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

  getColorFromPath = (index) => this.pathRefs[index] && this.pathRefs[index].getAttribute('stroke');

  getAxisStyle = (position = 'left') => ({
    hideTicks: true,
    hideAxisLine: true,
    stroke: this.getConfig().axisStroke,
    tickLabelProps: (value) => ({
      fill: this.getConfig().tickTextColor || this.getConfig().fontColor,
      fontFamily: this.getConfig().tickTextFontFamily || this.getConfig().fontFamily,
      fontSize: (position === 'bottom' && this.shouldXAxisHighlight(value)) ? this.getConfig().axisLabelSize * 1.1 : this.getConfig().axisLabelSize,
      // eslint-disable-next-line no-nested-ternary
      fontWeight: (position === 'bottom') ? (this.shouldXAxisHighlight(value) ? 800 : 300) : undefined,
      dx: '-0.25em',
      dy: ['left', 'right'].includes(position) ? '0.25em' : '',
      // eslint-disable-next-line no-nested-ternary
      textAnchor: (position === 'left') ? 'end' : (position === 'right') ? 'start' : 'middle',
    }),
  });

  formatYAxisTick = (num) => num < 1 ? num.toFixed(2) : commarize(num);

  shouldXAxisHighlight = (date) => {
    const dateDiff = (this.data.dates[this.data.dates.length - 1].getTime() - this.data.dates[0].getTime()) / (1000 * 60 * 60);
    if (dateDiff > (15 * 24)) {
      return date.getDay() === 2;
    } else if (dateDiff > 24) {
      return date.getHours() === 0;
    }
    return date.getMinutes() === 0;
  }

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

  isDualAxis = (data = this.data) => data && data.isDualAxes;

  defaultConfig = {
    margin: {
      top: 70,
      left: 60,
      bottom: 10,
      right: 50,
    },
    minHeight: 240,
    colors: ['rgb(107, 157, 255)', 'rgb(252, 137, 159)'],
    tooltipTimeFormat: '%b %d, %H:%M',
    tooltipTimeFormatWithoutDate: '%H:%M',
    fontFamily: 'Arial',
    fontColor: 'black',
    axisLabelSize: 10,
    legendBg: '#eee',
    legendShape: LegendShape,
    hoverlineColor: 'black',
    axesLabelColor: 'black',
    axisStroke: '#eaf0f6',
    annotation: {
      stroke: '#535353',
      strokeWidth: '1',
      style: {
        opacity: '.5',
        cursor: 'pointer',
      },
    },
    annotationCircle: {
      color: '#575d6d',
      activeColor: '#eb5b59',
      highlightColor: '#62CCA8',
      shouldHighlight: (data) => data.ci,
    },
    annotationHover: {
      strokeWidth: '4',
      style: {
        opacity: '.8',
        cursor: 'pointer',
      },
    },
    annotationActive: {
      stroke: 'yellow',
    },
  };

  pathRefs = {};

  x = (d) => new Date(d[0]);
  y = (d) => d[1];

  update(props = this.props) {
    const { data, legendToggle = [] } = props;
    if (data) {
      this.uniqueSeriesLabel = data.charts.reduce((a, c) => c.series.reduce((ai, s) => ai.includes(s.label) ? ai : ai.concat(s.label), a), []);
      let visibleData = { ...data };
      if (legendToggle) {
        visibleData = {
          ...visibleData,
          axes: visibleData.axes.filter((axis) => !legendToggle.includes(axis)),
          charts: visibleData.charts.reduce((chartsAcc, { series, id, ...restCharts }) => {
            const visibleSeries = series.reduce((seriesAcc, { label, ...restSeries }) => legendToggle.includes(label) ? seriesAcc : [...seriesAcc, { label, ...restSeries }], []);
            if (!visibleSeries.length) return chartsAcc;
            return ([...chartsAcc, {
              ...restCharts,
              id: `${id}-${legendToggle.length}`,
              series: visibleSeries,
            }]);
          }, []),
        };
      }
      this.xMax = this.getXMax({ ...props, data: visibleData });
      this.yMax = this.getYMax({ ...props, data: visibleData });
      this.data = {
        ...visibleData,
        dates: visibleData.dates.map((d) => (d instanceof Date) ? d : new Date(d)),
        charts: visibleData.charts.map(({
          title, series, hasTooltip, id: chartId,
        }) => {
          if (this.isDualAxis(visibleData)) {
            const [{ data: seriesLeft = [], label: labelLeft }, { data: seriesRight = [], label: labelRight } = {}] = series;
            return {
              title,
              series,
              hasTooltip,
              chartId,
              labelLeft,
              labelRight,
              yScaleLeft: getYScale(seriesLeft, this.yMax),
              yScaleRight: getYScale(seriesRight, this.yMax),
              leftSeriesData: this.getFormattedSeriesData(seriesLeft, visibleData.dates),
              rightSeriesData: this.getFormattedSeriesData(seriesRight, visibleData.dates),
            };
          }
          const allData = series.reduce((acc, { data: seriesData }) => ([...acc, ...seriesData]), []);
          return {
            title,
            series,
            hasTooltip,
            chartId,
            formattedSeries: series.map(({ data: seriesData, ...rest }) => ({ data: this.getFormattedSeriesData(seriesData, visibleData.dates), ...rest })),
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

  resetAllSelection = () => {
    this.props.hideTooltip();
    this.props.onRangeSelectClose();
  };

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
      tooltipData: data.charts.map(({ series, hasTooltip, chartId }) => ({
        id: `${chartId}-tooltip`,
        date: (hasTooltip) ? this.tooltipTimeFormatWithoutDate(dates[effectiveIndex]) : this.tooltipTimeFormat(dates[effectiveIndex]),
        data: series.map(({ label, data: seriesData, tooltip = [] }) => ({
          label: String((tooltip.length) ? this.tooltipTimeFormat(new Date(tooltip[effectiveIndex])) : label),
          data: String(seriesData[effectiveIndex]),
          series: String(label),
        })),
      })),
      tooltipLeft: this.xScale(dates[effectiveIndex]),
      tooltipTop: data.charts.map(({
 yScale, series, yScaleLeft, yScaleRight
}) => series.map(({ data: seriesData }, isRightSeries) => data.isDualAxes ? (isRightSeries ? yScaleRight(seriesData[effectiveIndex]) : yScaleLeft(seriesData[effectiveIndex])) : yScale(seriesData[effectiveIndex]))), // eslint-disable-line no-nested-ternary
    });
  }, 100);

  handleLegendClick = (data) => () => {
    const { onToggleLegend } = this.props;
    onToggleLegend(data.datum);
  };

  lineDefinedFunc = (d) => d[1] !== null;

  renderLines = ({ title, chartId, ...series }, gIndex) => {
    const height = this.getSingleChartHeight();
    return (
      <Group key={`${chartId}-${gIndex}`} top={(height * gIndex)}>
        <Text
          fontSize={14}
          x={this.getConfig().margin.left}
          y={this.getConfig().margin.top - 15}
          textAnchor="start"
          fill={this.getConfig().fontColor}
          fontFamily={this.getConfig().fontFamily}
          fontWeight="bold"
        >
          {title}
        </Text>
        {this.isDualAxis() ? this.renderDualAxis(series, gIndex, chartId) : this.renderSingleAxis(series, gIndex, chartId)}
      </Group>
    );
  };

  renderSingleAxis = ({ formattedSeries, yScale }, gIndex, chartId) => [
    <GridRows
      top={this.getConfig().margin.top}
      left={this.getConfig().margin.left}
      scale={yScale}
      numTicks={5}
      width={this.xMax}
    />,
    <Group top={this.getConfig().margin.top} left={this.getConfig().margin.left} key={`${chartId}-single-axis`}>
      {formattedSeries.map(({ label, data: seriesData }) => this.renderLine(seriesData, yScale, `${chartId}-${label}`, label))}
    </Group>,
    <AxisLeft
      top={this.getConfig().margin.top}
      left={this.getConfig().margin.left}
      scale={yScale}
      numTicks={5}
      tickFormat={this.formatYAxisTick}
      {...this.getAxisStyle('left')}
      labelProps={{
        fill: this.getConfig().axesLabelColor,
      }}
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
        numTicks={5}
        width={this.xMax}
        key={`${chartId}-grid-row`}
      />,
      <Group left={this.getConfig().margin.left} top={this.getConfig().margin.top} key={`${chartId}-dual-axis`}>
        {this.renderLine(leftSeriesData, yScaleLeft, `${chartId}-${labelLeft}`, labelLeft)}
        {this.renderLine(rightSeriesData, yScaleRight, `${chartId}-${labelRight}`, labelRight)}
      </Group>,
      <AxisLeft
        top={this.getConfig().margin.top}
        left={this.getConfig().margin.left}
        scale={yScaleLeft}
        numTicks={5}
        tickFormat={this.formatYAxisTick}
        {...this.getAxisStyle('left')}
        label={labelLeft}
        labelProps={{
          fontFamily: this.getConfig().fontFamily, fontSize: '12', fill: this.getConfig().axesLabelColor, textAnchor: 'middle',
        }}
        key={`${chartId}-axis-left`}
      />,
      <AxisRight
        top={this.getConfig().margin.top}
        left={parentWidth - this.getConfig().margin.right}
        scale={yScaleRight}
        numTicks={5}
        tickFormat={this.formatYAxisTick}
        key={`${chartId}-axis-right`}
        label={labelRight}
        labelProps={{
          fontFamily: this.getConfig().fontFamily, fontSize: '12', fill: this.getConfig().axesLabelColor, textAnchor: 'middle',
        }}
        labelOffset={35}
        {...this.getAxisStyle('right')}
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
      innerRef={this.setPathRef}
    />
  );

  render() {
    const {
      parentWidth,
      parentHeight,
      tooltipData,
      tooltipLeft,
      tooltipTop,
      brush,
      range,
      legendToggle,
      renderAnnotation,
      hasAnnotation,
      renderAnnotationTooltip,
      renderAnnotationTimeline,
    } = this.props;

    if (!this.data) {
      return null;
    }

    if (range && range.end) {
      range.end = Math.min(range.end, this.xMax);
    }

    const width = parentWidth;
    const height = this.getSingleChartHeight();

    const arrowStyle = {
      height: '20px',
      width: '20px',
      backgroundColor: '#f5f5f5',
    };

    return (
      <div style={{ background: '#fff' }}>
        <div style={{ background: '#eee' }}>
          <HorizontalListWrapper parentWidth={parentWidth} rightOffset={85} isVisible arrowStyle={arrowStyle} wrapperClassName="list-wrapper-prop">
            <LegendOrdinal
              scale={this.legendScale}
              direction="row"
              labelMargin="0 15px 0 0"
              className="samurai-vx-legend"
              onClick={this.handleLegendClick}
              style={{
                display: 'flex', maxWidth: `${parentWidth - 85}px`, whiteSpace: 'nowrap', overflow: 'hidden', marginLeft: '35px', padding: '15px 0', cursor: 'pointer',
              }}
              fill={({ datum, text }) => legendToggle.map((_) => String(_)).includes(text) ? '#cecece' : this.legendScale(datum)}
              shape={this.getConfig().legendShape}
              shapeWidth={10}
              shapeHeight={10}
              domain={this.uniqueSeriesLabel}
              labelTransform={({ scale, labelFormat }) => (datum, index) => ({
                datum, index, text: datum === undefined ? '' : `${labelFormat(datum, index)}`, value: scale(datum),
              })}
            />
          </HorizontalListWrapper>
        </div>
        {hasAnnotation && renderAnnotationTimeline()}
        <div
          id="charts"
          style={{
            height: parentHeight - this.getOffsetHeight(), overflowY: 'auto', overflowX: 'hidden', cursor: 'crosshair',
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
              <HoverLine
                from={{
                  x: tooltipLeft,
                  y: 0,
                }}
                to={{
                  x: tooltipLeft,
                  y: (height * this.data.charts.length) + this.getConfig().margin.bottom,
                }}
                tooltipData={tooltipData}
                tooltipLeft={tooltipLeft}
                tooltipTop={tooltipTop}
                indexMap={this.getIndexMap()}
                getColorFromPath={this.getColorFromPath}
                margin={this.getConfig().margin}
                opacity={tooltipData ? 1 : 0}
                singleChartHeight={this.getSingleChartHeight()}
                hoverlineColor={this.getConfig().hoverlineColor}
              />}
              {hasAnnotation && renderAnnotation()}
            </svg>
            {tooltipData && !brush.isBrushing && !range.isInRangeSelectionMode &&
            <Tooltips
              top={80}
              left={tooltipLeft + this.getConfig().margin.left}
              data={tooltipData}
              singleChartHeight={this.getSingleChartHeight()}
              xMax={this.xMax}
              opacity={tooltipData ? 1 : 0}
              colorScale={this.legendScale}
            />}
          </div>
          {brush.isBrushing && brush.start && brush.end &&
            <RangeSelectionTooltip
              start={this.roundX(brush.start.x, 'floor')}
              end={this.roundX(brush.end.x, 'ceil')}
              dateFormat={this.tooltipTimeFormat}
              offset={this.getConfig().margin.left}
              xScale={this.xScale}
              top={70}
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
              top={70}
            />
          }
          {hasAnnotation && renderAnnotationTooltip()}
        </div>
        <svg width={width} height={30} style={{ background: '#fff' }}>
          <AxisBottom
            top={0}
            left={this.getConfig().margin.left}
            scale={this.xScale}
            numTicks={Math.round(width / 80)}
            {...this.getAxisStyle('bottom')}
          />
        </svg>
      </div>
    );
  }
}

LineChart.defaultProps = {
  enableRangeSelection: false,
};

LineChart.propTypes = {
  data: PropTypes.object.isRequired,
  enableRangeSelection: PropTypes.bool,
  // eslint-disable-next-line react/no-unused-prop-types
  config: PropTypes.object,
  tooltipTop: PropTypes.array,
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
  onToggleLegend: PropTypes.func,
  legendToggle: PropTypes.array,
  renderAnnotation: PropTypes.func,
  hasAnnotation: PropTypes.bool,
  renderAnnotationTooltip: PropTypes.func,
  renderAnnotationTimeline: PropTypes.func,
  disableTooltip: PropTypes.bool,
};

export default compose(
  withParentSize,
  withTooltip,
  withBrush,
  withLegendToggle,
  withRangeSelection,
  withAnnotation({ AnnotationComponent: AnnotationLine, AnnotationTimelineComponent: AnnotationTimeline }),
)(LineChart);
