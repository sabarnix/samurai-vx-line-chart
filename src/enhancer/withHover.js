import React from 'react';
import ReactDOM from 'react-dom';

export default (BaseComponent) => {
  class WrappedComponent extends React.Component {
    constructor() {
      super();
      this.state = {
        hovered: false,
      };
    }
    componentDidMount() {
      ReactDOM.findDOMNode(this).addEventListener('mouseover', this.onOver.bind(this));
      ReactDOM.findDOMNode(this).addEventListener('mouseout', this.onOut.bind(this));
    }
    componentWillUnmount() {
      ReactDOM.findDOMNode(this).removeEventListener('mouseover', this.onOver);
      ReactDOM.findDOMNode(this).removeEventListener('mouseout', this.onOut);
    }
    onOver() {
      this.setState({ hovered: true });
    }
    onOut() {
      this.setState({ hovered: false });
    }

    render() {
      return (<BaseComponent
        {...this.props}
        hovered={this.state.hovered}
      />);
    }
  }
  return WrappedComponent;
};
