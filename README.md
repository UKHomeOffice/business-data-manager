![Logo of the project](./documents/images/cube.png)


# Aker Systems Business Data Manager

[![Build Status](https://travis-ci.com/akersystems/business-data-manager.svg?token=gzpbKw8cddsJ1WFZ5iqW&branch=initial-build)](https://travis-ci.com/akersystems/business-data-manager)

> A lightweight, flexible business data management solution

Aker Systems Business Data Manager enables business data to be stored and
managed through a web application and API. Multiple datasets can be created
and managed.

Rather than having a fixed set of collections (one for each dataset); it
represents the datasets as a resource type and then all data items are
sub-resources of these highest level resources.


## Configuration

The application requires the following environment variables to be set prior to
launch:

```
export ENV=dev  // setting this to 'production' changes the log format to 'short'
export LOG_LEVEL=info
export NAME=business-data-manager
export PORT=8080
export SESSION_SECRET=psC6bLKZbU68rybz3YSk42Jf5btK9mbS6exJ  // replace with a random string
export TITLE='Business Data Manager'

export PGHOST=localhost
export PGPORT=5432
export PGUSER=bdm
export PGDATABASE=bdm
export PGPASSWORD=badpassword
```


## Current features

* Return a list of all datasets (including summary information)
* Create a new dataset
* Add fields to a dataset
* Return all items in a dataset
* Delete a dataset
* Add an item to a dataset
* Return an item from a dataset
* Delete an item from a dataset


### Planned features

* Update the definition of an existing dataset - this has not been
  implemented yet due to the complexity of handling the data migration


## Supported representations

This application supports the following representations:

* HTML - content type: `text/html`
* JSON - content type: `application/json`

The response will default to HTML if the request accepts both HTML and JSON or
does not specify a response format. So if you require the response in JSON
format please set the `Accept` header to `application/json`.


## Supported backends

Currently only PostgreSQL version `9.6.5` is supported (other versions may
work, but they are not supported).

> Other backends may be supported in the future.


## Routes

### Actions on datasets

`GET /v1/datasets` - returns summary information about all datasets

`POST /v1/datasets` - creates a new dataset, including its properties

`GET /v1/datasets/{dataset}` - returns summary information about the dataset

`DELETE /v1/datasets/{dataset}` - deletes a dataset and all its
items

`POST /v1/datasets/{dataset}/properties` - adds a single property to the dataset


### Actions on items

`GET /v1/datasets/{dataset}/items` - returns all items in the dataset

> Support for `limit` and `skip` options is planned

`POST /v1/datasets/{dataset}/items/{item}` - adds a single
item to a dataset

`GET /v1/datasets/{dataset}/items/{item}` - returns a single
item from a dataset

`DELETE /v1/datasets/{dataset}/items/{item}` - deletes a single
item from a dataset
