const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const res = require('express/lib/response');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function userExists(username) {
  return users.some((user) => user.username === username)
}

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  return userExists(username) ? next() : response.status(400).json({ error: 'User not found' });
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;
  if (userExists(username)) {
    return response.status(400).json({ error: 'User already exists' });
  }

  const user = { id: uuidv4(), name, username, todos: [] }
  users.push(user);
  response.status(201).header('location', `/users/${users[users.length - 1].id}`).json(user)
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { username } = request.headers;
  const todos = users.find((user) => user.username == username).todos;
  response.status(200).send(todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { username } = request.headers;

  const user = users.find(user => user.username == username);
  const todo = { id: uuidv4(), title, done: false, deadline: new Date(deadline), created_at: new Date() };
  user.todos.push(todo);
  response.status(201).header('location', `/todos/${user.todos[user.todos.length - 1].id}`).json(todo);
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { username } = request.headers;
  const { title, deadline } = request.body;

  const todo = users.find(user => user.username == username).todos.find(todo => todo.id == id)
  if (!todo) return response.status(404).json({ error: 'Todo not found' });

  todo.title = title;
  todo.deadline = new Date(deadline);

  return response.status(200).json(todo);
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { username } = request.headers;

  const todo = users.find(user => user.username == username).todos.find(todo => todo.id == id)
  if (!todo) return response.status(404).json({ error: 'Todo not found' });

  todo.done = !todo.done;

  return response.status(200).send(todo)
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { username } = request.headers;

  const index = users.find(user => user.username == username).todos.findIndex(todo => todo.id == id)
  if (index == -1) return response.status(404).json({ error: 'Todo not found' });

  users.find(user => user.username == username).todos.splice(index, 1);

  return response.status(204).send()
});

module.exports = app;