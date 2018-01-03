'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

const Datasets = require('../../models/datasets');


// describe('Datasets Model', () => {
//   it('should find the table doesn\'t exist', (done) => {
//     let dataset = new Dataset('idontexist');
//     let result = dataset.checkIfExists();
//     expect(result).to.eventually.equal(false);
//     done();
//   });
//
//   it('should make a valid CREATE TABLE query string', (done) => {
//     let fields = [{name: 'port_name', datatype: 'varchar', primaryKey: 'True'},
//                   {name: 'country', datatype: 'json', notNull: 'True'}
//                 ];
//     let dataset = new Dataset('ports', fields);
//     let createTableQueryString = dataset.createTableQueryString();
//     expect(createTableQueryString).to.equal('CREATE TABLE ports ( "port_name" varchar, "country" json NOT NULL, PRIMARY KEY ( port_name ) );');
//     done();
//   });
// });
