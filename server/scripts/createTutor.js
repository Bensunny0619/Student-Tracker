
const argon2 = require("argon2");
const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");
const db = require("../config/db");

async function createTutor() {
  const rl = readline.createInterface({
    input: stdin,
    output: stdout,
  });

  try {
    const name = (await rl.question("Tutor name: ")).trim();

    const email = (await rl.question("Tutor email: "))
      .trim()
      .toLowerCase();

    const password = await rl.question(
      "Password (minimum 12 characters): "
    );

    if (!name || !email.includes("@") || password.length < 12) {
      throw new Error(
        "Enter a name, valid email, and password of at least 12 characters."
      );
    }

    const existingTutor = await db("tutors")
      .where({ email })
      .first();

    if (existingTutor) {
      throw new Error("A tutor with this email already exists.");
    }

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    await db("tutors").insert({
      name,
      email,
      password_hash: passwordHash,
      role: "owner",
      status: "active",
    });

    console.log("Tutor account created successfully!");
  } catch (error) {
    console.error("Could not create tutor:", error.message);
  } finally {
    rl.close();
    await db.destroy();
  }
}

createTutor();
