// Parse recipes
function parseRecipes(data) {
  const recipes = [];
  const parts = data.split(/^===\s*/m);
  for (const part of parts) {
    if (!part.trim()) continue;
    const lines = part.split('\n');
    const name = lines[0].trim().replace(/\s*META:.*$/, '');
    const content = lines.slice(1).join('\n').trim();
    recipes.push({ name, content });
  }
  return recipes;
}

const recipeList = document.getElementById('recipeList');
const recipeDetail = document.getElementById('recipeDetail');
const detailTitle = document.getElementById('detailTitle');
const detailContent = document.getElementById('detailContent');
const backBtn = document.getElementById('backBtn');
const headerTitle = document.getElementById('headerTitle');

let recipes = [];

// Fetch and render recipes
fetch('RECIPE')
  .then(response => response.text())
  .then(recipeData => {
    recipes = parseRecipes(recipeData);
    recipes.forEach((recipe, index) => {
      const item = document.createElement('div');
      item.className = 'recipe-item';
      item.innerHTML = `<h2>${recipe.name}</h2>`;
      item.addEventListener('click', () => showRecipe(index));
      recipeList.appendChild(item);
    });
  });

function showRecipe(index) {
  const recipe = recipes[index];
  detailTitle.textContent = recipe.name;
  detailContent.textContent = recipe.content;
  recipeList.classList.add('hidden');
  recipeDetail.classList.add('visible');
  backBtn.classList.add('visible');
  headerTitle.textContent = recipe.name;
}

function showList() {
  recipeList.classList.remove('hidden');
  recipeDetail.classList.remove('visible');
  backBtn.classList.remove('visible');
  headerTitle.textContent = 'Recipes';
}

backBtn.addEventListener('click', showList);
