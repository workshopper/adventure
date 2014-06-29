var minimist = require('minimist');
var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
var mkdirp = require('mkdirp');
var fs = require('fs');
var path = require('path');

var showMenu = require('./lib/menu.js');

module.exports = Shop;
inherits(Shop, EventEmitter);

function Shop (opts) {
    if (!(this instanceof Shop)) return new Shop(opts);
    if (!opts) opts = {};
    if (typeof opts === 'string') opts = { name: opts };
    this.name = opts.name;
    if (!this.name) throw new Error(
        'Your adventure must have a name! '
        + 'Supply an `opts.name` to workshoppe().'
    );
    
    this.datadir = opts.datadir || path.resolve(
        process.env.HOME || process.env.USERPROFILE,
        '.config/' + this.name
    );
    mkdirp.sync(this.datadir);
    
    this.files = {
        completed: path.join(this.datadir, 'completed.json'),
        current: path.join(this.datadir, 'current.json')
    };
    this.state = { 
        completed: [],
        current: null
    };
    
    try { this.state.completed = require(files.completed) }
    catch (err) {}
    
    try { this.state.current = require(files.current) }
    catch (err) {}
    
    this._adventures = [];
}

Shop.prototype.execute = function (args) {
    var argv = minimist(args);
    var cmd = argv._.shift();
    if (!cmd) this.showMenu();
};

Shop.prototype.add = function (name, fn) {
    this._adventures.push({ name: name, fn: fn });
};

Shop.prototype.showMenu = function () {
    var menu = showMenu({
        fg: 'white',
        bg: 'red',
        names: this._adventures.map(function (x) { return x.name }),
        completed: this.state.completed
    });
    menu.on('exit', function () {
        menu.close();
        console.log();
    });
};

Shop.prototype.save = function (key) {
    fs.writeFile(this.files[key], JSON.stringify(this.state[key]));
};
