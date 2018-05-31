import React from 'react';
import PropTypes from 'prop-types';
import { Group } from '@vx/group';
import { compose, withState, withHandlers } from 'recompose';

export default ({ AnnotationComponent, AnnotationTimelineComponent }) => (BaseComponent) => {
  class WrappedComponent extends React.Component {
    componentWillReceiveProps(nextProps) {
      if (!nextProps.annotation && nextProps.annotationSelection.hasActiveAnnotation) {
        this.props.closeActive();
      }
    }

    setRef = (chart) => {
      this.chart = chart;
    }

    getAnnotationLeft = (timestamp) => this.chart.xScale(timestamp);

    handleClick = (index) => {
      const { annotationSelection: { activeAnnotation }, updateActive, closeActive } = this.props;
      if (index === activeAnnotation) {
        closeActive();
      } else {
        updateActive(index);
      }
    }

    renderAnnotation = () => {
      const height = (this.chart.getSingleChartHeight() * this.chart.data.charts.length) + this.chart.getConfig().margin.bottom;
      const { annotation, annotationSelection: { activeAnnotation, hasActiveAnnotation } } = this.props;
      if (annotation && annotation.length && AnnotationComponent && hasActiveAnnotation) {
        const { timestamp } = annotation[activeAnnotation];
        return (
          <Group className="annotation">
            <AnnotationComponent
              height={height}
              left={this.getAnnotationLeft(timestamp)}
              margin={this.chart.getConfig().margin}
              style={this.chart.getConfig().annotation}
            />
          </Group>
        );
      }
      return null;
    }

    renderAnnotationTooltip = () => {
      const {
        annotation,
        annotationSelection: { activeAnnotation: activeAnnotationIndex, hasActiveAnnotation },
        closeActive,
        annotationTooltipComponent: AnnotationTooltipComponent,
      } = this.props;
      if (!hasActiveAnnotation) return null;
      const activeAnnotation = annotation[activeAnnotationIndex];
      if (!activeAnnotation) return null;
      return (<AnnotationTooltipComponent
        data={activeAnnotation.data}
        left={this.getAnnotationLeft(activeAnnotation.timestamp) + this.chart.getConfig().margin.left}
        date={this.chart.tooltipTimeFormat(activeAnnotation.timestamp)}
        top={102}
        xMax={this.chart.xMax}
        opacity={1}
        id={activeAnnotation}
        closeTooltip={closeActive}
      />);
    }

    renderAnnotationTimeline = () => {
      const { parentWidth, annotation, annotationSelection: { activeAnnotation } } = this.props;
      return (
        <svg height={80} width={parentWidth}>
          <AnnotationTimelineComponent
            xMax={this.chart.xMax}
            config={this.chart.getConfig()}
            annotations={annotation}
            xScale={this.chart.xScale}
            onClick={this.handleClick}
            active={activeAnnotation}
          />
        </svg>
      );
    }

    render() {
      let annotationProps = {};

      if (this.chart && this.props.annotation) {
        annotationProps = {
          renderAnnotation: this.renderAnnotation, hasAnnotation: true, renderAnnotationTooltip: this.renderAnnotationTooltip, renderAnnotationTimeline: this.renderAnnotationTimeline,
        };
      }

      if (this.props.annotationSelection && this.props.annotationSelection.hasActiveAnnotation) {
        annotationProps = { ...annotationProps, disableTooltip: true, enableRangeSelection: false };
      }

      return (<BaseComponent
        ref={this.setRef}
        {...this.props}
        {...annotationProps}
      />);
    }
  }


  WrappedComponent.propTypes = {
    annotation: PropTypes.array,
    annotationSelection: PropTypes.object,
    updateActive: PropTypes.func,
    closeActive: PropTypes.func,
    parentWidth: PropTypes.number,
    annotationTooltipComponent: PropTypes.func,
  };

  return compose(
    withState('annotationSelection', 'setActive', {
      hasActiveAnnotation: false,
      activeAnnotation: -1,
    }),
    withHandlers({
      updateActive: ({ setActive }) => (index) => setActive((previousState) => ({
        ...previousState,
        activeAnnotation: index,
        hasActiveAnnotation: true,
      })),
      closeActive: ({ setActive }) => () => setActive((previousState) => ({
        ...previousState,
        activeAnnotation: -1,
        hasActiveAnnotation: false,
      })),
    })
  )(WrappedComponent);
};
