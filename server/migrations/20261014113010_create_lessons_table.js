
exports.up = async function (knex) {
  await knex.schema.createTable("lessons", (table) => {
    table.increments("id").primary();

    table
      .integer("student_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("students")
      .onDelete("CASCADE");

    table.date("lesson_date").notNullable();

    table.string("subject", 100).notNullable();
    table.string("topic", 255).notNullable();

    table.integer("duration_minutes").unsigned().notNullable();

    table.text("lesson_notes").nullable();
    table.text("homework").nullable();
    table.text("performance_notes").nullable();

    table.timestamps(true, true);

    table.index(["student_id", "lesson_date"]);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("lessons");
};
