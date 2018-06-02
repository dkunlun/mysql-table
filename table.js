const Promise = require('bluebird')
const assert = require('assert')
const lodash = require('lodash')
const utils = require('./utils');

module.exports = function (con, schema) {
  assert(con, 'Table requires rethink db connection')
  assert(schema, 'Table requires schema object')

  return utils.initTable(con, schema).then(con => {

    var table = function () {
      return con(schema.table)
    }

    table.schema = schema
    table.con = con

    table.alter = function (schema) {
      return utils.alterTable(con, schema)
    }

    table.filter = function (options) {
      return table().select('*').where(options)
    }

    table.getBy = function (index, id) {
      return table().select('*').where(index, id).first()
    }

    table.get = function (id) {
      return table.getBy('id', id)
    }

    table.getAll = function (ids) {
      return table().select('*').where('id', ids)
    }

    table.has = function (id) {
      return table.get(id).then(row => {
        return Promise.resolve(!!row)
      })
    }

    table.hasBy = function (index, id) {
      return table.getBy(index, id).then(row => {
        return Promise.resolve(!!row)
      })
    }

    table.update = function (id, object) {
      object.id = id
      return table().update(object)
    }

    table.create = function (object) {
      return table().insert(object)
    }

    table.upsert = function (object) {
      return table.has(object.id).then(result => {
        return result ? table.update(object) : table.create(object)
      }).then(result => {
        // return the original object
        return Promise.resolve(object)
      })
    }

    table.list = function () {
      return table.select('*')
    }

    table.readStream = function () {
      return table.list().stream();
    }

    table.streamify = function (query) {
      assert(query, 'requires driver query')
      return query.stream()
    }

    table.delete = function (id) {
      return table.get(id).del().then(result => {
        return Promise.resolve(true)
      })
    }

    table.drop = function () {
      return con.schema.dropTable(schema.table)
    }

    // helper queries

    table.count = function () {
      return utils.count(table());
    }

    table.paginate = function (page, limit) {
      return utils.paginate(table(), page, limit);
    }

    return table;
  })

}