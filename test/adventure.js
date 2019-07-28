var assert = require('assert');
var sinon = require('sinon');
var adventure = require('../');

describe('adventure', () => {
  before(() => {
    this.shop = adventure('test-adventure');
    this.shop.add('test', () => { return {}});
  });

  describe('#add', () => {
    it('add new adventure', () => {
      assert.equal(this.shop._adventures.length, 1);
    });
  });

  describe('#find', () => {
    it('return adventure selected', () => {
      this.shop.add('other-test', () => {});
      assert.equal(this.shop._adventures.length, 2);
      assert.equal(this.shop.find('test'), this.shop._adventures[0]);
    });
  });

  describe('#select', () => {
    it('show adventure problem', () => {
      var dinosaurs = require('./../example/dinosaurs');
      this.shop.add('dinosaurs', () => dinosaurs);
      var stub = sinon.stub(this.shop, '_show');
      this.shop.select('dinosaurs');
      assert(stub.calledOnce);
      assert(stub.calledWith(dinosaurs.problem));
      this.shop._show.restore();
    });
  });

  describe('with verify stubed', () => {
    before(() => {
      this.dinosaurs = require('./../example/dinosaurs');
      this.stub = sinon.stub(this.dinosaurs, 'verify');
      this.shop.add('dinosaurs', () => this.dinosaurs);
      this.shop.select('dinosaurs');
    });
    after(() => {
      this.dinosaurs.verify.restore();
    });
    describe('#verify', () => {
      it('run adventure verify', () => {
        this.shop.verify('rawr', 'dinosaurs');
        assert(this.stub.calledOnce);
      });
    });

    describe('#execute', () => {
      it('command', () => {
        this.shop.execute(['verify']);
        assert(this.stub.called);
      });
    });
  });
});
