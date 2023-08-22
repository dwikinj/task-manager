const request = require("supertest");
const Task = require("../src/models/task");
const app = require("../src/app");
const { userOne, setupDatabase, taskZero, taskOne, userTwo, taskTwo, taskThree, userOneId } = require("./fixtures/db");

beforeEach(setupDatabase);

test("Should create task for user", async () => {
  const response = await request(app)
    .post("/tasks")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: "Study nodejs and prisma",
    })
    .expect(201);
  const task = await Task.findById(response.body._id);
  expect(task).not.toBeNull();
  expect(task.completed).toBe(false);
});

test("Should check task for userOne", async () => {
  const response = await request(app)
    .get("/tasks")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  expect(response.body.length).toEqual(3);
});

test("Second user shouldn't delete first task", async () => {
  const response = await request(app)
    .delete(`/tasks/${taskOne._id}`)
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(404);
  const task = await Task.findById(taskOne._id);
  expect(task).not.toBeNull();
});

test("Should not create task with invalid description/completed", async () => {
  await request(app)
    .post("/tasks")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: true,
      completed: "Nope",
    })
    .expect(400);
});

test("Should not update task with invalid description/completed", async () => {
  await request(app)
    .patch(`/tasks/${taskOne._id}`)
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: 12321,
      completed: "Nope",
    })
    .expect(500);

  const task = await Task.findById(taskOne._id)
  expect(task.description).not.toEqual(expect.any(Number))
});

test("Should delete user task", async () => {
  await request(app)
    .delete(`/tasks/${taskTwo._id}`)
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(202)

  const task = await Task.findById(taskTwo._id)
  expect(task).toBeNull()
});

test("Should not delete task if unauthenticated", async () => {
  await request(app)
    .delete(`/tasks/${taskOne._id}`)
    .send()
    .expect(401)

  const task = await Task.findById(taskOne._id)
  expect(task).not.toBeNull()
});

test("Should not update other users task", async () => {
  await request(app)
    .patch(`/tasks/${taskOne._id}`)
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send({
      description: "Updated by userTwo",
      completed: "false"
    })
    .expect(404);

  const task = await Task.findById(taskOne._id)
  expect(task.description).not.toBe("Updated by userTwo")
});

test("Should fetch user task by id", async () => {
  await request(app)
    .get(`/tasks/${taskOne._id}`)
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(202)
});

test("Should not fetch user task by id if unauthenticated", async () => {
  await request(app)
    .get(`/tasks/${taskOne._id}`)
    .send()
    .expect(401)
});

test("Should not fetch other users task by id", async () => {
  await request(app)
    .get(`/tasks/${taskThree._id}`)
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(404)
});

test("Should fetch only completed tasks", async () => {
  await request(app)
    .get(`/tasks/${taskOne._id}`)
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(202)
  const task = await Task.findById(taskOne._id)
  expect(task.completed).toBe(true);


});

test("Should fetch only incomplete tasks", async () => {
  await request(app)
    .get(`/tasks/${taskTwo._id}`)
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(202)
  const task = await Task.findById(taskTwo._id)
  expect(task.completed).not.toBeTruthy();
});

test("Should sort tasks by description/completed/createdAt/updatedAt", async () => {
  const response = await request(app)
    .get("/tasks?completed=true")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)
  
  expect(response.body.length).toBe(2)

});

test("Should fetch page of tasks", async () => {
  const response = await request(app)
    .get("/tasks")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)
  
  expect(response.body).not.toBeNull()
});