
exports.up = async function (knex) {
  await knex.schema.createTable(
    "parent_report_feedback",
    (table) => {
      table.increments("id").primary();

      table
        .integer("student_id")
        .unsigned()
        .notNullable();

      table
        .foreign("student_id")
        .references("id")
        .inTable("students")
        .onDelete("CASCADE");

      table.date("period_start").notNullable();
      table.date("period_end").notNullable();

      table.text("observations").nullable();
      table.text("improvements").nullable();
      table.text("goals").nullable();

      table.timestamps(true, true);

      table.unique(
        ["student_id", "period_start", "period_end"],
        "unique_student_report_period"
      );
    }
  );
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists(
    "parent_report_feedback"
  );
};
