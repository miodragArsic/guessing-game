(function() {
    'use strict';

    angular
        .module('app')
        .factory('firstAppRepository', FirstAppRepo);

    FirstAppRepo.$inject = [];

    function FirstAppRepo() {

        var service = {

            getRPIParts: getRPIParts,
            getArduinoParts: getArduinoParts,
            getEdisonParts: getEdisonParts
        };

        var scriptParts = {

            rpi: [
            {title: 'header', content: 'import grovepi  #provides pin support\nimport ATT_IOT as IOT   #provide cloud support\nfrom time import sleep  #pause the app\n\n'},
            {title: 'credentials', content: '#credentials for the ATT IOT platform connection\nIOT.DeviceId = "DEVICE_ID"\nIOT.ClientId = "CLIENT_ID"\nIOT.ClientKey = "CLIENT_KEY"\n\n'},
            {title: 'asset', content: '#set ASSET_TITLE pin to ASSET_MODE PIN_NUMBER and get its name\nASSET_TYPEName = "ASSET_NAME"  #name of the ASSET_TYPE\nASSET_TYPEPin = PIN_NUMBER\n\n'},
            {title: 'pinModes', content: '#set up the pins for usage\ngrovepi.pinMode(sensorPin,"INPUT")\ngrovepi.pinMode(actuatorPin,"OUTPUT")\n\n'},
            {title: 'callback', content: '#callback: handles values sent from the cloudapp to the device\ndef on_message(assetName, value):\n    if assetName == actuatorName:\n        value = value.lower()                    #make certain that the value is in lower case, for True vs true\n        if value == "true":\n            grovepi.digitalWrite(actuatorPin, 1)\n            IOT.send("true", actuatorPin)        #provide feedback to the cloud that the operation was succesful\n        elif value == "false":\n            grovepi.digitalWrite(actuatorPin, 0)\n            IOT.send("false", actuatorPin)       #provide feedback to the cloud that the operation was succesful\n        else:\n            print("unknown value: " + value)\n    else:\n        print("unknown actuator: " + assetName)\nIOT.on_message = on_message\n\n'},
            {title: 'connect', content: 'IOT.connect()  #connects your device to the ATT IOT platform\nIOT.subscribe()  #starts the bi-directional communication\n\n'},
            {title: 'while', content: '#main loop: run as long as the device is turned on\nwhile True:\n    try:\n        # Read sensor value from potentiometer\n        sensor_value = grovepi.analogRead(sensorPin)\n        # Send sensor value to cloud\n        IOT.send(sensor_value, sensorName)\n        print ("Rotary knob value: " + str(sensor_value))\n    except IOError:\n        print ""'}
            ],

            arduino: [
            {title: 'header', content: '#include <Ethernet.h>\n#include <EthernetClient.h>\n#include <PubSubClient.h>\n#include <ATT_IOT.h>\n#include <SPI.h>  //required to have support for signed/unsigned long type.\n\n'},
            {title: 'credentials', content: 'char deviceId[] = "DEVICE_ID";\nchar clientId[] = "CLIENT_ID";\nchar clientKey[] = "CLIENT_KEY";\nbyte mac[] = {0x00, 0x00, 0x00, 0x00, 0x00, 0x01};  //Adapt to your Arduino MAC address if needed\n\n'},
            {title: 'asset', content: ''},
            {title: 'pinModes', content: 'int knobPin = 0;  // Analog 0 is the input pin\nint ledPin = 4;  // Pin 4 is the LED output pin\n\n'},
            {title: 'callback', content: '// Callback function: handles messages that were sent from the IOT platform to this device.\nvoid callback(char* topic, byte* payload, unsigned int length)\n{\n  String msgString;\n  {\n    char message_buff[length + 1];  //need to copy over the payload so that we can add a /0 terminator, this can then be wrapped inside a string for easy manipulation.\n    strncpy(message_buff, (char*)payload, length);  //copy over the data\n    message_buff[length] = \'\\0\';   //make certain that it ends with a null\n\n    msgString = String(message_buff);\n    msgString.toLowerCase();  //to make certain that our comparison later on works ok (it could be that a True or False was sent)\n  }\n\n  int* idOut = NULL;\n\n  {\n    // get asset pin\n    int pinNr = Device.GetPinNr(topic, strlen(topic));\n\n    Serial.print("Payload: ");\n    Serial.println(msgString);\n    Serial.print("topic: ");\n    Serial.println(topic);\n\n    if (pinNr == ledPin)\n    {\n      if (msgString == "false") {\n        digitalWrite(ledPin, LOW);  //turn off LED asset\n        idOut = &ledPin;\n      }\n      else if (msgString == "true") {\n        digitalWrite(ledPin, HIGH);  //turn on LED asset\n        idOut = &ledPin;\n      }\n    }\n  }\n  if(idOut != NULL)\n    Device.Send(msgString, *idOut);\n}\n' },
            {title: 'connect', content: '//required for the device connection\nvoid callback(char* topic, byte* payload, unsigned int length);\nchar httpServer[] = "api.smartliving.io";\nchar* mqttServer = "broker.smartliving.io";\nEthernetClient ethClient;\nPubSubClient pubSub(mqttServer, 1883, callback, ethClient);\nATTDevice Device(deviceId, clientId, clientKey);  //create the object that provides the connection to the cloud to manage the device.\n\nvoid setup()\n{\n  pinMode(ledPin, OUTPUT);  // initialize the digital pin as an output.\n  Serial.begin(9600);  // init serial link for debugging\n\n  if (Ethernet.begin(mac) == 0)  // Initialize the Ethernet connection\n  {\n    Serial.println(F("DHCP failed,end"));\n    while(true);  //we failed to connect, halt execution here.\n  }\n  delay(1000);  //give the Ethernet shield a second to initialize\n\n  while(!Device.Connect(&ethClient, httpServer))  // connect the device with the IOT platform\n    Serial.println("retrying");\n\n  while(!Device.Subscribe(pubSub))  // make certain that we can receive message from the iot platform (activate mqtt)\n    Serial.println("retrying");\n}\n\n'},
            {title: 'while', content: 'unsigned long time;  //only send every x amount of time.\nunsigned int prevVal =0;\nvoid loop()\n{\n  unsigned long curTime = millis();\n  if (curTime > (time + 1000))  // publish light reading every 5 seconds to sensor 1\n  {\n    unsigned int lightRead = analogRead(knobPin);  // read from Knob sensor\n    if(prevVal != lightRead){\n      Device.Send(String(lightRead), knobPin);\n      prevVal = lightRead;\n    }\n    time = curTime;\n  }\n  Device.Process();\n}\n\n'}
            ],

            'intel-edison': [
            {title: 'header', content: '\'use strict\';\nvar smartliving = require(\'smartliving\');\nvar mraa = require(\'mraa\'); //Wrapper for GPIO Pins\n\n'},
            {title: 'credentials', content: 'smartliving.credentials = {\n    deviceId: \'DEVICE_ID\',\n    clientId: \'CLIENT_ID\',\n    clientKey: \'CLIENT_KEY\'\n};\n\n'},
            {title: 'asset', content: 'var actuatorId = \'ACTUATOR_ID\';\n'},
            {title: 'pinModes', content: 'var a0 = new mraa.Aio(0); //setup access analog input Analog pin #0 (A0)\nvar d4 = new mraa.Gpio(4); //LED hooked up to digital pin 4\nd4.dir(mraa.DIR_OUT); //set the gpio direction to output\nvar state = false; //Boolean to hold the state of Led\n\n'},
            {title: 'callback', content: 'function actuatorCallback() {\n    d4.write(state ? 0 : 1); //if state is true then write a 1 (high) otherwise write a 0 (low)\n    state = !state; //invert the ledState\n}\nsmartliving.registerActuatorCallback(actuatorId, actuatorCallback);\n\n'},
            {title: 'connect', content: 'smartliving.connect();\n\n'},
            {title: 'while', content: 'setInterval(function(){\n    var value = a0.read(); //read the value of the analog pin\n    smartliving.send(value, \'0\');\n}, 3000);'}
            ]
        };

        return service;

        ///////////////////////////////////////

        function getRPIParts() {

            var parts = {};

            var RPI = scriptParts.rpi;

            for (var i = 0; i < RPI.length; i++) {

                parts[RPI[i].title] = RPI[i].content;

            }

            return parts;

        }

        function getArduinoParts() {

            var parts = {};

            var arduino = scriptParts.arduino;

            for (var i = 0; i < arduino.length; i++) {

                parts[arduino[i].title] = arduino[i].content;

            }

            return parts;

        }

        function getEdisonParts() {

            var parts = {};

            var edison = scriptParts['intel-edison'];

            for (var i = 0; i < edison.length; i++) {

                parts[edison[i].title] = edison[i].content;

            }

            return parts;

        }
    }
})();
