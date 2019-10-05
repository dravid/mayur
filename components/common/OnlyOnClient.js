import React, { Component } from 'react';
import PropTypes from 'prop-types';

class OnlyOnClient extends Component {
  static propTypes = {
    placeholder: PropTypes.node,
    html: PropTypes.string
  };

  state = {
    onClient: false
  };

  shouldComponentUpdate() {
    return !this.state.onClient;
  }

  componentDidMount() {
    this.setState({
      onClient: true
    });
  }

  render() {
    if (!this.state.onClient) {
      return this.props.placeholder;
    }

    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

export default OnlyOnClient;