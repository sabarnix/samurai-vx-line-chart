import React from 'react';
import PropTypes from 'prop-types';

class Delay extends React.Component {
  state = {
    value: this.props.initial,
  }

  componentDidMount() {
    this.refresh(this.props);
  }

  componentWillReceiveProps() {
    // if (!this.unmounting) {
    //   this.refresh(next)
    // }
  }

  componentWillUnmount() {
    this.unmounting = true;

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = 0;
    }
  }

  refresh(props) {
    const { value, period } = props;

    this.timeout = setTimeout(() => this.setState({
      value,
    }), period);
  }

  render() {
    return this.props.children(this.state.value);
  }
}

Delay.defaultProps = {
  period: 0,
};

Delay.propTypes = {
  children: PropTypes.node,
  // eslint-disable-next-line react/no-unused-prop-types
  period: PropTypes.number,
  initial: PropTypes.number,
};

export default Delay;
