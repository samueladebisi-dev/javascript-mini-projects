const userInput = document.getElementById('userInput');

const lowerCaseEl = document.getElementById('lowercase');
const upperCaseEl = document.getElementById('uppercase');
const camelCaseEl = document.getElementById('camelcase');
const pascalCaseEl = document.getElementById('pascalcase');
const snakeCaseEl = document.getElementById('snakecase');
const kebabCaseEl = document.getElementById('kebabcase');
const trimEl = document.getElementById('trim');

const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);

function transform() {
  const text = userInput.value.trim();
  // Split on any run of whitespace so repeated spaces don't create empty words.
  const words = text ? text.split(/\s+/) : [];
  const lowerWords = words.map((w) => w.toLowerCase());
  const pascalCase = lowerWords.map(capitalize).join('');

  lowerCaseEl.textContent = text.toLowerCase();
  upperCaseEl.textContent = text.toUpperCase();
  camelCaseEl.textContent = pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
  pascalCaseEl.textContent = pascalCase;
  snakeCaseEl.textContent = lowerWords.join('_');
  kebabCaseEl.textContent = lowerWords.join('-');
  trimEl.textContent = words.join('');
}

userInput.addEventListener('input', transform);
// Pressing Enter would otherwise submit the form and reload the page.
userInput.form.addEventListener('submit', (e) => e.preventDefault());
transform();
