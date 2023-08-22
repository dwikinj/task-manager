const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/user");
const {userOneId, userOne, setupDatabase} = require("./fixtures/db")

beforeEach(setupDatabase);

test("Should sign up a new user", async () => {
  const response = await request(app)
    .post("/users")
    .send({
      name: "austin",
      email: "austinblive@gmail.com",
      age: 23,
      password: "olak",
    })
    .expect(201);

  //assert that database was changed correctly
  const user = await User.findOne({ _id: response.body.user._id });
  expect(user).not.toBeNull();

  //Assert about response body
  expect(response.body).toMatchObject({
    user: {
      name: "austin",
      email: "austinblive@gmail.com",
    },
    token: user.tokens[0].token,
  });

  expect(user).not.toBe("olak");
});

test("Should login existing user", async () => {
  const response = await request(app)
    .post("/users/login")
    .send({
      email: userOne.email,
      password: userOne.password,
    })
    .expect(200);

  const user = await User.findById(userOneId);
  expect(response.body.token).toBe(user.tokens[1].token);
});

test("Should not login nonexistent user", async () => {
  await request(app)
    .post("/users/login")
    .send({
      email: userOne.email,
      password: "norFUnny",
    })
    .expect(400);
});

test("Should get user profile", async () => {
  await request(app)
    .get("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
});

test("Shouldn't get user profile", async () => {
  await request(app).get("/users/me").send().expect(401);
});

test("Should delete account for user", async () => {
  await request(app)
    .delete("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  const user = await User.findById(userOneId);
  expect(user).toBeNull();
});

test("Shouldn't delete account for unauthenticated user", async () => {
  await request(app).delete("/users/me").send().expect(401);
});

test("Should upload avatar image", async () => {
  await request(app)
    .post("/users/me/avatar")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .attach("avatar", "tests/fixtures/profile-pic.jpg")
    .expect(200);

  const user = await User.findById(userOneId);
  expect(user.avatar).toEqual(expect.any(Buffer));
});

test("Should update valid user fields", async () => {
  await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      name: "Lilith",
    })
    .expect(202);

  const user = await User.findById(userOneId);
  expect(user.name).toBe("Lilith");
});

test("Shouldn't update invalid user fields", async () => {
  await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      Location: "Pontianak",
    })
    .expect(404);
});

test("Shouldn't signup user with invalid name/email/password", async () => {
  const response = await request(app)
    .post("/users")
    .send({
      name:"",
      email:"popo.com",
      password:""
    })
    .expect(400)
})

test("Should not update user if unauthenticated", async () => {
  const response = await request(app)
    .patch("/users/me")
    .send({
      name:"Miami",
      email:"miami@ecam.com"
    })
    .expect(401)

})

test("Should not update user with invalid name/email/password", async () => {
  const response = await request(app)
    .patch("/users/me")
    .set("Authorization",`Bearer ${userOne.tokens[0].token}`)
    .send({
      name:"",
      email:"paoapos@mail@com"
    })
    .expect(500)
})

test("Should not delete user if unauthenticated", async() => {
  await request(app)
    .delete("/users/me")
    .send()
    .expect(401)
})