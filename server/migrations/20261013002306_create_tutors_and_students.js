
exports.up = async function (knex) {
  await knex.schema.createTable("tutors", (table) => {
    table.increments("id").primary();

    table.string("email", 255).notNullable().unique();
    table.string("password_hash", 255).notNullable();
    table.string("name", 150).notNullable();

    table
      .enu("role", ["owner", "tutor"])
      .notNullable()
      .defaultTo("owner");

    table
      .enu("status", ["active", "disabled"])
      .notNullable()
      .defaultTo("active");

    table.integer("invited_by").unsigned().nullable();

    table
      .foreign("invited_by")
      .references("id")
      .inTable("tutors")
      .onDelete("SET NULL");

    table.timestamp("created_at").notNullable()
      .defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("students", (table) => {
    table.increments("id").primary();

    table.integer("tutor_id").unsigned().notNullable();

    table
      .foreign("tutor_id")
      .references("id")
      .inTable("tutors")
      .onDelete("CASCADE");

    table.string("first_name", 100).notNullable();

    table.tinyint("grade").unsigned().notNullable();

    table.string("province", 100).nullable();
    table.string("timezone", 100).notNullable()
      .defaultTo("America/Regina");

    table.string("parent_name", 150).nullable();
    table.string("parent_contact", 255).nullable();

    table.decimal("fee", 10, 2).nullable();
    table.string("currency", 3).notNullable()
      .defaultTo("CAD");

    table
      .enu("status", ["active", "paused", "ended"])
      .notNullable()
      .defaultTo("active");

    table.date("consent_date").nullable();
    table.json("goals").nullable();

    table.timestamp("created_at").notNullable()
      .defaultTo(knex.fn.now());

    table.index(["tutor_id", "status"]);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("students");
  await knex.schema.dropTableIfExists("tutors");
};
