'use strict';

const db = require('../db');

// to make this idempotent, we should drop the session table before creating it
let queryString = `CREATE TABLE "session" (
                    "sid" varchar NOT NULL COLLATE "default",
                    "sess" json NOT NULL,
                    "expire" timestamp(6) NOT NULL
                  )
                  WITH (OIDS=FALSE);
                  ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;`

console.log(' [*] Setup script beginning...')

// should add proper error handling
db.query(queryString, (err, res) => {
  console.log(err, res)
  console.log(' [*] Setup script complete')
  db.end()
})
