import { useEffect, useState } from "react";
import { getTasks, createTask, updateTask, deleteTask } from "./api";

const FILTERS = ["all", "active", "done"];

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Runs once on mount: load tasks from the API
  useEffect(() => {
    getTasks()
      .then(setTasks)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Wrap API calls so errors land in one place
  async function run(action) {
    setError("");
    try {
      await action();
    } catch (e) {
      setError(e.message);
    }
  }

  const handleAdd = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    run(async () => {
      const created = await createTask({ title, priority });
      setTasks((prev) => [created, ...prev]);
      setTitle("");
    });
  };

  const handleToggle = (task) =>
    run(async () => {
      const updated = await updateTask(task.id, { done: !task.done });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    });

  const handleDelete = (id) =>
    run(async () => {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    });

  const startEdit = (task) => {
    setEditingId(task.id);
    setEditText(task.title);
  };

  const saveEdit = (id) =>
    run(async () => {
      const updated = await updateTask(id, { title: editText });
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setEditingId(null);
    });

  // Derived data: no need to store this in state
  const visible = tasks.filter((t) =>
    filter === "all" ? true : filter === "done" ? t.done : !t.done
  );
  const remaining = tasks.filter((t) => !t.done).length;

  return (
    <main className="shell">
      <header className="masthead">
        <h1>Taskboard</h1>
        <p>{remaining} left to do</p>
      </header>

      <form className="composer" onSubmit={handleAdd}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs doing?"
          maxLength={200}
          aria-label="Task title"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          aria-label="Priority"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button type="submit">Add task</button>
      </form>

      <nav className="filters" aria-label="Filter tasks">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={f === filter ? "on" : ""}
            onClick={() => setFilter(f)}
          >
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </nav>

      {error && <p className="error" role="alert">{error}</p>}
      {loading && <p className="hint">Loading tasks…</p>}
      {!loading && visible.length === 0 && (
        <p className="hint">Nothing here. Add a task above.</p>
      )}

      <ul className="list">
        {visible.map((task) => (
          <li key={task.id} className={`row p-${task.priority} ${task.done ? "done" : ""}`}>
            <input
              type="checkbox"
              checked={!!task.done}
              onChange={() => handleToggle(task)}
              aria-label={`Mark "${task.title}" as ${task.done ? "not done" : "done"}`}
            />

            {editingId === task.id ? (
              <input
                className="edit"
                autoFocus
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit(task.id);
                  if (e.key === "Escape") setEditingId(null);
                }}
                onBlur={() => saveEdit(task.id)}
              />
            ) : (
              <span className="title" onDoubleClick={() => startEdit(task)}>
                {task.title}
              </span>
            )}

            <span className="tag">{task.priority}</span>
            <button className="ghost" onClick={() => startEdit(task)}>Edit</button>
            <button className="ghost danger" onClick={() => handleDelete(task.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
