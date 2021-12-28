"use strict";

let Service, Characteristic;

class SalusThermostatAccessory {
    constructor(log, accessory, salus, device, token) {
        this.log = log;
        this.accessory = accessory;
        this.device = device;
        this.salus = salus;
        this.token = token;

        this.updateThermostats();
    }

    updateThermostats(){
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
                    Characteristic.TargetHeatingCoolingState.HEAT
                ],
            });

        this.service
            .getCharacteristic(Characteristic.CurrentHeatingCoolingState)
            .on("get", this.getCurrentHeatingCoolingState.bind(this));

        this.service
            .getCharacteristic(Characteristic.CurrentRelativeHumidity)
            .on("get", this.getCurrentRelativeHumidity.bind(this));

        this.service
            .getCharacteristic(Characteristic.TargetHeatingCoolingState)
            .on("get", this.getTargetHeatingCoolingState.bind(this))

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

    async getCurrentHeatingCoolingState(callback) {
        await this.isTokenValid();
        this.device.heating = await this.salus.getDeviceHeating(this.token.value, this.device.id);

        callback(
            null,
            this.device.heating
                ? Characteristic.CurrentHeatingCoolingState.HEAT
                : Characteristic.CurrentHeatingCoolingState.OFF
        );
    }

    async getTargetHeatingCoolingState(callback) {
        await this.isTokenValid();
        this.device.heating = await this.salus.getDeviceHeating(this.token.value, this.device.id);
        callback(
            null,
            this.device.heating
                ? Characteristic.CurrentHeatingCoolingState.HEAT
                : Characteristic.CurrentHeatingCoolingState.OFF
        );
    }


    async getCurrentTemperature(callback) {
        await this.isTokenValid();
        this.device.current = await this.salus.getDeviceCurrentTemperature(this.token.value, this.device.id);
        callback(null, parseFloat(this.device.current));
    }

    async getCurrentRelativeHumidity(callback) {
        await this.isTokenValid();
        this.device.current = await this.salus.getDeviceCurrentRelativeHumidity(this.token.value, this.device.id);
        callback(null, parseFloat(this.device.humidity));
    }

    async getTargetTemperature(callback) {
        await this.isTokenValid();
        this.device.target = await this.salus.getDeviceTargetTemperature(this.token.value, this.device.id);
        callback(null, parseFloat(this.device.target));
    }

    async setTargetTemperature(value, callback) {
        await this.isTokenValid();
        this.salus
            .updateTemperature(this.token.value, this.device.id, value)
            .then(() => {
                callback();
            });
    }

    getTemperatureDisplayUnits(callback) {
        callback(null, Characteristic.TemperatureDisplayUnits.CELSIUS);
    }

    setTemperatureDisplayUnits(value, callback) {
        callback();
    }

    getActiveStatus(callback) {
        callback(null, this.device.mode != "OFFLINE");
    }

    async isTokenValid() {
        if (this.token.creationDay !== new Date().getDate()) {
            this.token = await this.salus.getToken();
        }
    }
}

module.exports = (exportedTypes) => {
    if (exportedTypes && !Characteristic) {
        Service = exportedTypes.Service;
        Characteristic = exportedTypes.Characteristic;
    }

    return SalusThermostatAccessory;
};