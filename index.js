"use strict";

const PLUGIN_NAME = "homebridge-salus-it600-gateway";
const PLATFORM_NAME = "Salus-iT600";

const Salus = require("salus-it600-pack");
let Accessory, Service, SalusThermostatAccessory, uuid;

class SalusPlatform {
    constructor(log, config, api) {
        log.debug("Starting Salus iT600");
        this.log = log;
        this.api = api;
        this.salus = new Salus(config);
        this.accessories = new Map();

        api.on("didFinishLaunching", async () => {
            const token = await this.salus.getToken();
            const devices = await this.salus.getDevices(token.value);

            devices.forEach((device) => {
                let accessory = this.accessories.get(device.id);
                if (accessory === undefined) {
                    const platformAccessory = new Accessory(
                        device.name,
                        uuid.generate(device.id)
                    );
                    platformAccessory.addService(Service.Thermostat, device.name, 1);
                    platformAccessory.context.device = device;
                    accessory = new SalusThermostatAccessory(
                        this.log,
                        platformAccessory,
                        this.salus,
                        device,
                        token
                    );
                    this.accessories.set(device.id, accessory);
                    this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
                        platformAccessory,
                    ]);
                } else {
                    this.accessories.set(
                        device.id,
                        new SalusThermostatAccessory(
                            this.log,
                            accessory,
                            this.salus,
                            device,
                            token
                        )
                    );
                }
            });

        });
    }

    configureAccessory(accessory) {
        this.accessories.set(accessory.context.device.id, accessory);
    }
}

module.exports = function (homebridge) {
    const exportedTypes = {
        Service: homebridge.hap.Service,
        Characteristic: homebridge.hap.Characteristic,
    };

    SalusThermostatAccessory = require("./thermostat")(exportedTypes);
    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    uuid = homebridge.hap.uuid;

    homebridge.registerPlatform(PLATFORM_NAME, SalusPlatform);
};