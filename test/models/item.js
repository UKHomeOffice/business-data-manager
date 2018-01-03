'use strict';

/* eslint func-names: 0*/

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

const Item = require('../../models/item');

describe('Item Model', function() {
  it('should make a valid INSERT ITEM query string (for a dataset with SERIAL idType)', function() {
    let properties = {'bar': 'abc', 'baz': 123};
    let item = new Item('foo', null, properties);
    let insertItemQuery = item.insertItemQueryString();
    let expectation = 'INSERT INTO foo (id, bar, baz) VALUES ' +
                      '(DEFAULT, \'abc\', \'123\') RETURNING id;';
    expect(insertItemQuery).to.equal(expectation);
  });

  it('should make a valid INSERT ITEM query string (for a dataset with VARCHAR idType)', function() {
    let properties = {'id': 'xyz', 'bar': 'abc', 'baz': 123};
    let item = new Item('foo', 'VARCHAR', properties);
    let insertItemQuery = item.insertItemQueryString();
    let expectation = 'INSERT INTO foo (id, bar, baz) VALUES ' +
                      '(\'xyz\', \'abc\', \'123\') RETURNING id;';
    expect(insertItemQuery).to.equal(expectation);
  });


});





// `INSERT INTO ${datasetName} (id, [fields]) VALUES (DEFAULT, '${values go here}');`
// `INSERT INTO ${datasetName} ('${fields go here}') VALUES ('${values go here}');`
