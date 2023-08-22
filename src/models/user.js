const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Task = require("./task")

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    validate: [validator.isEmail, "Invalid email"],
  },
  password: {
    type: String,
    required: true,
    trim: true,
  },
  age: {
    type: Number,
    required: true,
    validate: [(value) => value > 0, "Age must be positive"],
  },
  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],
  avatar: {
    type: Buffer
  }
}, {
  timestamps: true

});

userSchema.virtual("task", {
  ref: "Task",
  localField: "_id",
  foreignField: "owner"
})

userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id }, "everythingwillbeokay");

  user.tokens = user.tokens.concat({ token });
  await user.save();

  return token;
};

userSchema.methods.toJSON =  function () {
  const user = this.toObject();
  delete user.password
  delete user.tokens
  delete user.avatar
  return user

}

userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email: email })
  if (!user) {
    throw new Error("Unable to login");
  }

  const isPassValid = await bcrypt.compare(password, user.password);

  if (!isPassValid) {
    throw new Error("Unable to login");
  }

  return user;
};

//encrypt password during save()

userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    const saltRound = 10;
    const geneSalt = await bcrypt.genSalt(saltRound);
    user.password = await bcrypt.hash(user.password, geneSalt);
  }
  next();
});

userSchema.pre("deleteOne", {document : true}, async function (next){
  const user = this;
  await Task.deleteMany({owner: user._id});
  next()

})

const User = mongoose.model("User", userSchema);

module.exports = User;
