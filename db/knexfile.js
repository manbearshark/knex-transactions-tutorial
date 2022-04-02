const path = require('path');
// Update with your config settings.

module.exports = {

  development: {
    client: 'postgres',
    connection: {
      host: 'localhost',
      database: 'aws_rt_users',
      user: 'igorkrtolica',
      password: ''
    },
    migrations: {
      tableName: 'knex_migrations'
    },
    useNullAsDefault: true
  }

};