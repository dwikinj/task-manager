const express = require("express");
const multer = require("multer");
const path = require("path");
const sharp = require("sharp");
const router = new express.Router();
const User = require("../models/user");
const auth = require("../middleware/auth");
const { sendWelcomeEmail, sendCancelEmail } = require("../emails/account")

router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];

    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (e) {
    res.status(400).send(e.message);
  }
});

router.patch("/users/me", auth, async (req, res) => {
  //check if client provided valid property request
  const updates = Object.keys(req.body);
  const allowedProps = Object.keys(User.schema.obj);
  const isCLientPropsValid = updates.every((prop) =>
    allowedProps.includes(prop)
  );

  if (!isCLientPropsValid) {
    return res.status(404).send({ Error: "Invalid props provided for update" });
  }

  try {
    updates.forEach((prop) => {
      req.user[prop] = req.body[prop];
    });
    await req.user.save();
    res.status(202).send(req.user);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.deleteOne();
    sendCancelEmail(req.user.email,req.user.name)
    res.send(req.user);
  } catch (error) {
    res.status(500).send();
  }
});

router.post("/users", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    sendWelcomeEmail(user.email,user.name)
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e.message);
  }
});

const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /\.(jpg|jpeg|png)$/i;

    if (allowedExtensions.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error("File harus memiliki ekstensi .jpg, .jpeg atau .png"));
    }
  },
});

router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const resizeImgBuffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .toBuffer();

    req.user.avatar = resizeImgBuffer;
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

router.delete("/users/me/avatar", auth, async (req, res) => {
  try {
    if (req.user.avatar) {
      req.user.avatar = undefined;
      await req.user.save();
      res.send();
    }
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

router.get("/users/:id/avatar", async (req, res) => {
  const user = await User.findById(req.params.id);
  try {
    if (!user || !user.avatar) {
      throw new Error();
    }
    res.set("Content-Type", "image/jpg");
    res.send(user.avatar);
  } catch (error) {
    res.status(400).send();
  }
});

module.exports = router;
