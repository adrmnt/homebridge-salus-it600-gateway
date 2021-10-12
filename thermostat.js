"use strict";

let Service, Characteristic;

class SalusThermostatAccessory {
    constructor(log, accessory, salus, device) {
        this.log = log;
        this.accessory = accessory;
        this.device = device;
        this.salus = salus;

        // extract name from device
        this.name = device.name;

        // setup information service
        this.information = this.accessory.getService(Service.AccessoryInformation);
        this.information
            .setCharacteristic(Characteristic.Manufacturer, "Salus")
            .setCharacteristic(Characteristic.Model, "iT-600")
            .setCharacteristic(Characteristic.SerialNumber, this.device.id);

        this.service = this.accessory.getService(Service.Thermostat);

        this.service.getCharacteristic(Characteristic.CurrentTemperature).setProps({
            minStep: 0.1,
        });

        this.service.getCharacteristic(Characteristic.TargetTemperature).setProps({
            minStep: 0.5,
            minValue: 10,
            maxValue: 30,
        });

        this.service
            .getCharacteristic(Characteristic.TargetHeatingCoolingState)
            .setProps({
                validValues: [
                    Characteristic.TargetHeatingCoolingState.OFF,
                    Characteristic.TargetHeatingCoolingState.HEAT,
                    Characteristic.TargetHeatingCoolingState.AUTO,
                ],
            });

        // create handlers for required characteristics
        this.service
            .getCharacteristic(Characteristic.CurrentHeatingCoolingState)
            .on("get", this.getCurrentHeatingCoolingState.bind(this));

        this.service
            .getCharacteristic(Characteristic.TargetHeatingCoolingState)
            .on("get", this.getTargetHeatingCoolingState.bind(this))
            .on("set", this.setTargetHeatingCoolingState.bind(this));

        this.service
            .getCharacteristic(Characteristic.CurrentTemperature)
            .on("get", this.getCurrentTemperature.bind(this));

        this.service
            .getCharacteristic(Characteristic.TargetTemperature)
            .on("get", this.getTargetTemperature.bind(this))
            .on("set", this.setTargetTemperature.bind(this));

        this.service
            .getCharacteristic(Characteristic.TemperatureDisplayUnits)
            .on("get", this.getTemperatureDisplayUnits.bind(this))
            .on("set", this.setTemperatureDisplayUnits.bind(this));

        this.service.addOptionalCharacteristic(Characteristic.StatusActive);
        this.service
            .getCharacteristic(Characteristic.StatusActive)
            .on("get", this.getActiveStatus.bind(this));
    }

    getCurrentHeatingCoolingState(callback) {
        this.salus.devices().then((devices) => {
            const device = devices.find((device) => device.id == this.device.id);
            callback(
                null,
                device.heating
                    ? Characteristic.CurrentHeatingCoolingState.HEAT
                    : Characteristic.CurrentHeatingCoolingState.OFF
            );
        });
    }

    getTargetHeatingCoolingState(callback) {
        this.salus.devices().then((devices) => {
            const device = devices.find((device) => device.id == this.device.id);
            callback(
                null,
                device.heating
                    ? Characteristic.TargetHeatingCoolingState.HEAT
                    : device.mode.indexOf("AUTO") == 0
                        ? Characteristic.TargetHeatingCoolingState.AUTO
                        : Characteristic.TargetHeatingCoolingState.OFF
            );
        });
    }

    setTargetHeatingCoolingState(value, callback) {
        let mode;
        switch (value) {
            case Characteristic.TargetHeatingCoolingState.HEAT:
                mode = "HIGH";
                break;
            case Characteristic.TargetHeatingCoolingState.AUTO:
                mode = "AUTO";
                break;
            case Characteristic.TargetHeatingCoolingState.OFF:
            default:
                mode = "LOW";
                break;
        }
        this.log(
            `setTargetHeatingCoolingState: ${value} [${mode}] for ${this.device.name}`
        );

        this.salus
            .setMode({
                id: this.device.id,
                mode: mode,
            })
            .then(() => {
                callback();
            });
    }

    getCurrentTemperature(callback) {
        this.salus.devices().then((devices) => {
            const device = devices.find((device) => device.id == this.device.id);
            this.log(
                `getCurrentTemperature for ${this.device.name}: ${device.current}`
            );
            callback(null, parseFloat(device.current));
        });
    }

    getTargetTemperature(callback) {
        this.salus.devices().then((devices) => {
            const device = devices.find((device) => device.id == this.device.id);
            this.log(
                `getTargetTemperature for ${this.device.name}: ${device.target}`
            );
            callback(null, parseFloat(device.target));
        });
    }

    setTargetTemperature(value, callback) {
        this.log(`setTargetTemperature: ${value} for ${this.device.name}`);
        this.salus
            .setTarget({
                id: this.device.id,
                temperature: value,
            })
            .then(() => {
                callback();
            });
    }

    getTemperatureDisplayUnits(callback) {
        this.log(
            `getTemperatureDisplayUnits for ${this.device.name}: ${Characteristic.TemperatureDisplayUnits.CELSIUS}`
        );
        // Always Celcius
        callback(null, Characteristic.TemperatureDisplayUnits.CELSIUS);
    }

    /**
     * Handle requests to set the "Temperature Display Units" characteristic
     */
    setTemperatureDisplayUnits(value, callback) {
        this.log(`setTemperatureDisplayUnits: ${value} for ${this.device.name}`);
        // Always Celcius; NO-OP
        callback();
    }

    getActiveStatus(callback) {
        callback(null, this.device.mode != "OFFLINE");
    }
}

module.exports = (exportedTypes) => {
    if (exportedTypes && !Characteristic) {
        Service = exportedTypes.Service;
        Characteristic = exportedTypes.Characteristic;
    }

    return SalusThermostatAccessory;
};