const input = document.getElementById("in1");
const addButton = document.getElementById("button");
const list = document.getElementById("list");

const STORAGE_KEY = "todo-list-tasks";

// Each task is { text, done }. The list is kept in localStorage so it
// survives a page reload.
let tasks = loadTasks();

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function render() {
  list.innerHTML = "";
  tasks.forEach((task, index) => {
    const item = document.createElement("li");
    item.classList.toggle("done", task.done);

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.setAttribute("aria-label", "Mark as done");
    checkbox.addEventListener("change", () => {
      task.done = checkbox.checked;
      saveTasks();
      render();
    });

    // textContent, not innerHTML, so typed text is never parsed as HTML.
    const text = document.createElement("span");
    text.className = "text";
    text.textContent = task.text;

    const remove = document.createElement("button");
    remove.className = "delete";
    remove.textContent = "✕";
    remove.setAttribute("aria-label", `Delete "${task.text}"`);
    remove.addEventListener("click", () => {
      tasks.splice(index, 1);
      saveTasks();
      render();
    });

    item.append(checkbox, text, remove);
    list.appendChild(item);
  });
}

function addTask() {
  const text = input.value.trim();
  if (!text) return;
  tasks.push({ text, done: false });
  saveTasks();
  render();
  input.value = "";
  input.focus();
}

addButton.addEventListener("click", addTask);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTask();
});

render();
