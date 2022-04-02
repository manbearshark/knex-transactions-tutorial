const tableName = 'identifiers';

exports.up = async function(knex) {
    await knex.schema.createTable(tableName, function (table) {
        table.increments('id');
        table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.string('identifier', 255);
        table.string('type', 50);
        table.string('platform', 50)
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
