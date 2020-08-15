var util = require('util');
var path = require('path');
var hfc = require('fabric-client');

var file = 'network-config.yaml';

// indicate to the application where the setup file is located so it able
// to have the hfc load it to initalize the fabric client instance
hfc.setConfigSetting('network-connection-profile-path',path.join(__dirname, file));
hfc.setConfigSetting('parent-connection-profile-path',path.join(__dirname, 'parent.yaml'));
hfc.setConfigSetting('child-connection-profile-path',path.join(__dirname, 'child.yaml'));

// some other settings the application might need to know
hfc.addConfigFile(path.join(__dirname, 'config.json'));