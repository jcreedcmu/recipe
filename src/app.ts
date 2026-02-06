interface Recipe {
  name: string;
  content: string;
}

// Parse recipes
function parseRecipes(data: string): Recipe[] {
  const recipes: Recipe[] = [];
  const parts = data.split(/^===\s*/m);
  for (const part of parts) {
    if (!part.trim()) continue;
    const lines = part.split('\n');
    const name = lines[0].trim();
    const content = lines.slice(1).join('\n').trim();
    recipes.push({ name, content });
  }
  return recipes;
}

const recipeList = document.getElementById('recipeList')!;
const recipeDetail = document.getElementById('recipeDetail')!;
const detailTitle = document.getElementById('detailTitle')!;
const detailContent = document.getElementById('detailContent')!;
const backBtn = document.getElementById('backBtn')!;
const headerTitle = document.getElementById('headerTitle')!;

let recipes: Recipe[] = [];

// Fetch and render recipes
async function init(): Promise<void> {
  const response = await fetch('RECIPE');
  const recipeData = await response.text();
  recipes = parseRecipes(recipeData);

  recipes.forEach((recipe, index) => {
    const item = document.createElement('div');
    item.className = 'recipe-item';
    item.innerHTML = `<h2>${recipe.name}</h2>`;
    item.addEventListener('click', () => showRecipe(index));
    recipeList.appendChild(item);
  });

  // Handle initial hash in URL
  const hash = window.location.hash.slice(1);
  if (hash && recipes[parseInt(hash)]) {
    showRecipe(parseInt(hash), false);
  }
}

init();

function showRecipe(index: number, pushState: boolean = true): void {
  const recipe = recipes[index];
  detailTitle.textContent = recipe.name;
  detailContent.textContent = recipe.content;
  recipeList.classList.add('hidden');
  recipeDetail.classList.add('visible');
  backBtn.classList.add('visible');
  headerTitle.textContent = recipe.name;
  if (pushState) {
    history.pushState({ recipe: index }, '', `#${index}`);
  }
}

function showList(): void {
  recipeList.classList.remove('hidden');
  recipeDetail.classList.remove('visible');
  backBtn.classList.remove('visible');
  headerTitle.textContent = 'Recipes';
}

backBtn.addEventListener('click', () => history.back());

window.addEventListener('popstate', (event: PopStateEvent) => {
  if (event.state && event.state.recipe !== undefined) {
    showRecipe(event.state.recipe, false);
  } else {
    showList();
  }
});

// Swipe gesture support
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (e: TouchEvent) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchend', (e: TouchEvent) => {
  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;
  const deltaX = touchEndX - touchStartX;
  const deltaY = Math.abs(touchEndY - touchStartY);

  // Swipe right to go back (only when viewing a recipe)
  if (deltaX > 80 && deltaY < 100 && recipeDetail.classList.contains('visible')) {
    history.back();
  }
});
