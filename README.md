# node-postgres-patch [![Build Status](https://circleci.com/gh/armw4/node-postgres-patch.svg?style=shield&circle-token=4d307d415c417c5d099ea7301e64e58b1ae35617)](https://circleci.com/gh/armw4/node-postgres-patch/)

Handle `PATCH` requests with postgres and node via `node-postgres`

## Usage

`node-postgres-patch` outputs an object with 2 properties:

* `set` - contains the `SET` statement that should be placed within your base query
* `values` - contains the values that map to the placeholders in `set` (these should be forwarded to `node-postgres`)

You may pass a varargs style list of keys:

```js
var patch = require('node-postgres-patch')

var output = patch({
  abstractSyntaxTree: 'jason Murray',
  antwan: JSON.stringify({ jason: 'Murray Jr' })
}, 'abstractSyntaxTree', 'antwan', 'wimberly')

console.log(output) // {
                    //   set: 'SET abstract_syntax_tree = $1, antwan = $2',
                    //   values: ['jason Murray', '{"jason":"Murray Jr"}']
                    // }
```

You may also pass an array of keys:

```js
var patch = require('node-postgres-patch')

var output = patch({
  wimberly: 39,
  antwan: JSON.stringify({ jason: 'Murray Jr' }),
  abstractSyntaxTree: 'jason Murray'
}, ['abstractSyntaxTree', 'antwan', 'wimberly'])

console.log(output) // {
                    //   set: 'SET abstract_syntax_tree = $1, antwan = $2, wimberly = $3',
                    //   values: ['jason Murray', '{"jason":"Murray Jr"}', 39]
                    // }
```

If there are keys in your input that you do not want `set` to honor, you could use some ES6 sugar to get them out
of harm's way:

```js
var patch = require('node-postgres-patch')

const { id, novelty, motherDorothy, ...rest } = resource

patch(rest, 'a', 'b', 'c')
```

This is just one of several ways, but the choice I shall leave in your hands :wink:.

## Accounting for Additional Values

It may be apparent to you that we're using ordinal based syntax for parameter positioning. I thought of using
`node-postgres-named` here instead, but decided to keep things as primitive as possible (this may change in the future).
Of course what this implies is that if you have additional values to account for, you'll have to start tacking them on
*after* the values yielded by `node-postgres-patch`:

```js
var patch = require('node-postgres-patch')
var id = 99
var tenantId = 100

var output = patch({
  wimberly: 39,
  antwan: JSON.stringify({ jason: 'Murray Jr' }),
  abstractSyntaxTree: 'jason Murray'
}, ['abstractSyntaxTree', 'antwan', 'wimberly'])

var allValues = output.values.concat([id, tenantId])
var ordinal = output.values.length + 1

// node-postgres client
// callback for client.query ommited for brevity...also note the usage of ES template strings
client.query(`
  UPDATE my_table
  SET ${output.set}
  WHERE id = $${ordinal++}
  AND tenant_id = $${ordinal++}
  RETURNING id, last_updated_at, get
`, allValues)
```

I don't think this is *terrible* but it certainly would be *prettier* with `node-postgres-named`. That being said, I can live with this
for now. I suspect this is common place for those using `node-postgres` in it's most absolute form.

## Why?

`PATCH` request are very dynamic in nature. A client could be updating all the values on a resource...or just a few..
or just one. This of course influences the underlying SQL that one must write to satisfy such a request. To properly
generate an `UPDATE` statement, you need to dynamically build up a list of expressions (`SET` x = y) accordingly.
The last time I wrote this it looked something like:

```js
import compact from 'lodash.compact'

export const update = (resource) => {
  const set = compact([
    'get' in resource
      ? 'get = $get'
      : null,
    'maritalStatus' in resource
      ? 'marital_status = $maritalStatus'
      : null,
    'facialExpression' in resource
      ? 'facial_expression = $facialExpression'
      : null,
  ]).join(',')

  // somewhere we newed up a node-postgres client and we're also leveraging node-postgres-named
  // callback to client.query ommited for brevity..yes..ES6 template strings again
  client.query(`
    UPDATE my_table
    SET ${set}
    WHERE id = $id
    RETURNING id, last_updated_at, get
    `, resource)
}
```

That doesn't look *too* terrible on paper. But I felt like I didn't want to be forced to repeat this sort of logic in the future.
I suspected that being forced to manually validate the presence of each key and react accordingly was probably gonna get lame after a while.

> "Better we must do"

## What This Is...

This small helper aims to be something simple. As of today, it takes 0 configuration. I wanted to keep this as straightforward and
light as possible. In fact, people using ORMs will never even visit this page as this will all somehow be "magically" taken care of
behind the scenes. But if you're like me and some of my former coworkers, you're kind of over ORMs at this point and just want to write
native SQL. As a result, I didn't want this to feel event remotely heavy (i.e. think of the mapping configuration ORMs usually impose). By convention,
`node-postgres-patch` will `decamelize` the keys of your input to generate column names. So `mySpecialDay` would map to a column named `my_special_day`.
So yes...there should be some sort of synergy between the names of keys used on your resource and the database columns they map to (again...0 configuration).
I don't expect to save the world here. I do hope that for very basic and simple updates that this will prove helpful.

## A Note on Mass Assignment

`node-postgres-patch` will only generate updates for the columns you specify in your white list. If you notice by now, it accepts the
same style arguments as `lodash.pick`. If a client sends additional keys, they will be ignored. If a client sends none of the keys you
expected, a `PatchError` will be thrown and you may respond with a `422`  or whatever response code you think proper.
