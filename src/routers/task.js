const express = require("express");
const router = new express.Router();
const Task = require("../models/task");
const User = require("../models/user");
const auth = require("../middleware/auth");

router.post("/tasks", auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id,
  });

  await task
    .save()
    .then(() => {
      res.status(201).send(task);
    })
    .catch((e) => {
      res.status(400).send(e.message);
    });
});

//GET /tasks?completed=true
//GET /task?limit=10&skip=0
//GET /task?sortBy=createdAt:desc
router.get("/tasks", auth, async (req, res) => {
  const match = {};
  const sort = {};

  if (req.query.completed) {
    match.completed = req.query.completed === "true";
    console.log(req.query.completed);
  }

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    console.log(parts);
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  }

  try {
    const user = await User.findById(req.user._id);
    await user.populate({
      path: "task",
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort,
      },
    });
    if (!user || user.task.length === 0) {
      return res.status(400).send({});
    }
    res.status(200).send(user.task);
  } catch (e) {
    return res.status(500).send(e.message);
  }
});

router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const task = await Task.findOne({ _id: _id, owner: { _id: req.user._id } });

    if (!task) {
      return res.status(404).send({ error: "Task not found" });
    }

    res.status(202).send(task);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).send({ error: "Invalid Id Format" });
    }
    return res.status(500).send();
  }
});

router.patch("/tasks/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = Object.keys(Task.schema.obj);
  const isCLientPropsValid = updates.every((prop) =>
    allowedUpdates.includes(prop)
  );

  if (!isCLientPropsValid) {
    return res.status(400).send({ Error: "Invalid props provided for update" });
  }

  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!task) {
      return res.status(404).send({ Error: "Task not found !" });
    }

    updates.forEach((update) => {
      task[update] = req.body[update];
    });
    await task.save();
    res.status(202).send(task);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).send({ Error: "Id are not proper" });
    }
    res.status(500).send({ Error: error.message });
  }
});

router.delete("/tasks/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOneAndRemove({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!task) {
      return res.status(404).send({ Error: "Task not found!" });
    }
    res.status(202).send(`Task deleted : ${task}`);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).send({ Error: "Invalid id" });
    }
    res.status(500).send({ Error: error });
  }
});

module.exports = router;
