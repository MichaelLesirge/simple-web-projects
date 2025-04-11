// Game state
const gameState = {
    money: 1000,
    citizens: 0,
    happiness: 50,
    selectedTool: null,
    buildings: [],
    trees: [],
    gridSize: 40,
    lastTaxTime: Date.now(),
    taxInterval: 5000 // 5 seconds
};

// Building types
const buildingTypes = {
    house: {
        name: "House",
        cost: 200,
        width: 2,
        height: 2,
        color: "#8d6e63",
        citizens: 5,
        happinessImpact: 0,
        income: 2
    },
    shop: {
        name: "Shop",
        cost: 300,
        width: 3,
        height: 2,
        color: "#78909c",
        citizens: 2,
        happinessImpact: 5,
        income: 5
    },
    school: {
        name: "School",
        cost: 500,
        width: 4,
        height: 3,
        color: "#5c6bc0",
        citizens: 1,
        happinessImpact: 10,
        income: 8
    }
};

// Green infrastructure types
const greenTypes = {
    tree: {
        name: "Tree",
        cost: 50,
        width: 1,
        height: 1,
        color: "#2e7d32",
        happinessImpact: 2,
        growthTime: 3000,
        mature: false
    },
    park: {
        name: "Park",
        cost: 150,
        width: 3,
        height: 3,
        color: "#66bb6a",
        happinessImpact: 15,
        growthTime: 5000,
        mature: false
    },
    garden: {
        name: "Community Garden",
        cost: 250,
        width: 4,
        height: 2,
        color: "#43a047",
        happinessImpact: 20,
        growthTime: 7000,
        mature: false
    }
};

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const tooltip = document.getElementById('tooltip');

// UI elements
document.getElementById('houseBtn').addEventListener('click', () => selectTool('house'));
document.getElementById('shopBtn').addEventListener('click', () => selectTool('shop'));
document.getElementById('schoolBtn').addEventListener('click', () => selectTool('school'));
document.getElementById('treeBtn').addEventListener('click', () => selectTool('tree'));
document.getElementById('parkBtn').addEventListener('click', () => selectTool('park'));
document.getElementById('gardenBtn').addEventListener('click', () => selectTool('garden'));

// Select building or green infrastructure tool
function selectTool(tool) {
    gameState.selectedTool = tool;
    highlightSelectedButton();
}

// Highlight the selected button
function highlightSelectedButton() {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.style.backgroundColor = '#4caf50';
    });
    
    if (gameState.selectedTool) {
        const selectedButton = document.getElementById(`${gameState.selectedTool}Btn`);
        if (selectedButton) {
            selectedButton.style.backgroundColor = '#ff9800';
        }
    }
}

// Handle canvas clicks
canvas.addEventListener('click', (e) => {
    if (!gameState.selectedTool) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / gameState.gridSize);
    const y = Math.floor((e.clientY - rect.top) / gameState.gridSize);
    
    // Check if space is available
    if (isSpaceAvailable(x, y, gameState.selectedTool)) {
        placeItem(x, y, gameState.selectedTool);
    }
});

// Show tooltip on hover
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / gameState.gridSize);
    const y = Math.floor((e.clientY - rect.top) / gameState.gridSize);
    
    // Check for buildings or trees at this position
    const building = gameState.buildings.find(b => 
        x >= b.x && x < b.x + b.width && 
        y >= b.y && y < b.y + b.height
    );
    
    const tree = gameState.trees.find(t => 
        x >= t.x && x < t.x + t.width && 
        y >= t.y && y < t.y + t.height
    );
    
    if (building || tree) {
        const item = building || tree;
        const type = building ? buildingTypes[item.type] : greenTypes[item.type];
        
        tooltip.style.display = 'block';
        tooltip.style.left = `${e.clientX + 10}px`;
        tooltip.style.top = `${e.clientY + 10}px`;
        
        let tooltipText = `<strong>${type.name}</strong><br>`;
        if (building) {
            tooltipText += `Citizens: ${item.currentCitizens}/${item.maxCitizens}<br>`;
            tooltipText += `Income: $${type.income}<br>`;
        }
        tooltipText += `Happiness: +${type.happinessImpact}%`;
        
        if (tree && !item.mature) {
            tooltipText += `<br>(Growing...)`;
        }
        
        tooltip.innerHTML = tooltipText;
    } else {
        tooltip.style.display = 'none';
    }
});

