var assert = require('assert');
var sinon = require('sinon');
var menu = require('../lib/menu');

describe('menu', () => {
  before(() => {
    this.menuInstance = menu({ names: ['foo'], title: 'FOO' });
  });

  it('is not broken', () => {
    assert(this.menuInstance);
  });

  it('add new exercise to menu', () => {
    var tmenu = this.menuInstance.menu;
    assert.equal(tmenu.items.length, 3);
  });
});
