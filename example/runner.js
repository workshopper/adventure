#!/usr/bin/env node

var adventure = require('../');
var shop = adventure('example-adventure');

shop.add('dinosaurs', function () { return require('./dinosaurs') });
shop.add('robots', function () { return require('./robots') });

shop.execute(process.argv.slice(2));