// Check if space is available
function isSpaceAvailable(x, y, type) {
    const itemType = buildingTypes[type] || greenTypes[type];
    const width = itemType.width;
    const height = itemType.height;
    
    // Check boundaries
    if (x < 0 || y < 0 || x + width > canvas.width/gameState.gridSize || y + height > canvas.height/gameState.gridSize) {
        return false;
    }
    
    // Check for overlapping items
    for (let i = x; i < x + width; i++) {
        for (let j = y; j < y + height; j++) {
            const hasBuilding = gameState.buildings.some(b => 
                i >= b.x && i < b.x + b.width && 
                j >= b.y && j < b.y + b.height
            );
            
            const hasTree = gameState.trees.some(t => 
                i >= t.x && i < t.x + t.width && 
                j >= t.y && j < t.y + t.height
            );
            
            if (hasBuilding || hasTree) {
                return false;
            }
        }
    }
    
    return true;
}

// Place a building or tree
function placeItem(x, y, type) {
    if (buildingTypes[type]) {
        // It's a building
        const building = buildingTypes[type];
        if (gameState.money < building.cost) {
            alert("Not enough money!");
            return;
        }
        
        gameState.money -= building.cost;
        gameState.buildings.push({
            type: type,
            x: x,
            y: y,
            width: building.width,
            height: building.height,
            maxCitizens: building.citizens,
            currentCitizens: 0,
            happinessImpact: building.happinessImpact,
            income: building.income
        });
        
        // Citizens will grow over time
        setTimeout(() => {
            const b = gameState.buildings.find(b => b.x === x && b.y === y);
            if (b) b.currentCitizens = b.maxCitizens;
            updateCitizensCount();
        }, 2000);
    } else {
        // It's green infrastructure
        const green = greenTypes[type];
        if (gameState.money < green.cost) {
            alert("Not enough money!");
            return;
        }
        
        gameState.money -= green.cost;
        const tree = {
            type: type,
            x: x,
            y: y,
            width: green.width,
            height: green.height,
            happinessImpact: green.happinessImpact,
            mature: false,
            plantedTime: Date.now()
        };
        
        gameState.trees.push(tree);
        
        // Tree grows over time
        setTimeout(() => {
            const t = gameState.trees.find(t => t.x === x && t.y === y);
            if (t) t.mature = true;
        }, green.growthTime);
    }
    
    updateUI();
}

// Update citizens count
function updateCitizensCount() {
    gameState.citizens = gameState.buildings.reduce((sum, b) => sum + b.currentCitizens, 0);
    updateUI();
}

// Update happiness based on buildings and trees
function updateHappiness() {
    let happiness = 50; // Base happiness
    
    // Add building happiness
    happiness += gameState.buildings.reduce((sum, b) => sum + b.happinessImpact, 0);
    
    // Add mature trees happiness
    happiness += gameState.trees.reduce((sum, t) => t.mature ? sum + t.happinessImpact : sum, 0);
    
    // Cap happiness between 0-100
    gameState.happiness = Math.max(0, Math.min(100, happiness));
    updateUI();
}

// Collect taxes from buildings
function collectTaxes() {
    const now = Date.now();
    if (now - gameState.lastTaxTime >= gameState.taxInterval) {
        gameState.lastTaxTime = now;
        
        const taxIncome = gameState.buildings.reduce((sum, b) => {
            // Citizens pay more taxes when happy
            const happinessMultiplier = 1 + (gameState.happiness / 100);
            return sum + (b.currentCitizens * b.income * happinessMultiplier);
        }, 0);
        
        gameState.money += Math.floor(taxIncome);
        updateUI();
        
        // Show tax collection animation
        showFloatingText(`+$${Math.floor(taxIncome)}`, canvas.width - 100, 30, '#4caf50');
    }
}

// Show floating text
function showFloatingText(text, x, y, color) {
    const floatingText = {
        text: text,
        x: x,
        y: y,
        alpha: 1,
        color: color
    };
    
    function fadeOut() {
        floatingText.alpha -= 0.02;
        floatingText.y -= 1;
        
        if (floatingText.alpha > 0) {
            requestAnimationFrame(fadeOut);
        }
    }
    
    fadeOut();
}

// Update UI displays
function updateUI() {
    document.getElementById('money').textContent = gameState.money;
    document.getElementById('citizens').textContent = gameState.citizens;
    document.getElementById('happiness').textContent = gameState.happiness;
}

// Game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    drawGrid();
    
    // Draw trees (green infrastructure)
    drawTrees();
    
    // Draw buildings
    drawBuildings();
    
    // Game logic
    updateHappiness();
    collectTaxes();
    
    requestAnimationFrame(gameLoop);
}

