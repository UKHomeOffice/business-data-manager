![Logo of the project](./documents/images/cube.png)

# Business Data Manager

> A lightweight, flexible business data management solution

Business Data Manager enables business data to be stored and
managed through a web application and API. Multiple datasets can be created
and managed.

Rather than having a fixed set of collections (one for each dataset); it
represents the datasets as a resource type and then all data items are
sub-resources of these highest level resources.


## Configuration

The application requires the following environment variables to be set prior to
launch:

```
export ENV=dev  # setting this to 'production' changes the log format to 'short'
export LOG_LEVEL=info
export NAME=business-data-manager
export PORT=8080
export SESSION_SECRET=psC6bLKZbU68rybz3YSk42Jf5btK9mbS6exJ  # replace with a random string
export TITLE='Business Data Manager'

export PGHOST=localhost
export PGPORT=5432
export PGUSER=bdm
export PGDATABASE=bdm
export PGPASSWORD=badpassword
```

## Setting up locally

> Run `yarn install`
> Install postgres 13.x `brew search postgresql && brew install postgresql`
>
> Add the following lines to your .bashrc or .zshrc file (which ever shell you use)
>
```
export PATH="/usr/local/opt/postgresql/bin:$PATH"
export LDFLAGS="-L/usr/local/opt/postgresql/lib"
export CPPFLAGS="-I/usr/local/opt/postgresql/include"
export PKG_CONFIG_PATH="/usr/local/opt/postgresql/lib/pkgconfig"
```
>
> Create user bdm (change admin with your current username)
> `psql -U admin -d postgres -c 'CREATE USER bdm; ALTER USER bdm WITH SUPERUSER;'`
>
> Create database bdm
> `psql -U admin -d postgres -c 'CREATE DATABASE bdm;'`
>
> Modify `/usr/local/var/postgresql/postgresql.conf`
> to change the line containing `listen_addresses = ` to read `listen_addresses = '*'`
>
> Then reload the shell to load new settings and finally run this command to start psql service
>
> `brew services start postgresql`
>
> Now run the following commands
>
> `yarn install`
> `yarn build`
> `yarn setup`
>
> Then to start the project we run:

> `yarn start`
>
> Note: You might have to restart the laptop if postgress is refusing the connection.
>

## Building with Drone

We use Drone to automatically build the image and push it to Quay.io

## Running in Kubernetes

The application is designed to be deployed in Kubernetes and expects the
PostgreSQL database to be provisioned separately to the `kubectl` scripts
(usually in RDS).

The `kubernetes` scripts included in this repo are only intended for use with
`kd` as part of the Drone CI pipeline. As they use variable substitution, if
using them outside of the Drone CI pipeline you will have to provide valid
values for several variables:

| Kube file | Variable | Description |
|-----------|----------|-------------|
| deployment.yml | DRONE_COMMIT_SHA | The commit sha reference for the docker image to deploy |
| ingress.yml | HOSTNAME | The URL that the service will be accessed via |
| secret.yml | KEYCLOAK_CLIENT_ID | The client id for the Keycloak realm |
| secret.yml | KEYCLOAK_CLIENT_SECRET | The client secret for the Keycloak realm |
| secret.yml | KEYCLOAK_DISCOVERY | The discovery endpoint for the Keycloak realm |

The Keycloak variables need to be `base64` encoded.

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

Currently PostgreSQL version `13.x` is supported (other versions may work, but they are not supported).

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

`PUT /v1/datasets/{dataset}/items/{item}` - update a single item

`DELETE /v1/datasets/{dataset}/items/{item}` - deletes a single
item from a dataset

### Database backup and restore
Database backups are made by AWS/ACP nightly and are stored for 7 days.

To restore a database you will need to ask ACP to start a snapshot of the database and then you can copy and restore this to the main database yourself.

You will need to get the connection details from ACP for the snapshot.

ssh in to the bdm pod and run:

To dump the snapshot db to a file:
```sql
pg_dump -cFc -d {snapshot DB} -h {snapshot host} -U {snapshot user} > bdm.dump
```

To load the snapshot dump from the file in to BDM:
```sql
pg_restore -c --single-transaction -d $PGDATABASE -h $PGHOST -U $PGUSER bdm.dump
```
