
exports.up = async function (knex) {
  await knex.schema.createTable("assessments", (table) => {
    table.increments("id").primary();

    table
      .integer("student_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("students")
      .onDelete("CASCADE");

    table.date("assessment_date").notNullable();

    table.string("subject", 100).notNullable();

    table.string("topic", 255).notNullable();

    table.string("assessment_type", 50).notNullable();

    table.integer("score").unsigned().notNullable();

    table.integer("total_marks").unsigned().notNullable();

    table.text("remarks").nullable();

    table.timestamps(true, true);

    table.index(["student_id", "assessment_date"]);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("assessments");
};
