const tableName = 'addresses';

exports.up = function(knex) {
    await knex.schema.createTable(tableName, function (table) {
        table.increments('id');
        table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.string('address1', 255);
        table.string('address2', 255);
        table.string('country', 50);
        table.string('city', 50);
        table.string('state', 50);
        table.string('zipcode', 15);
        table.timestamps(false, true);
    });

    await knex.raw(`
        CREATE TRIGGER update_timestamp
        BEFORE UPDATE
        ON ${tableName}
        FOR EACH ROW
        EXECUTE PROCEDURE update_timestamp();
    `);
};

exports.down = function(knex) {
    return knex.schema.dropTable(tableName);
};
