import { clientFromConnectionString } from 'azure-iot-device-mqtt';
import { Message } from 'azure-iot-device';
import uuidv1 from 'uuid/v1';

/* eslint-disable no-console */
export default class DummyDevice {

  constructor(config, twin) {
    this._client = clientFromConnectionString(config.connectionString);
    this.config = config;
    this.properties = twin;
  }

  initialize() {
    this._client.getTwin((err, twin) => {
      if (err) {
        console.error(`could not get twin: ${err}`);
        return;
      }

      // Create listener for properties
      this._twin = twin;
      this._twin.on('properties.desired.message.interval', this.handleIntervalUpdate);
      this._twin.on('properties.desired.message.transmit', this.handleTransmitUpdate);
      this._twin.on('properties.desired.message.flash', this.handleFlashUpdate);

      // Initialize the device
      this.start();
    });
  }

  start() {
    if (this._interval) clearInterval(this._interval);
    this._interval = setInterval(this.sendMessage, this.properties.message.interval);
  }

  handleIntervalUpdate = (interval) => {
    // Validate the properties!
    if (interval < this.config.message.interval.min || interval > this.config.message.interval.max) {
      console.error(`desired message transmission interval of ${interval} [ms] is not valid (${this.config.messsage.interval.min} <= x <= ${this.config.message.interval.max}). Ignoring.`);
      return;
    }
    console.log(`message transmission interval has been updated to ${interval}`);
    this.properties.message.interval = interval;
    this.start();
    this._twin.properties.reported.update({ message: { interval: this.properties.message.interval } }, (err) => {
      if (err) console.log(`error reporting updated twin: ${err}`);
    });
  }

  handleTransmitUpdate = (transmit) => {
    console.log(`message transmission state has been updated to ${transmit}`);
    this.properties.message.transmit = transmit;
    this._twin.properties.reported.update({ message: { transmit: this.properties.message.transmit } }, (err) => {
      if (err) console.log(`error reporting updated twin: ${err}`);
    });
  }

  handleFlashUpdate = (flash) => {
    console.log(`message with flash has been updated to ${flash}`);
    this.properties.message.flash = flash;
    this._twin.properties.reported.update({ flash: this.properties.message.flash }, (err) => {
      if (err) console.log(`error reporting updated twin: ${err}`);
    });
  }

  sendMessage = () => {
    // Create payload for the message
    const data = {
      sourceTimestamp: new Date(),
      temperature: -1 * Math.random(),
      humidity: -1 * Math.random(),
      status: {
        flash: this.properties.message.flash,
      },
    };

    const message = new Message(JSON.stringify(data));
    message.messageId = uuidv1();

    // send the data message
    if (this.properties.message.transmit) this.sendEvent(message);
  }

  sendEvent(message) {
    this._client.sendEvent(message, (e, result) => {
      if (e) console.log(`Send Message Error: ${e.toString()}`);
      if (result) {
        console.log(`Send Message >>> ${message.getData()}`);
      }
    });
  }
}
