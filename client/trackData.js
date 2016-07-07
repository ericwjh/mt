import DataManager from './DataManager.js'
import {Component} from 'react'
module.exports = global.trackData = {
  componentWillMount() {
    this._dataManager = new DataManager(this)
    this.data = this._dataManager.calculateData()
  },
  componentWillUpdate(nextProps, nextState) {
    const saveProps = this.props;
    const saveState = this.state;
    let newData;
    try {
      // Temporarily assign this.state and this.props,
      // so that they are seen by tracking!
      // This is a simulation of how the proposed Observe API
      // for React will work, which calls observe() after
      // componentWillUpdate and after props and state are
      // updated, but before render() is called.
      // See https://github.com/facebook/react/issues/3398.
      this.props = nextProps;
      this.state = nextState;
      newData = this._dataManager.calculateData();
    } finally {
      this.props = saveProps;
      this.state = saveState;
    }
    this.data = newData
    // this._dataManager.updateData(newData);
  },
  componentWillUnmount() {
    this._dataManager.dispose();
  }
};

class ReactiveComponent extends Component {
  componentWillMount() {
    this._dataManager = new DataManager(this)
    this.data = this._dataManager.calculateData()
  }
  componentWillUpdate(nextProps, nextState) {
    const saveProps = this.props;
    const saveState = this.state;
    let newData;
    try {
      // Temporarily assign this.state and this.props,
      // so that they are seen by tracking!
      // This is a simulation of how the proposed Observe API
      // for React will work, which calls observe() after
      // componentWillUpdate and after props and state are
      // updated, but before render() is called.
      // See https://github.com/facebook/react/issues/3398.
      this.props = nextProps;
      this.state = nextState;
      newData = this._dataManager.calculateData();
    } finally {
      this.props = saveProps;
      this.state = saveState;
    }
    this.data = newData
    // this._dataManager.updateData(newData);
  }
  componentWillUnmount() {
    this._dataManager.dispose();
  }
};
global.ReactiveComponent = ReactiveComponent