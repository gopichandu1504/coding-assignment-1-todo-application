const express = require("express");
const app = express();

app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");

const datefns = require("date-fns");

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
};

initializeDBAndServer();

const convertDBObjectToTodoObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    category: dbObject.category,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

const validPriority = (priority) => {
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    return priority;
  } else if (priority === undefined) {
    return "abc";
  } else {
    return;
  }
};
const validStatus = (status) => {
  if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
    return status;
  } else if (status === undefined) {
    return "abc";
  } else {
    return;
  }
};

const validCategory = (category) => {
  if (category === "WORK" || category === "HOME" || category === "LEARNING") {
    return category;
  } else if (category === undefined) {
    return "abc";
  } else {
    return;
  }
};

//API 1

app.get("/todos/", async (request, response) => {
  let { priority, status, category, search_q = "" } = request.query;

  let getTodo = "";

  if (
    (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") &&
    (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW")
  ) {
    getTodo = `
      select *
      from
      todo
      where
      todo like '%${search_q}%'
      and
      status='${status}'
      and
      priority='${priority}';
      `;
  } else if (
    (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") &&
    (category === "HOME" || category === "WORK" || category === "LEARNING")
  ) {
    getTodo = `
      select *
      from
      todo
      where
      todo like '%${search_q}%'
      and
      status='${status}'
      and
      category='${category}';
      `;
  } else if (
    (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") &&
    (category === "HOME" || category === "WORK" || category === "LEARNING")
  ) {
    getTodo = `
      select *
      from
      todo
      where
      todo like '%${search_q}%'
      and
      category='${category}'
      and
      priority='${priority}';
      `;
  } else {
    if (status !== undefined) {
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodo = `
      select *
      from
      todo
      where
      todo like '%${search_q}%'
      and
      status='${status}'
      ;`;
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
        return;
      }
    } else if (priority !== undefined) {
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodo = `
            select
            *
            from
            todo
            where
            todo like'%${search_q}%'
            and
            priority='${priority}'
            `;
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
        return;
      }
    } else if (category !== undefined) {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodo = `
            select
            *
            from
            todo
            where
            todo like'%${search_q}%'
            and
            category='${category}'
            `;
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
        return;
      }
    } else {
      getTodo = `
        select *
        from
        todo
        where
        todo like '%${search_q}%';
        `;
    }
  }
  const result = await db.all(getTodo);
  response.send(result.map((todo) => convertDBObjectToTodoObject(todo)));
});

//API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodo = `
  select
  *
  from
  todo
  where
  id=${todoId};
  `;
  const todo = await db.get(getTodo);
  response.send(convertDBObjectToTodoObject(todo));
});

//API 3

app.get("/agenda/", async (request, response) => {
  let { date } = request.query;
  let getTodo = "";
  let year = null;
  let month = null;
  let day = null;
  date = date.split("-");
  year = parseInt(date[0]);
  month = parseInt(date[1]);
  day = parseInt(date[2]);
  if (month >= 1 && month <= 12) {
    month = parseInt(date[1]);
  } else {
    response.status(400);
    response.send("Invalid Due Date");
    return;
  }
  if (month == 2) {
    if ((0 === year % 4 && 0 !== year % 100) || 0 === year % 400) {
      if (day >= 1 && day <= 29) {
        day = parseInt(date[2]);
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } else {
      if (day >= 1 && day <= 28) {
        day = date[2];
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    }
  } else {
    if (day >= 1 && day <= 31) {
      day = parseInt(date[2]);
    } else {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }
  date = datefns.format(new Date(year, month - 1, day), "yyyy-MM-dd");
  getTodo = `
    select *
    from 
    todo
    where
    due_date='${date}';
    `;

  const result = await db.all(getTodo);
  response.send(result.map((todo) => convertDBObjectToTodoObject(todo)));
});

//API 4
app.post("/todos/", async (request, response) => {
  let { id, todo, priority, status, category, dueDate } = request.body;
  if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
    status = `${status}`;
  } else {
    response.status(400);
    response.send("Invalid Todo Status");
    return;
  }
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    priority = `${priority}`;
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
    return;
  }

  if (category === "WORK" || category === "HOME" || category === "LEARNING") {
    category = `${category}`;
  } else {
    response.status(400);
    response.send("Invalid Todo Category");
    return;
  }
  let year = null;
  let month = null;
  let day = null;
  dueDate = dueDate.split("-");
  year = parseInt(dueDate[0]);
  month = parseInt(dueDate[1]);
  day = parseInt(dueDate[2]);
  if (month >= 1 && month <= 12) {
    month = parseInt(dueDate[1]);
  } else {
    response.status(400);
    response.send("Invalid Due Date");
    return;
  }
  if (month == 2) {
    if ((0 === year % 4 && 0 !== year % 100) || 0 === year % 400) {
      if (day >= 1 && day <= 29) {
        day = parseInt(dueDate[2]);
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } else {
      if (day >= 1 && day <= 28) {
        day = dueDate[2];
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    }
  } else {
    if (day >= 1 && day <= 31) {
      day = parseInt(dueDate[2]);
    } else {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }
  dueDate = datefns.format(new Date(year, month - 1, day), "yyyy-MM-dd");
  console.log(dueDate);
  const postTodo = `
  insert into todo(id,todo,category,priority,status,due_date)
  values(
      ${id},
      '${todo}',
      '${category}',
       '${priority}',
       '${status}',     
      '${dueDate}'
      
  );
  `;
  await db.run(postTodo);
  response.send("Todo Successfully Added");
});

//API 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let { todo, status, priority, category, dueDate } = request.body;
  let msg = "";
  let updateTodo = "";
  if (status !== undefined) {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      updateTodo = `
      update todo
      set
      status='${status}'
      where
      id=${todoId}
      ;`;
      msg = "Status";
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  } else if (priority !== undefined) {
    if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
      updateTodo = `
        update todo
        set
        priority='${priority}'
        where
        id=${todoId}
            `;
      msg = "Priority";
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  } else if (category !== undefined) {
    if (category === "WORK" || category === "HOME" || category === "LEARNING") {
      updateTodo = `
        update todo
        set
        category='${category}'
        where
        id=${todoId}
            `;
      msg = "Category";
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  } else if (todo !== undefined) {
    updateTodo = `
        update todo
        set
        todo='${todo}'
        where
        id=${todoId}
            `;
    msg = "Todo";
  } else if (dueDate !== undefined) {
    let year = null;
    let month = null;
    let day = null;
    dueDate = dueDate.split("-");
    year = parseInt(dueDate[0]);
    month = parseInt(dueDate[1]);
    day = parseInt(dueDate[2]);
    if (month >= 1 && month <= 12) {
      month = parseInt(dueDate[1]);
    } else {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
    if (month == 2) {
      if ((0 === year % 4 && 0 !== year % 100) || 0 === year % 400) {
        if (day >= 1 && day <= 29) {
          day = parseInt(dueDate[2]);
        } else {
          response.status(400);
          response.send("Invalid Due Date");
          return;
        }
      } else {
        if (day >= 1 && day <= 28) {
          day = dueDate[2];
        } else {
          response.status(400);
          response.send("Invalid Due Date");
          return;
        }
      }
    } else {
      if (day >= 1 && day <= 31) {
        day = parseInt(dueDate[2]);
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    }
    dueDate = datefns.format(new Date(year, month - 1, day), "yyyy-MM-dd");
    updateTodo = `
    update todo
    set
    due_date='${dueDate}'
    where 
    id=${todoId}
    `;
    msg = "Due Date";
  }
  await db.run(updateTodo);
  response.send(`${msg} Updated`);
});

//API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodo = `
  delete from todo
  where
  id=${todoId};
  `;
  await db.run(deleteTodo);
  response.send("Todo Deleted");
});

module.exports = app;
