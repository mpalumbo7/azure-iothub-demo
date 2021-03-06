import React from 'react';
import { connect } from 'react-redux';
// Components
import DeviceChart from '../components/DeviceChart/DeviceChart';
import DashboardMetric from '../components/DashboardMetric/DashboardMetric';
// Actions
import { getDevice, getTwin, updateTwin, openConnection, closeConnection, initMessages, clearMessages } from '../redux/modules/device';

// Map store state to component's properties
const mapStateToProps = state => ({
  device: state.device.active,
  twin: state.device.twin,
  isConnected: state.device.isConnected,
  messages: state.device.messages,
  messagesLoading: state.device.messagesLoading,
});

// Map actions to component's properties
const mapDispatchToProps = dispatch => ({
  getDevice: (deviceId) => {
    dispatch(getDevice(deviceId));
  },
  getTwin: (deviceId) => {
    dispatch(getTwin(deviceId));
  },
  updateTwin: (deviceId, patch) => {
    dispatch(updateTwin(deviceId, patch));
  },
  initMessages: (deviceId, hours) => {
    dispatch(initMessages(deviceId, hours));
  },
  openConnection: () => {
    dispatch(openConnection());
  },
  closeConnection: () => {
    dispatch(closeConnection());
  },
  clearMessages: () => {
    dispatch(clearMessages());
  },
});

@connect(mapStateToProps, mapDispatchToProps)
export default class Device extends React.Component {
  static propTypes = {
    params: React.PropTypes.object.isRequired,
    location: React.PropTypes.object.isRequired,
    device: React.PropTypes.object,
    twin: React.PropTypes.object,
    isConnected: React.PropTypes.bool.isRequired,
    getDevice: React.PropTypes.func.isRequired,
    getTwin: React.PropTypes.func.isRequired,
    updateTwin: React.PropTypes.func.isRequired,
    openConnection: React.PropTypes.func.isRequired,
    closeConnection: React.PropTypes.func.isRequired,
    initMessages: React.PropTypes.func.isRequired,
    messages: React.PropTypes.array.isRequired,
    messagesLoading: React.PropTypes.bool.isRequired,
    clearMessages: React.PropTypes.func.isRequired,
  }

  static defaultProps = {
    twin: null,
    device: null,
  }

  constructor(props) {
    super(props);
    this.state = {
      viewTitle: 'Device Monitor',
    };
    // Initialize the properties here
    const { params } = this.props;
    const { deviceId } = params;
    this.props.getTwin(deviceId);
    this.props.getDevice(deviceId);

    let hours = 1;
    if ('hours' in this.props.location.query) {
      hours = Number(this.props.location.query.hours);
    }

    let englishUnits = false;
    if ('englishUnits' in this.props.location.query) {
      englishUnits = Boolean(this.props.location.query.englishUnits);
    }

    this.state = {
      hours,
      englishUnits,
      desiredInterval: 30000,
    };
  }

  toggleUnits = () => {
    this.setState({ englishUnits: !this.state.englishUnits });
  }

  handleHistoryRefresh = () => {
    if (this.props.device != null) {
      this.props.initMessages(this.props.device.deviceId, this.state.hours);
    }
  }
  handleHoursChange = (event) => {
    this.setState({ hours: event.target.value });
  }
  handleIntervalChange = (event) => {
    this.setState({ desiredInterval: event.target.value });
  }
  handleUpdate = () => {
    if (this.props.device != null) {
      this.props.updateTwin(this.props.device.deviceId, { message: { interval: this.state.desiredInterval } });
    }
  }
  handleRefresh = () => {
    if (this.props.device != null) {
      this.props.getTwin(this.props.device.deviceId);
    }
  }
  handleClear = () => this.props.clearMessages();
  handleConnect = () => {
    if (this.props.isConnected) {
      this.props.closeConnection();
    } else {
      this.props.openConnection();
    }
  }

