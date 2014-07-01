var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
var mkdirp = require('mkdirp');
var fs = require('fs');
var path = require('path');
var x256 = require('x256');

var showMenu = require('./lib/menu.js');

module.exports = Shop;
inherits(Shop, EventEmitter);

function Shop (opts) {
    if (!(this instanceof Shop)) return new Shop(opts);
    if (!opts) opts = {};
    if (typeof opts === 'string') opts = { name: opts };
    this.name = opts.name;
    this.options = opts;
    
    if (!this.name) return this._error(
        'Your adventure must have a name! '
        + 'Supply an `opts.name` to adventure().'
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
    
    try { this.state.completed = require(this.files.completed) }
    catch (err) {}
    
    try { this.state.current = require(this.files.current) }
    catch (err) {}
    
    this.colors = opts.colors || {};
    var c = {
        pass: [0,255,0],
        fail: [255,0,0],
        info: [0,255,255]
    };
    var colors = Object.keys(c).reduce(function (acc, key) {
        acc[key] = '\x1b[38;5;' + x256(c[key]) + 'm';
        return acc;
    }, {});
    
    if (!this.colors.pass) this.colors.pass = colors.pass;
    if (!this.colors.fail) this.colors.fail = colors.fail;
    if (!this.colors.info) this.colors.info = colors.info;
    this.colors.reset = '\x1b[00m';
    
    this._adventures = [];
}

Shop.prototype.execute = function (args) {
    var cmd = args.shift();
    if (!cmd) this.showMenu(this.options);
    else if (cmd === 'verify' || /^v/.test(cmd)) {
        this.verify(args, this.state.current);
    }
};

Shop.prototype.add = function (name, fn) {
    this._adventures.push({ name: name, fn: fn });
};

Shop.prototype.find = function (name) {
    for (var i = 0; i < this._adventures.length; i++) {
        var adv = this._adventures[i];
        if (adv.name === name) return adv;
    }
};

Shop.prototype.verify = function (args, name) {
    var self = this;
    var adv = this.find(name);
    if (!adv) return this._error(
        'No adventure is currently selected. '
        + 'Select an adventure from the menu.'
    );
    var p = adv.fn();
    if (!p.verify) return this._error(
        "This problem doesn't have a .verify function yet!"
    );
    if (typeof p.verify !== 'function') return this._error(
        'This p.verify is a ' + typeof p.verify
        + '. It should be a function instead.'
    );
    var s = p.verify(args, function (ok) {
        if (ok) self.pass(name, p)
        else self.fail(name, p)
    });
    if (s && s.readable) s.pipe(process.stdout);
};

Shop.prototype.pass = function (name, p) {
    var ix = this.state.completed.indexOf(name);
    if (ix < 0) this.state.completed.push(name);
    this.save('completed');
    
    if (p.pass) {
        show(p.pass);
        console.log();
    }
    else {
        console.log(
            '\n' + this.colors.pass
            + '@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@'
        );
        console.log(
            '@@@' + this.colors.reset
            + '     YOUR SOLUTION IS CORRECT'
            + this.colors.pass + '!     @@@'
        );
        console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');
        console.log(this.colors.reset + '\n');
    }
    if (p.reference) {
        var s = p.reference();
        if (s && s.readable) s.pipe(process.stdout);
    }
};

Shop.prototype.fail = function (name, p) {
    if (p.fail) {
        show(p.fail);
        console.log();
    }
    else {
        console.log(
            this.colors.fail
            + '#########################################'
        );
        console.log(
            '###' + this.colors.reset
            + '   YOUR SOLUTION IS NOT CORRECT!'
            + this.colors.fail + '   ###'
        );
        console.log('#########################################');
        console.log(this.colors.reset + '\n');
    }
};

Shop.prototype.select = function (name) {
    var adv = this.find(name);
    this.state.current = name;
    this.save('current');
    
    var p = adv.fn();
    if (!p.problem) {
        p.problem = this.colors.info + Array(67).join('!') + '\n'
            + '!!!' + this.colors.reset
            + ' This adventure does not have a .problem description yet! '
            + this.colors.info + ' !!!\n!!!' + this.colors.reset
            + ' Set .problem to a string, buffer, stream or function that'
            + this.colors.info + ' !!!\n!!!' + this.colors.reset
            + ' returns a string, buffer, or stream.                     '
            + this.colors.info + ' !!!\n' + Array(67).join('!') + '\n'
        ;
    }
    console.log();
    show(p.problem);
};

Shop.prototype.showMenu = function (opts) {
    var self = this;
    if (!opts) opts = {};
    
    var menu = showMenu({
        fg: opts.fg,
        bg: opts.bg,
        title: opts.title || this.name.toUpperCase(),
        names: this._adventures.map(function (x) { return x.name }),
        completed: this.state.completed
    });
    menu.on('select', function (name) {
        self.select(name);
    });
    menu.on('exit', function () {
        menu.close();
        console.log();
    });
    return menu;
};

Shop.prototype.save = function (key) {
    fs.writeFile(this.files[key], JSON.stringify(this.state[key]));
};

Shop.prototype._error = function (msg) {
    console.error('ERROR: ' + msg);
    process.exit(1);
};

function show (m) {
    if (typeof m === 'string') {
        console.log(m);
    }
    else if (Buffer.isBuffer(m)) {
        process.stdout.write(m);
    }
    else if (typeof m === 'object' && m.pipe) {
        m.pipe(process.stdout);
    }
    else if (typeof m === 'function') {
        show(m());
    }
    else console.log(String(m));
}
