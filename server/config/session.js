
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);

function createSessionMiddleware() {
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is required");
  }

  const store = new MySQLStore({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    createDatabaseTable: true,
    schema: {
      tableName: "sessions",
    },
  });

  return session({
    name: "tracker.sid",
    secret: process.env.SESSION_SECRET,
    store,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  });
}

module.exports = createSessionMiddleware;