// Draw grid
function drawGrid() {
    ctx.strokeStyle = '#81c784';
    ctx.lineWidth = 0.5;
    
    for (let x = 0; x <= canvas.width; x += gameState.gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    for (let y = 0; y <= canvas.height; y += gameState.gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// Draw buildings
function drawBuildings() {
    gameState.buildings.forEach(building => {
        const type = buildingTypes[building.type];
        ctx.fillStyle = type.color;
        ctx.fillRect(
            building.x * gameState.gridSize,
            building.y * gameState.gridSize,
            building.width * gameState.gridSize,
            building.height * gameState.gridSize
        );
        
        // Draw building outline
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            building.x * gameState.gridSize,
            building.y * gameState.gridSize,
            building.width * gameState.gridSize,
            building.height * gameState.gridSize
        );
        
        // Draw building label
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            type.name,
            building.x * gameState.gridSize + (building.width * gameState.gridSize) / 2,
            building.y * gameState.gridSize + (building.height * gameState.gridSize) / 2
        );
        
        // Draw citizen indicators
        if (building.currentCitizens > 0) {
            const citizenSize = 4;
            const spacing = 6;
            const startX = building.x * gameState.gridSize + 10;
            const startY = building.y * gameState.gridSize + 10;
            
            for (let i = 0; i < building.currentCitizens; i++) {
                ctx.fillStyle = '#ffeb3b';
                ctx.beginPath();
                ctx.arc(
                    startX + (i % 3) * spacing,
                    startY + Math.floor(i / 3) * spacing,
                    citizenSize,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
        }
    });
}

// Draw trees and green infrastructure
function drawTrees() {
    gameState.trees.forEach(tree => {
        const type = greenTypes[tree.type];
        const centerX = tree.x * gameState.gridSize + (tree.width * gameState.gridSize) / 2;
        const centerY = tree.y * gameState.gridSize + (tree.height * gameState.gridSize) / 2;
        
        if (tree.mature) {
            // Draw mature tree/park/garden
            ctx.fillStyle = type.color;
            
            if (tree.type === 'tree') {
                // Draw tree trunk
                ctx.fillStyle = '#5d4037';
                ctx.fillRect(
                    centerX - 5,
                    centerY + 5,
                    10,
                    15
                );
                
                // Draw tree leaves
                ctx.fillStyle = type.color;
                ctx.beginPath();
                ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Draw park or garden
                ctx.fillRect(
                    tree.x * gameState.gridSize,
                    tree.y * gameState.gridSize,
                    tree.width * gameState.gridSize,
                    tree.height * gameState.gridSize
                );
                
                // Draw outline
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.strokeRect(
                    tree.x * gameState.gridSize,
                    tree.y * gameState.gridSize,
                    tree.width * gameState.gridSize,
                    tree.height * gameState.gridSize
                );
                
                // Draw label
                ctx.fillStyle = '#000';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(type.name.substring(0, 3), centerX, centerY);
            
            // Draw some grass or flowers for parks/gardens
            if (tree.type === 'park') {
                drawGrass(tree);
            } else if (tree.type === 'garden') {
                drawVegetables(tree);
            }
        }
    } else {
        // Draw sapling/under construction
        if (tree.type === 'tree') {
            // Small sapling
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(centerX - 2, centerY + 5, 4, 8);
            ctx.fillStyle = '#a5d6a7';
            ctx.beginPath();
            ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Under construction park/garden
            ctx.fillStyle = '#bcaaa4';
            ctx.fillRect(
                tree.x * gameState.gridSize,
                tree.y * gameState.gridSize,
                tree.width * gameState.gridSize,
                tree.height * gameState.gridSize
            );
            
            // Draw construction lines
            ctx.strokeStyle = '#5d4037';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 3]);
            ctx.strokeRect(
                tree.x * gameState.gridSize + 2,
                tree.y * gameState.gridSize + 2,
                tree.width * gameState.gridSize - 4,
                tree.height * gameState.gridSize - 4
            );
            ctx.setLineDash([]);
            
            // Draw construction label
            ctx.fillStyle = '#000';
            ctx.font = '10px Arial';
            ctx.fillText(
                'Building...',
                centerX,
                centerY
            );
        }
    }
});}
// Draw grass in parks
function drawGrass(tree) {
const centerX = tree.x * gameState.gridSize + (tree.width * gameState.gridSize) / 2;
const centerY = tree.y * gameState.gridSize + (tree.height * gameState.gridSize) / 2;
ctx.fillStyle = '#7cb342';
for (let i = 0; i < 10; i++) {
    const x = tree.x * gameState.gridSize + 5 + Math.random() * (tree.width * gameState.gridSize - 10);
    const y = tree.y * gameState.gridSize + 5 + Math.random() * (tree.height * gameState.gridSize - 10);
    
    // Simple grass blades
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 2, y - 5);
    ctx.lineTo(x + 2, y - 5);
    ctx.closePath();
    ctx.fill();
}

// Draw a bench
ctx.fillStyle = '#5d4037';
ctx.fillRect(centerX - 15, centerY + 10, 30, 5);
ctx.fillRect(centerX - 12, centerY + 5, 5, 5);
ctx.fillRect(centerX + 7, centerY + 5, 5, 5);}

