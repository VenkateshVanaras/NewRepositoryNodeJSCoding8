const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();
app.use(express.json());
let database = null;
const initializerDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error : ${error.message}`);
    process.exit(1);
  }
};
initializerDbAndServer();

const haspriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const haspriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasstatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let gettodosQuery = "";
  let data = null;
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case haspriorityAndStatusProperties(request.query):
      gettodosQuery = `SELECT * FROM 
    todo 
    WHERE 
     todo LIKE '%${search_q}%'
     AND status = '${status}'
     AND priority= '${priority}';`;
      break;
    case haspriorityProperty(request.query):
      gettodosQuery = `
    SELECT * FROM 
    todo
    WHERE
      todo LIKE '%${search_q}%'
      AND
      priority= '${priority}';
    `;
      break;
    case hasstatusProperty(request.query):
      gettodosQuery = `
    SELECT * FROM
    todo 
    WHERE 
     todo LIKE '%${search_q}%'
     AND
     status='${status}';`;
      break;

    default:
      gettodosQuery = `
    SELECT * FROM
    todo
    WHERE 
     todo LIKE '%${search_q}%'`;
  }
  data = await database.all(gettodosQuery);
  response.send(data);
});

const convertDbtoResponse = (newTodo) => {
  return {
    id: newTodo.id,
    todo: newTodo.todo,
    priority: newTodo.priority,
    status: newTodo.status,
  };
};
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getQuery = `
  SELECT * FROM todo
  WHERE id=${todoId};`;
  const newTodo = await database.get(getQuery);
  response.send(convertDbtoResponse(newTodo));
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postQuery = `
  INSERT INTO todo(id,todo,priority,status)
  VALUES (${id},'${todo}','${priority}','${status}');`;
  await database.run(postQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateQuery = "";
  const requestBody = request.body;

  switch (true) {
    case requestBody.status !== undefined:
      updateQuery = "Status";
      break;
    case requestBody.priority !== undefined:
      updateQuery = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateQuery = "Todo";
      break;
  }
  const priviousTodoquery = `
  SELECT * FROM todo
  WHERE id=${todoId};`;
  const previousTodo = await database.get(priviousTodoquery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;
  const updateTodoQuery = `
   UPDATE 
     todo
   SET 
     todo='${todo}',
     priority='${priority}',
     status='${status}'
   WHERE 
    id= ${todoId};`;
  await database.run(updateTodoQuery);
  response.send(`${updateQuery} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
  DELETE FROM todo
  WHERE id=${todoId}`;
  await database.run(deleteQuery);
  response.send("Todo Deleted");
});
module.exports = app;
