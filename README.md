# Homebridge Salus iT600 Thermostat Gateway

Homebridge plugin for Salus iT600 thermostats.
 
## Installation

Use the same credentials as in your Salus

```
{
  platforms: [
    {
      "platform": "Salus-iT600",
      "username": "email@example.com",
      "password": "secret123"
      "thermostatModels": [
        "exampleModel1",
        "exampleModel2"
      ]
    }
  ]
}
```