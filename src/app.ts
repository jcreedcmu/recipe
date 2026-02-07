interface Recipe {
  name: string;
  content: string;
  skip: boolean;
}

// Parse recipes
function parseRecipes(data: string): Recipe[] {
  const recipes: Recipe[] = [];
  const parts = data.split(/^===\s*/m);
  for (const part of parts) {
    if (!part.trim()) continue;
    const lines = part.split('\n');
    const firstLine = lines[0].trim();
    const skip = /\[skip\]/.test(firstLine);
    const name = firstLine;
    const content = lines.slice(1).join('\n').trim();
    recipes.push({ name, content, skip });
  }
  return recipes;
}

const recipeList = document.getElementById('recipeList')!;
const recipeDetail = document.getElementById('recipeDetail')!;
const detailContent = document.getElementById('detailContent')!;
const backBtn = document.getElementById('backBtn')!;
const headerTitle = document.getElementById('headerTitle')!;

let recipes: Recipe[] = [];

// Fetch and render recipes
async function init(): Promise<void> {
  const response = await fetch('RECIPE');
  const recipeData = await response.text();
  recipes = parseRecipes(recipeData);
  recipes.sort((a, b) => a.name.replace(/[^[a-zA-Z]/g, '').localeCompare(b.name.replace(/[^[a-zA-Z]/g, '')));

  recipes.forEach((recipe, index) => {
    if (recipe.skip) return;
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

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatListLine(text: string): string {
  const trimmed = text.trim().slice(2); // remove "- "
  if (/^\d/.test(trimmed)) {
    const spaceIndex = trimmed.indexOf(' ');
    if (spaceIndex !== -1) {
      const qty = trimmed.slice(0, spaceIndex);
      const rest = trimmed.slice(spaceIndex + 1).replace(/^ +/, '');
      return `<tr><td>${escapeHtml(qty)}</td><td>${escapeHtml(rest)}</td></tr>`;
    }
  }
  return `<tr><td></td><td>${escapeHtml(trimmed)}</td></tr>`;
}

function formatContent(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isListLine = line.trim().startsWith('- ');
    const isHeading = /^[^:]+:$/.test(line.trim());
    const isEmpty = line.trim() === '';

    // Skip empty lines before/after block elements
    if (isEmpty) {
      const lastResult = result[result.length - 1] || '';
      const nextLine = lines[i + 1]?.trim() || '';
      const lastWasBlock = lastResult.startsWith('<') || inTable;
      const nextIsBlock = nextLine.startsWith('- ') || /^[^:]+:$/.test(nextLine);
      if (lastWasBlock || nextIsBlock) {
        continue;
      }
    }

    if (isListLine && !inTable) {
      result.push('<table>');
      inTable = true;
    } else if (!isListLine && inTable) {
      result.push('</table>');
      inTable = false;
    }

    if (isListLine) {
      result.push(formatListLine(line));
    } else if (isHeading) {
      const heading = line.trim().slice(0, -1);
      result.push(`<h3>${escapeHtml(heading)}</h3>`);
    } else {
      result.push(escapeHtml(line));
    }
  }

  if (inTable) {
    result.push('</table>');
  }

  return result.join('\n');
}

function showRecipe(index: number, pushState: boolean = true): void {
  const recipe = recipes[index];
  detailContent.innerHTML = formatContent(recipe.content);
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
    recipeDetail.classList.add('sliding-out');
    recipeDetail.addEventListener('transitionend', () => {
      recipeDetail.classList.remove('sliding-out');
      history.back();
    }, { once: true });
  }
});