// Draw vegetables in community gardens
function drawVegetables(tree) {
const colors = ['#f44336', '#ffeb3b', '#4caf50', '#e91e63'];
for (let i = 0; i < 8; i++) {
    const x = tree.x * gameState.gridSize + 10 + Math.random() * (tree.width * gameState.gridSize - 20);
    const y = tree.y * gameState.gridSize + 10 + Math.random() * (tree.height * gameState.gridSize - 20);
    const size = 5 + Math.random() * 5;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
}}

// Start the game
updateUI();
gameLoop();

// Tutorial messages
setTimeout(() => {
alert("Welcome to Greenville Growers!\n\nBuild houses for citizens, shops and schools to make them happy, and plant trees to keep your city green!\n\nHappy citizens pay more taxes!");
}, 500);

// Achievement system
const achievements = {
firstTree: false,
tenCitizens: false,
fiftyHappiness: false
};

function checkAchievements() {
if (!achievements.firstTree && gameState.trees.length > 0) {
achievements.firstTree = true;
showAchievement("Green Thumb", "Planted your first tree!");
}

if (!achievements.tenCitizens && gameState.citizens >= 10) {
    achievements.tenCitizens = true;
    showAchievement("Growing Community", "Reached 10 citizens!");
}

if (!achievements.fiftyHappiness && gameState.happiness >= 50) {
    achievements.fiftyHappiness = true;
    showAchievement("Happy Town", "Reached 50% happiness!");
}
}

function showAchievement(title, text) {
const achievementDiv = document.createElement('div');
achievementDiv.style.position = 'fixed';
achievementDiv.style.right = '20px';
achievementDiv.style.top = '20px';
achievementDiv.style.backgroundColor = '#ffeb3b';
achievementDiv.style.padding = '10px';
achievementDiv.style.borderRadius = '5px';
achievementDiv.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
achievementDiv.style.zIndex = '1000';
achievementDiv.innerHTML = $`<strong>${title}</strong><br>${text}`;

document.body.appendChild(achievementDiv);

setTimeout(() => {
    achievementDiv.style.transition = 'all 1s';
    achievementDiv.style.opacity = '0';
    setTimeout(() => {
        document.body.removeChild(achievementDiv);
    }, 1000);
}, 3000);
}

// Check achievements periodically
setInterval(checkAchievements, 1000);

{/* 
## Game Features

1. **Core Gameplay Loop**:
   - Build houses to increase population
   - Add shops and schools to make citizens happy
   - Plant trees and create green spaces to boost happiness
   - Collect taxes from happy citizens to expand your city

2. **Educational Elements**:
   - Shows the relationship between green spaces and citizen happiness
   - Demonstrates how trees mature over time
   - Teaches basic city planning concepts

3. **Kid-Friendly Features**:
   - Simple controls (click to build)
   - Bright, colorful graphics
   - Achievement system with positive feedback
   - Visual indicators for happiness and growth

4. **Progression System**:
   - Start with basic houses and trees
   - Unlock more buildings as you grow
   - More advanced green infrastructure becomes available

5. **Visual Feedback**:
   - Trees grow from saplings to mature trees
   - Buildings show citizen occupancy
   - Tax collection animations
   - Happiness meter changes color based on level

## How to Expand the Game

1. **Add More Buildings**:
   - Hospitals, fire stations, etc. with different effects
   - Renewable energy buildings (solar panels, wind turbines)

2. **Seasonal Effects**:
   - Trees change appearance with seasons
   - Seasonal events (tree planting day)

3. **Challenges**:
   - Pollution mechanics that trees can reduce
   - Natural disasters that trees can help prevent

4. **Multiplayer**:
   - Compete with friends to create the greenest city
   - Share city designs

5. **Educational Content**:
   - Pop-up facts about urban ecology
   - Real-world examples of green infrastructure

This game provides a fun, engaging way for kids to learn about urban planning and environmental stewardship while enjoying classic city-building gameplay mechanics.
New chat */}
