
exports.up = async function (knex) {
  await knex.schema.alterTable("parent_report_feedback", (table) => {
    table
      .boolean("is_sent")
      .notNullable()
      .defaultTo(false);

    table.timestamp("sent_at").nullable();

    table
      .string("delivery_method", 30)
      .nullable();
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("parent_report_feedback", (table) => {
    table.dropColumn("delivery_method");
    table.dropColumn("sent_at");
    table.dropColumn("is_sent");
  });
};
