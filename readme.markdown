# adventure

quickly hack together a [nodeschool](http://nodeschool.io) adventure

This is an alternative to the
[workshopper](https://www.npmjs.org/package/workshopper)
module, which you should also look at.

`workshopper` is more convention-driven and fully-featured, but expects a
particular (configurable) filesystem organization for problems.

`adventure` is entirely api-driven and has fewer configuration options.

# tutorial

First make a `runner.js`. This is the file you can wire up to the `package.json`
`"bin"` field.

``` js
#!/usr/bin/env node

var adventure = require('adventure');
var shop = adventure('example-adventure');

shop.add('dinosaurs', function () { return require('./dinosaurs') });
shop.add('robots', function () { return require('./robots') });
shop.add('wowsers', function () { return require('./wowsers') });

shop.execute(process.argv.slice(2));
```

You simply `.add(name, fn)` each of the adventures in your problem set and then
`.execute()` the adventure with the command-line arguments.

The interface to problem files is very simple. The simplest version of a problem
is just an object with a `.problem` string and `.verify` function.

Here's what we can put in `dinosaurs/index.js`:

```
exports.problem = 'Make a dinosaur sound.\n'
    + 'Use `$ADVENTURE_COMMAND verify YOUR_TEXT...` to make your sound.'
;

exports.verify = function (args, cb) {
    if (/RAWR/.test(args)) {
        console.log('Wow that is a convincing dinosaur.\n');
        cb(true);
    }
    else if (/rawr/i.test(args)) {
        console.log('Close, but too quiet. Try louder.\n');
        cb(false);
    }
    else {
        console.log("That doesn't sound like a dinosaur at all.\n");
        cb(false);
    }
};
```

You don't need to put this in a file necessarily even, you just need to return
an object with these properties from the function you pass to `.add()`.

Your `verify(args, cb)` function will get the arguments passed to it on the
command-line and a callback that you can use to indicate whether the solution
was successful or not.

You can return many different kinds of objects in your `.problem` or `.solution`
functions: a string, a buffer, a stream, or a function that returns a string, a
buffer, or a stream.

Now in `robots/index.js` we can use streams for the problem and solution:

``` js
var fs = require('fs');
var path = require('path');

exports.problem = fs.createReadStream(__dirname + '/problem.txt');
exports.solution = fs.createReadStream(__dirname + '/solution.txt');

exports.verify = function (args, cb) {
    var res = require(path.resolve(args[0]));
    if (/beep/.test(res) && /boop/.test(res)) {
        console.log('That sounds about right!\n');
        cb(true);
    }
    else if (/beep/.test(res) || /boop/.test(res)) {
        console.log('Hmm that sounds partly convincing but try harder.\n');
        cb(false);
    }
    else {
        console.log("That doesn't sound like a robot at all.\n");
        cb(false);
    }
};
```

Finally, we can use
[adventure-verify](https://npmjs.org/package/adventure-verify)
to verify solutions using [tape](https://npmjs.org/package/tape) with
friendly [colorized tap output](https://npmjs.org/package/tap-colorize).

In `wowsers/index.js` we can use
[adventure-verify](https://npmjs.org/package/adventure-verify) to do:

``` js
var fs = require('fs');
var path = require('path');
var verify = require('adventure-verify');

exports.problem = fs.createReadStream(__dirname + '/problem.txt');
exports.solution = fs.createReadStream(__dirname + '/solution.txt');

exports.verify = verify({ modeReset: true }, function (args, t) {
    var f = require(path.resolve(args[0]));
    t.equal(typeof f, 'function', 'you exported a function');
    t.equal(f(2,3), 6, '2 * 3 = 6');
    t.equal(f(1,1), 1, '1 * 1 = 1');
    t.equal(f(0.5,0.5), 0.25, '0.5 * 0.5 = 0.25');
    t.end();
});
```

Here we use `modeReset` so that when a user does `console.log()` or
`console.error()` in their solution, their text shows up as the terminal default
instead of getting mixed up with the TAP colors.

Now just fill in the `problem.txt` and `solution.txt` files and you will have a
working nodeschool-style adventure! Yay!