  render() {
    // device
    let device = (<div className="input-group">
      <span className="input-group-addon">
        <i className="glyphicon glyphicon-exclamation-sign" />
      </span>
      <div className="form-control">???</div>
    </div>);
    if (this.props.device !== null && this.props.device.connectionState === 'Connected') {
      device = (<div className="input-group has-success">
        <span className="input-group-addon success">
          <i className="glyphicon glyphicon-signal" />
        </span>
        <div className="form-control">{this.props.device.deviceId}</div>
      </div>);
    } else if (this.props.device !== null) {
      device = (<div className="input-group has-danger">
        <span className="input-group-addon">
          <i className="glyphicon glyphicon-remove" />
        </span>
        <div className="form-control">{this.props.device.deviceId}</div>
      </div>);
    }

    // download
    let download = <button type="button" className="btn btn-primary" onClick={this.handleHistoryRefresh} ><span className="glyphicon glyphicon-cloud-download" /></button>;
    if (this.props.messagesLoading) {
      download = <button type="button" className="btn btn-primary" onClick={this.handleHistoryRefresh} disabled><span className="glyphicon glyphicon-hourglass" /></button>;
    }
    // time, temp, humid
    let time = new Date(0);
    if (this.props.messages.length > 0) {
      time = new Date(this.props.messages[this.props.messages.length - 1].sourceTimestamp);
    }
    let temp = -1;
    if (this.props.messages.length > 0) {
      temp =
        this.state.englishUnits ?
          (this.props.messages[this.props.messages.length - 1].temperature * 1.8) + 32 :
          this.props.messages[this.props.messages.length - 1].temperature;
    }
    let humid = -1;
    if (this.props.messages.length > 0) {
      humid = this.props.messages[this.props.messages.length - 1].humidity;
    }
    // style
    return (
      <div>
        <div className="row">
          <div className="col-md-4">
            <h5>Device</h5>
            {device}
            <p className="help-block">
              Temperature&nbsp;
              <div className="btn-group" role="group" aria-label="...">
                <button type="button" onClick={this.toggleUnits} className={`btn btn-${this.state.englishUnits ? 'default' : 'primary'} btn-xs`}>C</button>
                <button type="button" onClick={this.toggleUnits} className={`btn btn-${this.state.englishUnits ? 'primary' : 'default'} btn-xs`}>F</button>
              </div>
            </p>
          </div>
          <div className="col-md-4">
            <h5>History <small>hours</small></h5>
            <div className="input-group">
              <div className="input-group-btn">
                {download}
              </div>
              <input type="number" className="form-control" value={this.state.hours} onChange={this.handleHoursChange} />
              <div className="input-group-btn">
                <button type="button" className={`btn btn-${this.props.isConnected ? 'success' : 'danger'}`} onClick={this.handleConnect} ><span className="glyphicon glyphicon-off" /></button>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <h5>Interval <small>ms</small></h5>
            <div className="input-group">
              <span className="input-group-btn">
                <button type="button" className="btn btn-primary" onClick={this.handleUpdate} ><span className="glyphicon glyphicon-cloud-upload" /></button>
              </span>
              <input type="number" className="form-control" value={this.state.desiredInterval} onChange={this.handleIntervalChange} />
            </div>
            <p className="help-block">
              Device reported&nbsp;
            {(this.props.twin != null) ? this.props.twin.reported.message.interval : null}
              &nbsp;[ms] on&nbsp;
            {(this.props.twin != null) ?
                new Date(this.props.twin.reported.$metadata.message.interval.$lastUpdated).toLocaleString() :
                null
              }
              &nbsp;
              <button type="button" className="btn btn-default btn-xs" onClick={this.handleRefresh}><i className="glyphicon glyphicon-refresh" /></button>
            </p>
          </div>
        </div>
        <div className="row">
          <div className="col-md-4">
            <DashboardMetric main={time.toLocaleString()} sub={`Message Count: ${this.props.messages.length}`} backgroundStyle="bg-info" />
          </div>
          <div className="col-md-4">
            <DashboardMetric main={`${temp.toFixed(2)} ${this.state.englishUnits ? 'F' : 'C'}`} sub="Temperature" backgroundStyle="bg-info" />
          </div>
          <div className="col-md-4">
            <DashboardMetric main={`${humid.toFixed(2)} %`} sub="Humidity" backgroundStyle="bg-info" />
          </div>
        </div>
        <DeviceChart messages={this.props.messages} tempInputUnits="C" tempDisplayUnits={(this.state.englishUnits) ? 'F' : 'C'} height={620} />
      </div >
    );
  }
}
