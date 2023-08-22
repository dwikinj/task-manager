const mongoose = require("mongoose");

async function main() {
  let connection;

  try {
    connection = await mongoose.connect(
      process.env.MONGOD_URL
    );
    if (connection) {
      console.log("Connect to MongoDB");
    }
  } catch (error) {
    console.log("Error:", error.message);
  }
}
main();
