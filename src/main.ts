import './style.css';

type TileType = 'rock' | 'floor' | 'base';
type Biome = 'citadel' | 'wilds' | 'swamp' | 'ridge';
type Weather = 'clear' | 'fog' | 'storm';
type EnemyKind = 'runner' | 'stalker' | 'brute';
type ResourceType = 'wood' | 'scrap' | 'food' | 'relic';
type GamePhase = 'intro' | 'playing' | 'victory' | 'defeat';

type QuestPath = 'none' | 'scavenger' | 'defender' | 'hunter';
type BossPhase = 'hunt' | 'burst' | 'slam';

interface UpgradeState {
  vitality: number;
  weapon: number;
  stamina: number;
}

interface SavedGame {
  seed: number;
  player: Player;
  inventory: Inventory;
  quest: QuestState;
  boss: BossState | null;
  upgrades: UpgradeState;
  resources: ResourcePickup[];
  enemies: Enemy[];
  projectiles: Projectile[];
  structures: Structure[];
  logs: string[];
  time: number;
  dayProgress: number;
  waveTimer: number;
  day: number;
  weather: Weather;
  weatherTimer: number;
  spawnTimer: number;
  enemyId: number;
  resourceId: number;
  cameraShake: number;
  dangerLevel: number;
  enemyMemory: {
    rangedBias: number;
    buildBias: number;
    closeBias: number;
  };
  seen: boolean[];
}

interface BossState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  attackCooldown: number;
  slamCooldown: number;
  phase: BossPhase;
}

interface Vec2 {
  x: number;
  y: number;
}

interface ResourcePickup {
  id: number;
  type: ResourceType;
  x: number;
  y: number;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  from: 'player' | 'enemy' | 'turret';
  ttl: number;
}

interface Structure {
  kind: 'wall' | 'turret' | 'beacon';
  gx: number;
  gy: number;
  hp: number;
  cooldown: number;
}

interface Enemy {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  speed: number;
  attackCooldown: number;
  maxHp: number;
  range: number;
}

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  hunger: number;
  stamina: number;
  facingX: number;
  facingY: number;
  shootCooldown: number;
  attackDamage: number;
}

interface QuestState {
  beaconBuilt: boolean;
  survivedDays: number;
  rescuedSupply: number;
  kills: number;
  activePath: QuestPath;
  scavengerComplete: boolean;
  defenderComplete: boolean;
  hunterComplete: boolean;
  bossSummoned: boolean;
  bossDefeated: boolean;
}

interface Inventory {
  wood: number;
  scrap: number;
  food: number;
  medkit: number;
  relic: number;
}

const canvas = document.createElement('canvas');
const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Missing app root');
}

app.innerHTML = `
  <div class="game-shell">
    <div class="stage">
      <canvas id="game-canvas"></canvas>
      <div class="hud-top">
        <div class="hud-box" id="hud-left"></div>
        <div class="hud-box" id="hud-right"></div>
      </div>
      <div class="overlay" id="overlay"></div>
    </div>
    <aside class="sidebar">
      <section class="panel brand">
        <h1>Rogue Survival Tactics</h1>
        <p>Prototype lai giữa roguelike, sinh tồn, chiến thuật và phòng thủ căn cứ.</p>
      </section>
      <section class="panel">
        <h2 style="margin-bottom: 8px; font-size: 16px;">Chỉ số</h2>
        <div class="grid">
          <div>
            <div class="stat-row"><span>HP</span><span id="hp-text"></span></div>
            <div class="bar hp"><span id="hp-bar"></span></div>
          </div>
          <div>
            <div class="stat-row"><span>Hunger</span><span id="hunger-text"></span></div>
            <div class="bar hunger"><span id="hunger-bar"></span></div>
          </div>
          <div>
            <div class="stat-row"><span>Stamina</span><span id="stamina-text"></span></div>
            <div class="bar stamina"><span id="stamina-bar"></span></div>
          </div>
          <div class="stat-row"><span>Day / Night</span><span id="time-text"></span></div>
          <div class="stat-row"><span>Weather</span><span id="weather-text"></span></div>
          <div class="stat-row"><span>Wave</span><span id="wave-text"></span></div>
        </div>
      </section>
      <section class="panel">
        <h2 style="margin-bottom: 8px; font-size: 16px;">Kho đồ</h2>
        <div class="badges" id="inventory-badges"></div>
      </section>
      <section class="panel">
        <h2 style="margin-bottom: 8px; font-size: 16px;">Nhiệm vụ</h2>
        <div class="small" id="quest-text"></div>
      </section>
      <section class="panel">
        <h2 style="margin-bottom: 8px; font-size: 16px;">Bản đồ</h2>
        <canvas id="minimap-canvas" width="240" height="160"></canvas>
      </section>
      <section class="panel">
        <h2 style="margin-bottom: 8px; font-size: 16px;">Nhật ký</h2>
        <div class="log" id="log"></div>
      </section>
    </aside>
  </div>
`;

app.querySelector('.stage')?.appendChild(canvas);

const ctx = canvas.getContext('2d')!;

const hudLeft = document.querySelector<HTMLDivElement>('#hud-left')!;
const hudRight = document.querySelector<HTMLDivElement>('#hud-right')!;
const hpText = document.querySelector<HTMLSpanElement>('#hp-text')!;
const hpBar = document.querySelector<HTMLSpanElement>('#hp-bar')!;
const hungerText = document.querySelector<HTMLSpanElement>('#hunger-text')!;
const hungerBar = document.querySelector<HTMLSpanElement>('#hunger-bar')!;
const staminaText = document.querySelector<HTMLSpanElement>('#stamina-text')!;
const staminaBar = document.querySelector<HTMLSpanElement>('#stamina-bar')!;
const timeText = document.querySelector<HTMLSpanElement>('#time-text')!;
const weatherText = document.querySelector<HTMLSpanElement>('#weather-text')!;
const waveText = document.querySelector<HTMLSpanElement>('#wave-text')!;
const inventoryBadges = document.querySelector<HTMLDivElement>('#inventory-badges')!;
const questText = document.querySelector<HTMLDivElement>('#quest-text')!;
const overlay = document.querySelector<HTMLDivElement>('#overlay')!;
const logEl = document.querySelector<HTMLDivElement>('#log')!;
const minimapCanvas = document.querySelector<HTMLCanvasElement>('#minimap-canvas')!;
const minimapCtx = minimapCanvas.getContext('2d')!;

const TILE = 24;
const MAP_W = 56;
const MAP_H = 36;
const WORLD_W = MAP_W * TILE;
const WORLD_H = MAP_H * TILE;
const VIEW_RADIUS = 8;
const BASE_X = Math.floor(MAP_W / 2);
const BASE_Y = Math.floor(MAP_H / 2);

const input = new Set<string>();
const pressed = new Set<string>();

window.addEventListener('keydown', (event) => {
  if (!input.has(event.code)) {
    pressed.add(event.code);
  }
  input.add(event.code);

  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'KeyF', 'KeyK', 'KeyL', 'KeyR', 'KeyM', 'KeyN', 'KeyB', 'KeyV', 'Escape'].includes(event.code)) {
    event.preventDefault();
  }
});

window.addEventListener('keyup', (event) => {
  input.delete(event.code);
});

const SAVE_KEY = 'rogue-survival-tactics-save-v3';
let rngSeed = Math.floor(Date.now() % 1_000_000);
let rngState = rngSeed >>> 0;

function setSeed(seed: number): void {
  rngSeed = seed >>> 0;
  rngState = rngSeed;
}

function generateSeed(): number {
  return Math.floor((Date.now() ^ Math.floor(performance.now() * 1000)) % 1_000_000);
}

function createBoss(): BossState {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    hp: 420,
    maxHp: 420,
    attackCooldown: 0,
    slamCooldown: 0,
    phase: 'hunt',
  };
}

function random(): number {
  rngState += 0x6D2B79F5;
  let t = rngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function randomRange(min: number, max: number): number {
  return min + random() * (max - min);
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max + 1));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function length(x: number, y: number): number {
  return Math.hypot(x, y);
}

function normalize(vec: Vec2): Vec2 {
  const magnitude = length(vec.x, vec.y) || 1;
  return { x: vec.x / magnitude, y: vec.y / magnitude };
}

function tileIndex(x: number, y: number): number {
  return y * MAP_W + x;
}

function inBounds(x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;
}

function worldToTile(x: number, y: number): Vec2 {
  return { x: Math.floor(x / TILE), y: Math.floor(y / TILE) };
}

function tileToWorld(x: number, y: number): Vec2 {
  return { x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 };
}

function tileCenter(gx: number, gy: number): Vec2 {
  return tileToWorld(gx, gy);
}

function isBlockedTile(tile: TileType): boolean {
  return tile === 'rock';
}

function getBiome(gx: number, gy: number): Biome {
  const dx = gx - BASE_X;
  const dy = gy - BASE_Y;
  const distance = Math.hypot(dx, dy);
  if (distance < 4) {
    return 'citadel';
  }
  if (dx < 0 && dy < 0) {
    return 'swamp';
  }
  if (dx > 0 && dy < 0) {
    return 'ridge';
  }
  return 'wilds';
}

function biomeFloorColor(biome: Biome, visible: boolean): string {
  if (!visible) {
    return '#111723';
  }
  switch (biome) {
    case 'citadel':
      return '#243453';
    case 'swamp':
      return '#163735';
    case 'ridge':
      return '#332b54';
    default:
      return '#172337';
  }
}

class Game {
  private phase: GamePhase = 'intro';
  private tiles: TileType[] = [];
  private seen: boolean[] = [];
  private visible: boolean[] = [];
  private flowField: number[] = [];
  private player: Player = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    hp: 100,
    maxHp: 100,
    hunger: 100,
    stamina: 100,
    facingX: 1,
    facingY: 0,
    shootCooldown: 0,
    attackDamage: 18,
  };
  private upgrades: UpgradeState = {
    vitality: 0,
    weapon: 0,
    stamina: 0,
  };
  private inventory: Inventory = {
    wood: 0,
    scrap: 0,
    food: 0,
    medkit: 0,
    relic: 0,
  };
  private quest: QuestState = {
    beaconBuilt: false,
    survivedDays: 0,
    rescuedSupply: 0,
    kills: 0,
    activePath: 'none',
    scavengerComplete: false,
    defenderComplete: false,
    hunterComplete: false,
    bossSummoned: false,
    bossDefeated: false,
  };
  private boss: BossState | null = null;
  private dialogueOpen = false;
  private shopOpen = false;
  private merchantOpen = false;
  private resources: ResourcePickup[] = [];
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private structures: Structure[] = [];
  private logs: string[] = [];
  private time = 0;
  private dayProgress = 0;
  private waveTimer = 0;
  private day = 1;
  private weather: Weather = 'clear';
  private weatherTimer = 0;
  private spawnTimer = 0;
  private resourceRespawnTimer = 0;
  private saveTimer = 0;
  private enemyId = 0;
  private resourceId = 0;
  private cameraShake = 0;
  private lastFrame = performance.now();
  private dangerLevel = 0;
  private enemyMemory = {
    rangedBias: 0.25,
    buildBias: 0.25,
    closeBias: 0.5,
  };

  constructor() {
    const savedGame = this.loadGame();
    setSeed(savedGame ? savedGame.seed : generateSeed());
    this.generateWorld();
    if (savedGame) {
      this.applySavedGame(savedGame);
      this.phase = 'playing';
      overlay.style.display = 'none';
      this.log('Đã khôi phục save gần nhất.');
    }
    this.resize();
    window.addEventListener('resize', () => this.resize());
    overlay.addEventListener('click', (event) => {
      const target = event.target as HTMLElement | null;
      const action = target?.closest<HTMLElement>('[data-action]')?.dataset.action;
      if (this.dialogueOpen) {
        if (action === 'close-dialogue') {
          this.dialogueOpen = false;
          this.log('Đóng bảng chỉ huy.');
          return;
        }
        if (action === 'quest-scavenger' || action === 'quest-defender' || action === 'quest-hunter') {
          this.beginQuest(action.split('-')[1] as QuestPath);
          return;
        }
        if (action === 'quest-claim') {
          this.claimQuestReward();
          return;
        }
      }
      if (this.shopOpen) {
        if (action === 'upgrade-vitality' || action === 'upgrade-weapon' || action === 'upgrade-stamina') {
          this.buyUpgrade(action.split('-')[1] as keyof UpgradeState);
          return;
        }
        if (action === 'close-shop') {
          this.shopOpen = false;
          overlay.style.display = 'none';
          this.log('Đóng bảng nâng cấp.');
          return;
        }
      }
      if (this.merchantOpen) {
        if (action === 'trade-lens') {
          this.buyMerchantItem('lens');
          return;
        }
        if (action === 'trade-rations') {
          this.buyMerchantItem('rations');
          return;
        }
        if (action === 'trade-core') {
          this.buyMerchantItem('core');
          return;
        }
        if (action === 'close-merchant') {
          this.merchantOpen = false;
          overlay.style.display = 'none';
          this.log('Đóng bảng thương nhân.');
          return;
        }
      }
      if (this.phase === 'intro') {
        this.phase = 'playing';
        this.log('Lần quét đầu tiên đã khởi động. Bắt đầu sinh tồn.');
      } else if (this.phase === 'victory' || this.phase === 'defeat') {
        window.location.reload();
      }
    });
    requestAnimationFrame((timestamp) => this.frame(timestamp));
  }

  private resize(): void {
    const stage = canvas.parentElement;
    if (!stage) {
      return;
    }
    const rect = stage.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width));
    canvas.height = Math.max(1, Math.floor(rect.height));
  }

  private generateWorld(): void {
    this.tiles = new Array(MAP_W * MAP_H).fill('rock');
    this.seen = new Array(MAP_W * MAP_H).fill(false);
    this.visible = new Array(MAP_W * MAP_H).fill(false);
    this.flowField = new Array(MAP_W * MAP_H).fill(Number.POSITIVE_INFINITY);

    let x = BASE_X;
    let y = BASE_Y;
    const carved = new Set<number>();
    const steps = MAP_W * MAP_H * 3;

    for (let i = 0; i < steps; i++) {
      this.tiles[tileIndex(x, y)] = 'floor';
      carved.add(tileIndex(x, y));
      if (random() < 0.18) {
        const roomW = randomInt(2, 5);
        const roomH = randomInt(2, 4);
        for (let ry = -roomH; ry <= roomH; ry++) {
          for (let rx = -roomW; rx <= roomW; rx++) {
            const tx = x + rx;
            const ty = y + ry;
            if (inBounds(tx, ty)) {
              this.tiles[tileIndex(tx, ty)] = 'floor';
              carved.add(tileIndex(tx, ty));
            }
          }
        }
      }
      const direction = randomInt(0, 3);
      if (direction === 0) x += 1;
      if (direction === 1) x -= 1;
      if (direction === 2) y += 1;
      if (direction === 3) y -= 1;
      x = clamp(x, 2, MAP_W - 3);
      y = clamp(y, 2, MAP_H - 3);
    }

    for (let gx = BASE_X - 1; gx <= BASE_X + 1; gx++) {
      for (let gy = BASE_Y - 1; gy <= BASE_Y + 1; gy++) {
        if (inBounds(gx, gy)) {
          this.tiles[tileIndex(gx, gy)] = 'base';
        }
      }
    }

    const floors = Array.from(carved).map((index) => ({ x: index % MAP_W, y: Math.floor(index / MAP_W) }));
    for (let i = 0; i < 38; i++) {
      const cell = floors[randomInt(0, floors.length - 1)];
      if (!cell) {
        continue;
      }
      if (Math.abs(cell.x - BASE_X) < 3 && Math.abs(cell.y - BASE_Y) < 3) {
        continue;
      }
      const biome = getBiome(cell.x, cell.y);
      const typeRoll = random();
      const type: ResourceType = biome === 'swamp'
        ? (typeRoll < 0.52 ? 'food' : typeRoll < 0.78 ? 'scrap' : 'wood')
        : biome === 'ridge'
          ? (typeRoll < 0.42 ? 'wood' : typeRoll < 0.72 ? 'scrap' : typeRoll < 0.9 ? 'food' : 'relic')
          : (typeRoll < 0.42 ? 'wood' : typeRoll < 0.77 ? 'scrap' : typeRoll < 0.95 ? 'food' : 'relic');
      const pos = tileCenter(cell.x, cell.y);
      this.resources.push({ id: this.resourceId++, type, x: pos.x, y: pos.y });
    }

    const spawn = this.findSpawnPoint();
    this.player.x = spawn.x;
    this.player.y = spawn.y;
    this.structures.push({ kind: 'beacon', gx: BASE_X, gy: BASE_Y, hp: 250, cooldown: 0 });
    this.log('Căn cứ trung tâm đã được thiết lập.');
  }

  private findSpawnPoint(): Vec2 {
    for (let radius = 1; radius < Math.max(MAP_W, MAP_H); radius++) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const gx = BASE_X + dx;
          const gy = BASE_Y + dy;
          if (!inBounds(gx, gy)) continue;
          if (this.tiles[tileIndex(gx, gy)] === 'floor') {
            return tileCenter(gx, gy);
          }
        }
      }
    }
    return tileCenter(BASE_X, BASE_Y + 2);
  }

  private log(message: string): void {
    this.logs.unshift(message);
    this.logs = this.logs.slice(0, 8);
    logEl.innerHTML = this.logs.map((entry) => `<div class="log-entry">${entry}</div>`).join('');
  }

  private frame(timestamp: number): void {
    const delta = Math.min(0.033, (timestamp - this.lastFrame) / 1000);
    this.lastFrame = timestamp;
    if (this.phase === 'playing') {
      this.update(delta);
    }
    this.render();
    pressed.clear();
    requestAnimationFrame((next) => this.frame(next));
  }

  private update(delta: number): void {
    if (this.dialogueOpen) {
      if (pressed.has('Escape')) {
        this.dialogueOpen = false;
        overlay.style.display = 'none';
        this.log('Đóng bảng chỉ huy.');
      }
      this.updateUI(this.dayProgress > 0.55);
      this.detectVictoryDefeat();
      return;
    }

    if (this.shopOpen) {
      if (pressed.has('Escape')) {
        this.shopOpen = false;
        overlay.style.display = 'none';
        this.log('Đóng bảng nâng cấp.');
      }
      this.updateUI(this.dayProgress > 0.55);
      this.detectVictoryDefeat();
      return;
    }

    if (this.merchantOpen) {
      if (pressed.has('Escape')) {
        this.merchantOpen = false;
        overlay.style.display = 'none';
        this.log('Đóng bảng thương nhân.');
      }
      this.updateUI(this.dayProgress > 0.55);
      this.detectVictoryDefeat();
      return;
    }

    this.time += delta;
    this.dayProgress += delta / 120;
    if (this.dayProgress >= 1) {
      this.dayProgress = 0;
      this.day += 1;
      this.quest.survivedDays = this.day;
      this.log(`Ngày ${this.day} bắt đầu. Địch mạnh hơn.`);
      this.player.hunger = clamp(this.player.hunger + 18, 0, this.player.maxHp);
    }

    this.weatherTimer += delta;
    if (this.weatherTimer >= 28) {
      this.weatherTimer = 0;
      const roll = random();
      this.weather = roll < 0.5 ? 'clear' : roll < 0.78 ? 'fog' : 'storm';
      this.log(this.weather === 'storm' ? 'Bão cát kéo tới. Tầm nhìn giảm.' : this.weather === 'fog' ? 'Sương dày lan ra toàn khu.' : 'Bầu trời quang hơn.');
    }

    const isNight = this.dayProgress > 0.55;
    this.spawnTimer += delta;
    this.waveTimer += delta;
    this.dangerLevel = (isNight ? 1 : 0) + (this.weather === 'storm' ? 1 : 0) + Math.floor(this.day / 2);

    this.updatePlayer(delta, isNight);
    this.updateVisibility(isNight);
    this.updateFlowField();
    this.updateEnemies(delta, isNight);
    this.updateBoss(delta, isNight);
    this.updateProjectiles(delta);
    this.updateStructures(delta);
    this.updatePickups();
    this.updateSurvival(delta, isNight);
    this.spawnEnemies(isNight);
    this.updateResourceRespawns(delta);
    this.updateQuest();
    this.detectVictoryDefeat();
    this.updateUI(isNight);

    this.saveTimer += delta;
    if (this.saveTimer >= 12) {
      this.saveTimer = 0;
      this.saveGame();
    }
  }

  private updatePlayer(delta: number, isNight: boolean): void {
    const sprinting = (input.has('ShiftLeft') || input.has('ShiftRight')) && this.player.stamina > 0;
    const speed = (sprinting ? 168 : 132) * (isNight ? 0.95 : 1);
    const moveX = (input.has('KeyD') || input.has('ArrowRight') ? 1 : 0) - (input.has('KeyA') || input.has('ArrowLeft') ? 1 : 0);
    const moveY = (input.has('KeyS') || input.has('ArrowDown') ? 1 : 0) - (input.has('KeyW') || input.has('ArrowUp') ? 1 : 0);
    const move = normalize({ x: moveX, y: moveY });
    const acceleration = 12 * delta;
    this.player.vx += (move.x * speed - this.player.vx) * acceleration;
    this.player.vy += (move.y * speed - this.player.vy) * acceleration;
    this.player.x += this.player.vx * delta;
    this.player.y += this.player.vy * delta;

    if (Math.abs(moveX) + Math.abs(moveY) > 0) {
      this.player.facingX = move.x;
      this.player.facingY = move.y;
    }

    if (sprinting && (moveX !== 0 || moveY !== 0)) {
      this.player.stamina = clamp(this.player.stamina - delta * (18 + this.upgrades.stamina * 2), 0, 100);
    } else {
      this.player.stamina = clamp(this.player.stamina + delta * (9 + (this.isNearBase() ? 7 : 0)), 0, 100);
    }

    const collision = this.resolveMovement();
    if (collision.blocked) {
      this.player.x = collision.x;
      this.player.y = collision.y;
      this.player.vx *= 0.15;
      this.player.vy *= 0.15;
    }

    this.player.shootCooldown = Math.max(0, this.player.shootCooldown - delta);
    if (pressed.has('Space') && this.player.shootCooldown <= 0) {
      this.firePlayerProjectile();
      this.player.shootCooldown = 0.26;
      this.player.hunger = clamp(this.player.hunger - 0.25, 0, 100);
    }

    if (pressed.has('KeyF')) {
      this.pickNearbyResources();
    }
    if (pressed.has('KeyK')) {
      this.placeStructure('wall');
    }
    if (pressed.has('KeyL')) {
      this.placeStructure('turret');
    }
    if (pressed.has('KeyR')) {
      this.craftMedkit();
    }
    if (pressed.has('KeyE')) {
      this.depositAtBase();
    }
    if (pressed.has('KeyQ') && this.isNearBase()) {
      this.toggleDialogue();
    }
    if (pressed.has('KeyB') && this.isNearBase()) {
      this.toggleShop();
    }
    if (pressed.has('KeyV') && this.isNearBase()) {
      this.toggleMerchant();
    }
    if (pressed.has('KeyM')) {
      this.saveGame();
      this.log('Đã lưu tiến trình hiện tại.');
    }
    if (pressed.has('KeyN')) {
      localStorage.removeItem(SAVE_KEY);
      window.location.reload();
    }

    if (this.player.hunger <= 20 && Math.random() < 0.015) {
      this.log('Dạ dày trống rỗng. Cần thức ăn.');
    }

    const camping = this.isNearBase() && length(this.player.vx, this.player.vy) < 20;
    if (camping) {
      this.enemyMemory.closeBias = clamp(this.enemyMemory.closeBias + delta * 0.04, 0.25, 0.85);
    }
  }

  private resolveMovement(): { blocked: boolean; x: number; y: number } {
    const tile = worldToTile(this.player.x, this.player.y);
    if (!inBounds(tile.x, tile.y)) {
      this.player.x = clamp(this.player.x, TILE, WORLD_W - TILE);
      this.player.y = clamp(this.player.y, TILE, WORLD_H - TILE);
      return { blocked: true, x: this.player.x, y: this.player.y };
    }
    if (this.isSolid(tile.x, tile.y)) {
      const center = tileCenter(tile.x, tile.y);
      return { blocked: true, x: center.x, y: center.y };
    }
    return { blocked: false, x: this.player.x, y: this.player.y };
  }

  private isSolid(gx: number, gy: number): boolean {
    if (!inBounds(gx, gy)) {
      return true;
    }
    const tile = this.tiles[tileIndex(gx, gy)];
    if (isBlockedTile(tile)) {
      return true;
    }
    return this.structures.some((structure) => structure.gx === gx && structure.gy === gy && structure.kind === 'wall' && structure.hp > 0);
  }

  private firePlayerProjectile(): void {
    const dir = normalize({ x: this.player.facingX, y: this.player.facingY });
    this.projectiles.push({
      x: this.player.x + dir.x * 14,
      y: this.player.y + dir.y * 14,
      vx: dir.x * 350,
      vy: dir.y * 350,
      damage: this.player.attackDamage,
      from: 'player',
      ttl: 1.4,
    });
    this.player.attackDamage = clamp(this.player.attackDamage + 0.15, 18, 22);
    this.enemyMemory.rangedBias = clamp(this.enemyMemory.rangedBias + 0.05, 0.2, 0.75);
    this.log('Bạn nổ súng, AI đối phương đang học lối đánh tầm xa.');
  }

  private pickNearbyResources(): void {
    const before = this.resources.length;
    const radius = 28;
    this.resources = this.resources.filter((resource) => {
      const keep = length(resource.x - this.player.x, resource.y - this.player.y) > radius;
      if (!keep) {
        this.inventory[resource.type] += 1;
      }
      return keep;
    });
    const picked = before - this.resources.length;
    if (picked > 0) {
      this.quest.rescuedSupply += picked;
      this.log(`Thu thập ${picked} tài nguyên.`);
    }
  }

  private isNearBase(): boolean {
    const base = tileCenter(BASE_X, BASE_Y);
    return length(this.player.x - base.x, this.player.y - base.y) < 72;
  }

  private depositAtBase(): void {
    if (!this.isNearBase()) {
      return;
    }
    if (this.inventory.food > 0) {
      this.player.hunger = clamp(this.player.hunger + this.inventory.food * 14, 0, 100);
      this.log(`Chia sẻ ${this.inventory.food} đồ ăn với căn cứ.`);
      this.inventory.food = 0;
    }
    if (this.inventory.scrap >= 8 && this.inventory.wood >= 6 && !this.quest.beaconBuilt) {
      this.craftBeacon();
    }
  }

  private craftMedkit(): void {
    if (!this.isNearBase() || this.inventory.scrap < 3 || this.inventory.wood < 2) {
      return;
    }
    this.inventory.scrap -= 3;
    this.inventory.wood -= 2;
    this.inventory.medkit += 1;
    this.player.hp = clamp(this.player.hp + 28, 0, this.player.maxHp);
    this.log('Chế tạo và sử dụng medkit.');
  }

  private craftBeacon(): void {
    this.inventory.scrap -= 8;
    this.inventory.wood -= 6;
    this.quest.beaconBuilt = true;
    this.structures.push({ kind: 'beacon', gx: BASE_X + 1, gy: BASE_Y, hp: 300, cooldown: 0 });
    this.log('Beacon đã được dựng. Mục tiêu chính hoàn thành.');
  }

  private toggleShop(): void {
    if (this.phase !== 'playing') {
      return;
    }
    this.shopOpen = !this.shopOpen;
    if (this.shopOpen) {
      this.log('Bảng nâng cấp mở ra.');
      this.renderShopOverlay();
    } else {
      overlay.style.display = 'none';
    }
  }

  private getUpgradeCost(kind: keyof UpgradeState): { wood: number; scrap: number; food: number } {
    const level = this.upgrades[kind];
    if (kind === 'vitality') {
      return { wood: 2 + level, scrap: 3 + level * 2, food: 0 };
    }
    if (kind === 'weapon') {
      return { wood: 1 + level, scrap: 4 + level * 2, food: 0 };
    }
    return { wood: 2 + level, scrap: 2 + level, food: 1 + Math.floor(level / 2) };
  }

  private buyUpgrade(kind: keyof UpgradeState): void {
    const cost = this.getUpgradeCost(kind);
    if (this.inventory.wood < cost.wood || this.inventory.scrap < cost.scrap || this.inventory.food < cost.food) {
      this.log('Không đủ tài nguyên để nâng cấp.');
      return;
    }
    this.inventory.wood -= cost.wood;
    this.inventory.scrap -= cost.scrap;
    this.inventory.food -= cost.food;
    this.upgrades[kind] += 1;

    if (kind === 'vitality') {
      this.player.maxHp += 16;
      this.player.hp = clamp(this.player.hp + 24, 0, this.player.maxHp);
    } else if (kind === 'weapon') {
      this.player.attackDamage += 4;
    } else {
      this.player.maxHp += 8;
      this.player.stamina = clamp(this.player.stamina + 30, 0, 100);
    }

    this.shopOpen = false;
    overlay.style.display = 'none';
    this.log(`${kind} upgrade đã được mua.`);
  }

  private renderShopOverlay(): void {
    overlay.style.display = 'grid';
    const vitalityCost = this.getUpgradeCost('vitality');
    const weaponCost = this.getUpgradeCost('weapon');
    const staminaCost = this.getUpgradeCost('stamina');
    overlay.innerHTML = `
      <div class="overlay-card">
        <h2>Upgrade Bench</h2>
        <p>Nâng cấp tại căn cứ để tăng khả năng sống sót cho run hiện tại.</p>
        <div class="controls" style="margin-top: 16px;">
          <button class="quest-btn" data-action="upgrade-vitality">Vitality L${this.upgrades.vitality + 1} - W${vitalityCost.wood}/S${vitalityCost.scrap}</button>
          <button class="quest-btn" data-action="upgrade-weapon">Weapon L${this.upgrades.weapon + 1} - W${weaponCost.wood}/S${weaponCost.scrap}</button>
          <button class="quest-btn" data-action="upgrade-stamina">Stamina L${this.upgrades.stamina + 1} - W${staminaCost.wood}/S${staminaCost.scrap}/F${staminaCost.food}</button>
          <button class="quest-btn secondary" data-action="close-shop">Close</button>
        </div>
      </div>
    `;
  }

  private toggleMerchant(): void {
    if (this.phase !== 'playing') {
      return;
    }
    this.merchantOpen = !this.merchantOpen;
    if (this.merchantOpen) {
      this.log('Thương nhân bí ẩn đã xuất hiện ở base.');
      this.renderMerchantOverlay();
    } else {
      overlay.style.display = 'none';
    }
  }

  private buyMerchantItem(item: 'lens' | 'rations' | 'core'): void {
    const costs = {
      lens: { relic: 1, wood: 0, scrap: 2, food: 0 },
      rations: { relic: 1, wood: 0, scrap: 1, food: 0 },
      core: { relic: 2, wood: 2, scrap: 4, food: 1 },
    }[item];

    if (this.inventory.relic < costs.relic || this.inventory.wood < costs.wood || this.inventory.scrap < costs.scrap || this.inventory.food < costs.food) {
      this.log('Không đủ nguyên liệu hiếm để giao dịch.');
      return;
    }

    this.inventory.relic -= costs.relic;
    this.inventory.wood -= costs.wood;
    this.inventory.scrap -= costs.scrap;
    this.inventory.food -= costs.food;

    if (item === 'lens') {
      this.seen.fill(true);
      this.log('Scout Lens kích hoạt: toàn bản đồ được đánh dấu trên minimap.');
    } else if (item === 'rations') {
      this.player.hunger = clamp(this.player.hunger + 40, 0, 100);
      this.inventory.medkit += 1;
      this.log('Rations giao dịch xong: hồi đói và nhận thêm medkit.');
    } else {
      this.player.maxHp += 20;
      this.player.hp = clamp(this.player.hp + 20, 0, this.player.maxHp);
      this.player.attackDamage += 3;
      this.player.stamina = clamp(this.player.stamina + 20, 0, 100);
      this.log('Relic Core cấy vào người: HP, damage và stamina đều tăng.');
    }

    this.merchantOpen = false;
    overlay.style.display = 'none';
  }

  private renderMerchantOverlay(): void {
    overlay.style.display = 'grid';
    overlay.innerHTML = `
      <div class="overlay-card">
        <h2>Merchant</h2>
        <p>Đổi relic hiếm lấy những nâng cấp tức thời cho run này.</p>
        <div class="controls" style="margin-top: 16px;">
          <button class="quest-btn" data-action="trade-lens">Scout Lens - 1 relic + 2 scrap</button>
          <button class="quest-btn" data-action="trade-rations">Rations - 1 relic + 1 scrap</button>
          <button class="quest-btn" data-action="trade-core">Relic Core - 2 relic + 2 wood + 4 scrap + 1 food</button>
          <button class="quest-btn secondary" data-action="close-merchant">Close</button>
        </div>
      </div>
    `;
  }

  private placeStructure(kind: 'wall' | 'turret'): void {
    if (this.inventory.wood < (kind === 'wall' ? 2 : 4) || this.inventory.scrap < (kind === 'wall' ? 0 : 2)) {
      return;
    }
    const target = { x: this.player.x + this.player.facingX * TILE, y: this.player.y + this.player.facingY * TILE };
    const grid = worldToTile(target.x, target.y);
    if (!inBounds(grid.x, grid.y) || this.isSolid(grid.x, grid.y) || this.tiles[tileIndex(grid.x, grid.y)] === 'base') {
      return;
    }
    if (kind === 'wall') {
      this.inventory.wood -= 2;
      this.structures.push({ kind, gx: grid.x, gy: grid.y, hp: 70, cooldown: 0 });
    } else {
      this.inventory.wood -= 4;
      this.inventory.scrap -= 2;
      this.structures.push({ kind, gx: grid.x, gy: grid.y, hp: 55, cooldown: 0 });
    }
    this.enemyMemory.buildBias = clamp(this.enemyMemory.buildBias + 0.08, 0.2, 0.85);
    this.log(kind === 'wall' ? 'Dựng tường phòng thủ.' : 'Lắp tháp tự động.');
  }

  private updateVisibility(isNight: boolean): void {
    this.visible.fill(false);
    const radius = VIEW_RADIUS + (this.weather === 'clear' ? 1 : 0) - (this.weather === 'storm' ? 2 : 0) - (isNight ? 1 : 0);
    const origin = worldToTile(this.player.x, this.player.y);
    const rays = 96;
    for (let i = 0; i < rays; i++) {
      const angle = (Math.PI * 2 * i) / rays;
      let x = this.player.x;
      let y = this.player.y;
      for (let step = 0; step < radius * 3; step++) {
        x += Math.cos(angle) * 6;
        y += Math.sin(angle) * 6;
        const grid = worldToTile(x, y);
        if (!inBounds(grid.x, grid.y)) {
          break;
        }
        const index = tileIndex(grid.x, grid.y);
        this.visible[index] = true;
        this.seen[index] = true;
        if (this.isSolid(grid.x, grid.y) && !(grid.x === origin.x && grid.y === origin.y)) {
          break;
        }
      }
    }
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const gx = origin.x + dx;
        const gy = origin.y + dy;
        if (!inBounds(gx, gy)) continue;
        if (dx * dx + dy * dy <= radius * radius) {
          const index = tileIndex(gx, gy);
          this.visible[index] = true;
          this.seen[index] = true;
        }
      }
    }
  }

  private updateFlowField(): void {
    this.flowField.fill(Number.POSITIVE_INFINITY);
    const origin = worldToTile(this.player.x, this.player.y);
    if (!inBounds(origin.x, origin.y)) {
      return;
    }
    const queue: Vec2[] = [{ x: origin.x, y: origin.y }];
    this.flowField[tileIndex(origin.x, origin.y)] = 0;
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;
      const baseIndex = tileIndex(current.x, current.y);
      const currentDistance = this.flowField[baseIndex];
      const neighbors = [
        { x: current.x + 1, y: current.y },
        { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 },
      ];
      for (const neighbor of neighbors) {
        if (!inBounds(neighbor.x, neighbor.y) || this.isSolid(neighbor.x, neighbor.y)) {
          continue;
        }
        const index = tileIndex(neighbor.x, neighbor.y);
        if (this.flowField[index] > currentDistance + 1) {
          this.flowField[index] = currentDistance + 1;
          queue.push(neighbor);
        }
      }
    }
  }

  private updateEnemies(delta: number, isNight: boolean): void {
    for (const enemy of this.enemies) {
      const enemyTile = worldToTile(enemy.x, enemy.y);
      const enemyDistance = this.getFlowDistance(enemyTile.x, enemyTile.y);
      const flee = this.enemyMemory.rangedBias > 0.52 && enemy.kind === 'stalker';
      const target = flee ? this.pickAwayFromPlayer(enemyTile) : this.pickTowardPlayer(enemyTile);
      const direction = normalize({ x: target.x - enemy.x, y: target.y - enemy.y });
      let speed = enemy.speed * (isNight ? 1.12 : 0.9);
      if (this.weather === 'storm') {
        speed *= 0.92;
      }
      if (enemy.kind === 'brute') {
        speed *= 0.8;
      }
      if (enemy.kind === 'runner') {
        speed *= 1.12;
      }
      if (enemyDistance > 12) {
        speed *= 1.05;
      }
      enemy.vx = direction.x * speed;
      enemy.vy = direction.y * speed;
      if (flee) {
        enemy.vx *= -0.35;
        enemy.vy *= -0.35;
      }
      enemy.x += enemy.vx * delta;
      enemy.y += enemy.vy * delta;
      const collision = worldToTile(enemy.x, enemy.y);
      if (this.isSolid(collision.x, collision.y)) {
        enemy.x -= enemy.vx * delta;
        enemy.y -= enemy.vy * delta;
      }

      enemy.attackCooldown = Math.max(0, enemy.attackCooldown - delta);
      const distanceToPlayer = length(enemy.x - this.player.x, enemy.y - this.player.y);
      if (enemy.kind === 'stalker' && distanceToPlayer < 160 && enemy.attackCooldown <= 0) {
        this.projectiles.push({
          x: enemy.x,
          y: enemy.y,
          vx: direction.x * 220,
          vy: direction.y * 220,
          damage: 8,
          from: 'enemy',
          ttl: 2.0,
        });
        enemy.attackCooldown = 1.7;
      }
      if (distanceToPlayer < 18) {
        this.player.hp = clamp(this.player.hp - (enemy.kind === 'brute' ? 18 : 10) * delta, 0, this.player.maxHp);
        this.cameraShake = Math.max(this.cameraShake, 0.12);
      }
      if (enemy.hp <= 0) {
        this.dropEnemyLoot(enemy);
      }
    }
    this.enemies = this.enemies.filter((enemy) => enemy.hp > 0);
  }

  private updateBoss(delta: number, isNight: boolean): void {
    if (!this.boss) {
      return;
    }

    const boss = this.boss;
    const toPlayer = { x: this.player.x - boss.x, y: this.player.y - boss.y };
    const distance = length(toPlayer.x, toPlayer.y);
    const direction = normalize(toPlayer);
    let speed = (isNight ? 56 : 48) + this.day * 2;

    if (distance > 160) {
      boss.phase = 'hunt';
      boss.vx = direction.x * speed;
      boss.vy = direction.y * speed;
    } else if (boss.slamCooldown <= 0 && distance < 90) {
      boss.phase = 'slam';
      boss.vx = 0;
      boss.vy = 0;
      boss.slamCooldown = 2.6;
      this.player.hp = clamp(this.player.hp - 22, 0, this.player.maxHp);
      this.cameraShake = Math.max(this.cameraShake, 0.2);
      this.projectiles.push({
        x: boss.x,
        y: boss.y,
        vx: 0,
        vy: 0,
        damage: 0,
        from: 'enemy',
        ttl: 0.1,
      });
      this.log('Night Warden dậm mạnh mặt đất.');
    } else {
      boss.phase = 'burst';
      boss.vx = direction.x * (speed * 0.55);
      boss.vy = direction.y * (speed * 0.55);
      boss.attackCooldown = Math.max(0, boss.attackCooldown - delta);
      if (boss.attackCooldown <= 0) {
        const volley = 5;
        for (let i = 0; i < volley; i++) {
          const spread = (i - (volley - 1) / 2) * 0.18;
          const angle = Math.atan2(direction.y, direction.x) + spread;
          this.projectiles.push({
            x: boss.x,
            y: boss.y,
            vx: Math.cos(angle) * 240,
            vy: Math.sin(angle) * 240,
            damage: 10,
            from: 'enemy',
            ttl: 2.4,
          });
        }
        boss.attackCooldown = 1.8;
      }
    }

    boss.slamCooldown = Math.max(0, boss.slamCooldown - delta);
    boss.x += boss.vx * delta;
    boss.y += boss.vy * delta;

    const bossGrid = worldToTile(boss.x, boss.y);
    if (this.isSolid(bossGrid.x, bossGrid.y)) {
      boss.x -= boss.vx * delta;
      boss.y -= boss.vy * delta;
    }

    if (distance < 28) {
      this.player.hp = clamp(this.player.hp - 20 * delta, 0, this.player.maxHp);
      this.cameraShake = Math.max(this.cameraShake, 0.08);
    }

    if (boss.hp <= 0) {
      this.quest.bossDefeated = true;
      for (let i = 0; i < 3; i++) {
        this.resources.push({ id: this.resourceId++, type: 'relic', x: boss.x + randomRange(-18, 18), y: boss.y + randomRange(-18, 18) });
      }
      this.log('Night Warden đã gục ngã.');
      this.boss = null;
    }
  }

  private pickTowardPlayer(enemyTile: Vec2): Vec2 {
    const options = [
      { x: enemyTile.x + 1, y: enemyTile.y },
      { x: enemyTile.x - 1, y: enemyTile.y },
      { x: enemyTile.x, y: enemyTile.y + 1 },
      { x: enemyTile.x, y: enemyTile.y - 1 },
    ].filter((candidate) => inBounds(candidate.x, candidate.y) && !this.isSolid(candidate.x, candidate.y));
    let best = tileCenter(enemyTile.x, enemyTile.y);
    let bestDistance = this.getFlowDistance(enemyTile.x, enemyTile.y);
    for (const option of options) {
      const distance = this.getFlowDistance(option.x, option.y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = tileCenter(option.x, option.y);
      }
    }
    return best;
  }

  private pickAwayFromPlayer(enemyTile: Vec2): Vec2 {
    const options = [
      { x: enemyTile.x + 1, y: enemyTile.y },
      { x: enemyTile.x - 1, y: enemyTile.y },
      { x: enemyTile.x, y: enemyTile.y + 1 },
      { x: enemyTile.x, y: enemyTile.y - 1 },
    ].filter((candidate) => inBounds(candidate.x, candidate.y) && !this.isSolid(candidate.x, candidate.y));
    let best = tileCenter(enemyTile.x, enemyTile.y);
    let bestDistance = this.getFlowDistance(enemyTile.x, enemyTile.y);
    for (const option of options) {
      const distance = this.getFlowDistance(option.x, option.y);
      if (distance > bestDistance) {
        bestDistance = distance;
        best = tileCenter(option.x, option.y);
      }
    }
    return best;
  }

  private getFlowDistance(gx: number, gy: number): number {
    if (!inBounds(gx, gy)) {
      return Number.POSITIVE_INFINITY;
    }
    return this.flowField[tileIndex(gx, gy)];
  }

  private updateProjectiles(delta: number): void {
    for (const projectile of this.projectiles) {
      projectile.x += projectile.vx * delta;
      projectile.y += projectile.vy * delta;
      projectile.ttl -= delta;
      const grid = worldToTile(projectile.x, projectile.y);
      if (!inBounds(grid.x, grid.y) || this.isSolid(grid.x, grid.y)) {
        projectile.ttl = 0;
      }
      if (projectile.from === 'player') {
        if (this.boss && length(this.boss.x - projectile.x, this.boss.y - projectile.y) < 24) {
          this.boss.hp -= projectile.damage;
          projectile.ttl = 0;
          this.cameraShake = Math.max(this.cameraShake, 0.12);
        }
        for (const enemy of this.enemies) {
          if (length(enemy.x - projectile.x, enemy.y - projectile.y) < 16) {
            enemy.hp -= projectile.damage;
            projectile.ttl = 0;
            this.cameraShake = Math.max(this.cameraShake, 0.05);
            break;
          }
        }
      } else if (projectile.from === 'turret') {
        if (this.boss && length(this.boss.x - projectile.x, this.boss.y - projectile.y) < 24) {
          this.boss.hp -= projectile.damage;
          projectile.ttl = 0;
          this.cameraShake = Math.max(this.cameraShake, 0.08);
        }
      } else {
        if (length(this.player.x - projectile.x, this.player.y - projectile.y) < 14) {
          this.player.hp = clamp(this.player.hp - projectile.damage, 0, this.player.maxHp);
          projectile.ttl = 0;
          this.cameraShake = Math.max(this.cameraShake, 0.09);
        }
      }
    }
    this.projectiles = this.projectiles.filter((projectile) => projectile.ttl > 0);
  }

  private updateStructures(delta: number): void {
    for (const structure of this.structures) {
      structure.cooldown = Math.max(0, structure.cooldown - delta);
      if (structure.kind === 'turret' && structure.cooldown <= 0) {
        const origin = tileCenter(structure.gx, structure.gy);
        const target = this.enemies
          .filter((enemy) => length(enemy.x - origin.x, enemy.y - origin.y) < 220)
          .sort((a, b) => length(a.x - origin.x, a.y - origin.y) - length(b.x - origin.x, b.y - origin.y))[0];
        if (target) {
          const direction = normalize({ x: target.x - origin.x, y: target.y - origin.y });
          this.projectiles.push({
            x: origin.x,
            y: origin.y,
            vx: direction.x * 300,
            vy: direction.y * 300,
            damage: 12,
            from: 'turret',
            ttl: 1.2,
          });
          structure.cooldown = 1.1;
        }
      }
    }
    this.structures = this.structures.filter((structure) => structure.hp > 0);
  }

  private updatePickups(): void {
    const remaining: ResourcePickup[] = [];
    for (const resource of this.resources) {
      if (length(resource.x - this.player.x, resource.y - this.player.y) < 16) {
        this.inventory[resource.type] += 1;
        this.quest.rescuedSupply += 1;
        this.log(`Nhặt được ${resource.type}.`);
      } else {
        remaining.push(resource);
      }
    }
    this.resources = remaining;
  }

  private updateResourceRespawns(delta: number): void {
    this.resourceRespawnTimer += delta;
    if (this.resourceRespawnTimer < 18 || this.resources.length >= 34) {
      return;
    }
    this.resourceRespawnTimer = 0;
    const respawnCount = 3 + Math.floor(this.day / 2);
    const floorTiles: Vec2[] = [];
    for (let gy = 1; gy < MAP_H - 1; gy++) {
      for (let gx = 1; gx < MAP_W - 1; gx++) {
        const tile = this.tiles[tileIndex(gx, gy)];
        if (tile !== 'floor' || Math.abs(gx - BASE_X) < 4 && Math.abs(gy - BASE_Y) < 4) {
          continue;
        }
        if (this.resources.some((resource) => worldToTile(resource.x, resource.y).x === gx && worldToTile(resource.x, resource.y).y === gy)) {
          continue;
        }
        if (this.structures.some((structure) => structure.gx === gx && structure.gy === gy)) {
          continue;
        }
        if (this.seen[tileIndex(gx, gy)] && random() < 0.12) {
          floorTiles.push({ x: gx, y: gy });
        }
      }
    }
    for (let i = 0; i < respawnCount && floorTiles.length > 0; i++) {
      const cell = floorTiles.splice(randomInt(0, floorTiles.length - 1), 1)[0];
      if (!cell) {
        continue;
      }
      const biome = getBiome(cell.x, cell.y);
      const typeRoll = random();
      const type: ResourceType = biome === 'swamp'
        ? (typeRoll < 0.55 ? 'food' : typeRoll < 0.8 ? 'scrap' : 'wood')
        : biome === 'ridge'
          ? (typeRoll < 0.5 ? 'wood' : typeRoll < 0.78 ? 'scrap' : typeRoll < 0.92 ? 'food' : 'relic')
          : (typeRoll < 0.42 ? 'wood' : typeRoll < 0.77 ? 'scrap' : typeRoll < 0.96 ? 'food' : 'relic');
      const pos = tileCenter(cell.x, cell.y);
      this.resources.push({ id: this.resourceId++, type, x: pos.x, y: pos.y });
    }
  }

  private updateSurvival(delta: number, isNight: boolean): void {
    const hungerDrain = (isNight ? 1.4 : 1) * (this.weather === 'storm' ? 1.25 : 1);
    this.player.hunger = clamp(this.player.hunger - delta * hungerDrain * 1.5, 0, 100);
    if (this.player.hunger <= 0) {
      this.player.hp = clamp(this.player.hp - delta * 7, 0, this.player.maxHp);
    }
    if (this.player.hp <= 25 && this.inventory.medkit > 0 && random() < delta * 0.18) {
      this.inventory.medkit -= 1;
      this.player.hp = clamp(this.player.hp + 35, 0, this.player.maxHp);
      this.log('Auto-use medkit kích hoạt.');
    }
  }

  private spawnEnemies(isNight: boolean): void {
    const spawnInterval = isNight ? 2.2 : 5.5;
    if (this.spawnTimer < spawnInterval) {
      return;
    }
    this.spawnTimer = 0;
    const count = isNight ? 2 + Math.floor(this.day / 2) : 1;
    for (let i = 0; i < count; i++) {
      this.spawnEnemy();
    }
  }

  private spawnEnemy(): void {
    const border: Vec2[] = [];
    for (let x = 1; x < MAP_W - 1; x++) {
      border.push({ x, y: 1 }, { x, y: MAP_H - 2 });
    }
    for (let y = 2; y < MAP_H - 2; y++) {
      border.push({ x: 1, y }, { x: MAP_W - 2, y });
    }
    const spot = border[randomInt(0, border.length - 1)];
    if (!spot) return;
    if (this.isSolid(spot.x, spot.y)) return;
    const biome = getBiome(spot.x, spot.y);
    const kindRoll = random();
    const kind: EnemyKind = this.pickEnemyKind(kindRoll, biome);
    const baseHp = kind === 'runner' ? 28 : kind === 'stalker' ? 34 : 52;
    const baseSpeed = kind === 'runner' ? 82 : kind === 'stalker' ? 64 : 48;
    const enemy: Enemy = {
      id: this.enemyId++,
      kind,
      x: tileCenter(spot.x, spot.y).x,
      y: tileCenter(spot.x, spot.y).y,
      vx: 0,
      vy: 0,
      hp: baseHp + this.day * 4 + this.dangerLevel * 5,
      speed: baseSpeed + this.dangerLevel * 4,
      attackCooldown: randomRange(0.1, 1.3),
      maxHp: baseHp,
      range: kind === 'stalker' ? 150 : kind === 'runner' ? 20 : 24,
    };
    this.enemies.push(enemy);
  }

  private pickEnemyKind(roll: number, biome: Biome): EnemyKind {
    const biomeRangedBonus = biome === 'ridge' ? 0.12 : biome === 'swamp' ? -0.05 : 0;
    const biomeBuildBonus = biome === 'citadel' ? 0.16 : biome === 'wilds' ? 0.05 : 0;
    const ranged = clamp(this.enemyMemory.rangedBias + this.dangerLevel * 0.05 + biomeRangedBonus, 0.1, 0.7);
    const build = clamp(this.enemyMemory.buildBias + this.dangerLevel * 0.04 + biomeBuildBonus, 0.1, 0.5);
    const close = clamp(this.enemyMemory.closeBias + (biome === 'swamp' ? 0.08 : 0), 0.2, 0.8);
    const total = ranged + build + close;
    const weighted = roll * total;
    if (weighted < close) {
      return 'runner';
    }
    if (weighted < close + ranged) {
      return 'stalker';
    }
    return 'brute';
  }

  private dropEnemyLoot(enemy: Enemy): void {
    const pos = { x: enemy.x, y: enemy.y };
    const loot: ResourceType = enemy.kind === 'runner' ? 'food' : enemy.kind === 'stalker' ? 'scrap' : 'wood';
    this.resources.push({ id: this.resourceId++, type: loot, x: pos.x, y: pos.y });
    if (enemy.kind === 'brute' && random() < 0.12) {
      this.resources.push({ id: this.resourceId++, type: 'relic', x: pos.x + randomRange(-8, 8), y: pos.y + randomRange(-8, 8) });
    }
    this.quest.kills += 1;
    this.logs.unshift(`${this.enemyLabel(enemy.kind)} bị hạ.`);
    this.logs = this.logs.slice(0, 8);
  }

  private enemyLabel(kind: EnemyKind): string {
    return kind === 'runner' ? 'Kẻ lao nhanh' : kind === 'stalker' ? 'Kẻ bám đuôi' : 'Kẻ phá cửa';
  }

  private updateQuest(): void {
    if (this.quest.activePath === 'scavenger' && !this.quest.scavengerComplete && this.quest.rescuedSupply >= 12) {
      this.quest.scavengerComplete = true;
      this.player.maxHp += 12;
      this.player.hp = clamp(this.player.hp + 24, 0, this.player.maxHp);
      this.inventory.medkit += 1;
      this.log('Quest Scavenger hoàn thành. Bạn được tăng sinh lực và nhận thêm medkit.');
    }

    if (this.quest.activePath === 'defender' && !this.quest.defenderComplete) {
      const fortifications = this.structures.filter((structure) => structure.kind === 'wall' || structure.kind === 'turret').length;
      if (fortifications >= 4) {
        this.quest.defenderComplete = true;
        this.player.attackDamage += 3;
        this.log('Quest Defender hoàn thành. Sát thương vũ khí tăng lên.');
      }
    }

    if (this.quest.activePath === 'hunter' && !this.quest.hunterComplete && this.quest.kills >= 15) {
      this.quest.hunterComplete = true;
      this.player.stamina = 100;
      this.log('Quest Hunter hoàn thành. Bạn đã chứng minh mình đủ sức đối đầu các mục tiêu lớn hơn.');
    }

    const beaconRequired = this.inventory.scrap >= 8 && this.inventory.wood >= 6;
    if (!this.quest.beaconBuilt && beaconRequired && this.isNearBase()) {
      this.quest.beaconBuilt = true;
      this.craftBeacon();
    }

    const pathComplete = this.quest.scavengerComplete || this.quest.defenderComplete || this.quest.hunterComplete;
    if (this.quest.beaconBuilt && pathComplete && !this.quest.bossSummoned && this.day >= 4) {
      this.spawnBoss();
    }
  }

  private detectVictoryDefeat(): void {
    if (this.dialogueOpen) {
      this.renderDialogueOverlay();
      return;
    }

    if (this.quest.bossDefeated) {
      this.phase = 'victory';
      overlay.style.display = 'grid';
      overlay.innerHTML = `
        <div class="overlay-card">
          <h2>Chiến thắng cuối cùng</h2>
          <p>Bạn đã dựng beacon, hoàn tất nhánh nhiệm vụ và hạ gục Night Warden. Prototype giờ đã có campaign loop hoàn chỉnh.</p>
          <p>Nhấn vào màn hình để tải lại và chơi một run mới.</p>
        </div>
      `;
      return;
    }

    if (this.boss && this.boss.hp <= 0) {
      this.quest.bossDefeated = true;
      this.boss = null;
      this.log('Boss bị tiêu diệt. Căn cứ đã sống sót qua thử thách cuối.');
      return;
    }

    const beacon = this.structures.find((structure) => structure.kind === 'beacon' && structure.hp > 0);
    if (this.quest.beaconBuilt && beacon) {
      const enemiesRemaining = this.enemies.length;
      if (this.day >= 3 && enemiesRemaining < 4 && !this.quest.bossSummoned) {
        this.phase = 'victory';
        overlay.style.display = 'grid';
        overlay.innerHTML = `
          <div class="overlay-card">
            <h2>Thắng lợi</h2>
            <p>Beacon đã hoạt động, căn cứ trụ vững qua nhiều đêm. Prototype đã có lõi của roguelike, sinh tồn và phòng thủ chiến thuật.</p>
            <p>Nhấn vào màn hình để tải lại và chơi lại với bản đồ mới.</p>
          </div>
        `;
        return;
      }
    }
    if (this.player.hp <= 0) {
      this.phase = 'defeat';
      overlay.style.display = 'grid';
      overlay.innerHTML = `
        <div class="overlay-card">
          <h2>Thất bại</h2>
          <p>Nhân vật bị hạ gục. Hãy thử đổi lối chơi: thu thập sớm, dựng tường và dùng tháp để giữ khoảng cách.</p>
          <p>Nhấn vào màn hình để tải lại.</p>
        </div>
      `;
      return;
    }
    if (this.phase === 'intro') {
      overlay.style.display = 'grid';
      overlay.innerHTML = `
        <div class="overlay-card">
          <h2>Rogue Survival Tactics</h2>
          <p>Một prototype game lai giữa roguelike, survival, RTS mini và AI thích nghi. Bấm vào đây để bắt đầu.</p>
          <div class="controls">
            <div>WASD / Arrow keys: di chuyển</div>
            <div>Space: bắn</div>
            <div>F: nhặt tài nguyên</div>
            <div>K: đặt tường</div>
            <div>L: đặt tháp</div>
            <div>R: craft medkit</div>
            <div>Q: mở bảng quest ở base</div>
            <div>B: mở bảng nâng cấp ở base</div>
            <div>M: lưu tiến trình</div>
            <div>N: ván mới</div>
          </div>
        </div>
      `;
    } else {
      overlay.style.display = 'none';
    }
  }

  private toggleDialogue(): void {
    if (this.phase !== 'playing') {
      return;
    }
    this.dialogueOpen = !this.dialogueOpen;
    if (this.dialogueOpen) {
      this.log('Bảng chỉ huy mở ra. Chọn một nhánh nhiệm vụ.');
      this.renderDialogueOverlay();
    } else {
      overlay.style.display = 'none';
    }
  }

  private beginQuest(path: QuestPath): void {
    this.quest.activePath = path;
    this.dialogueOpen = false;
    overlay.style.display = 'none';
    this.log(path === 'scavenger' ? 'Quest Scavenger đã nhận.' : path === 'defender' ? 'Quest Defender đã nhận.' : 'Quest Hunter đã nhận.');
  }

  private claimQuestReward(): void {
    if (this.quest.activePath === 'scavenger' && this.quest.scavengerComplete) {
      this.inventory.food += 2;
      this.inventory.medkit += 1;
      this.quest.activePath = 'none';
      this.dialogueOpen = false;
      overlay.style.display = 'none';
      this.log('Đã nhận phần thưởng Scavenger.');
      return;
    }
    if (this.quest.activePath === 'defender' && this.quest.defenderComplete) {
      this.inventory.wood += 4;
      this.inventory.scrap += 2;
      this.quest.activePath = 'none';
      this.dialogueOpen = false;
      overlay.style.display = 'none';
      this.log('Đã nhận phần thưởng Defender.');
      return;
    }
    if (this.quest.activePath === 'hunter' && this.quest.hunterComplete) {
      this.inventory.scrap += 4;
      this.player.attackDamage += 2;
      this.quest.activePath = 'none';
      this.dialogueOpen = false;
      overlay.style.display = 'none';
      this.log('Đã nhận phần thưởng Hunter.');
    }
  }

  private renderDialogueOverlay(): void {
    overlay.style.display = 'grid';
    const questStatus = this.quest.activePath === 'none'
      ? 'Chọn một nhánh nhiệm vụ để mở khóa tiến trình.'
      : this.quest.activePath === 'scavenger'
        ? `${this.quest.rescuedSupply}/12 tài nguyên đã thu được.`
        : this.quest.activePath === 'defender'
          ? `${this.structures.filter((structure) => structure.kind === 'wall' || structure.kind === 'turret').length}/4 công trình phòng thủ.`
          : `${this.quest.kills}/15 kẻ địch đã bị hạ.`;

    overlay.innerHTML = `
      <div class="overlay-card">
        <h2>Quest Board</h2>
        <p>Chọn một hướng phát triển cho run này. Hoàn thành nhiệm vụ sẽ kích hoạt giai đoạn boss.</p>
        <p>${questStatus}</p>
        <div class="controls" style="margin-top: 16px;">
          <button class="quest-btn" data-action="quest-scavenger">Scavenger</button>
          <button class="quest-btn" data-action="quest-defender">Defender</button>
          <button class="quest-btn" data-action="quest-hunter">Hunter</button>
          <button class="quest-btn" data-action="quest-claim">Claim reward</button>
          <button class="quest-btn secondary" data-action="close-dialogue">Close</button>
        </div>
      </div>
    `;
  }

  private updateUI(isNight: boolean): void {
    hpText.textContent = `${Math.ceil(this.player.hp)} / ${this.player.maxHp}`;
    hpBar.style.width = `${(this.player.hp / this.player.maxHp) * 100}%`;
    hungerText.textContent = `${Math.ceil(this.player.hunger)} / 100`;
    hungerBar.style.width = `${this.player.hunger}%`;
    staminaText.textContent = `${Math.ceil(this.player.stamina)} / 100`;
    staminaBar.style.width = `${this.player.stamina}%`;
    timeText.textContent = isNight ? `Night ${Math.ceil(this.dayProgress * 100)}%` : `Day ${Math.ceil(this.dayProgress * 100)}%`;
    weatherText.textContent = this.weather === 'clear' ? 'Clear' : this.weather === 'fog' ? 'Fog' : 'Storm';
    waveText.textContent = `Day ${this.day}`;

    hudLeft.innerHTML = `
      <div class="hud-title">Beacon Protocol</div>
      <div>Roguelike map sinh ngẫu nhiên, AI đang thích nghi theo cách chơi của bạn.</div>
    `;
    hudRight.innerHTML = `
      <div class="hud-title">Khu vực</div>
      <div>${this.enemies.length} địch | ${this.boss ? 'Boss online' : 'Boss offline'} | ${this.structures.filter((s) => s.kind === 'turret').length} tháp</div>
    `;

    inventoryBadges.innerHTML = [
      `<span class="badge good">Wood: ${this.inventory.wood}</span>`,
      `<span class="badge warn">Scrap: ${this.inventory.scrap}</span>`,
      `<span class="badge good">Food: ${this.inventory.food}</span>`,
      `<span class="badge danger">Medkit: ${this.inventory.medkit}</span>`,
      `<span class="badge">Relic: ${this.inventory.relic}</span>`,
      `<span class="badge">Beacon: ${this.quest.beaconBuilt ? 'Online' : 'Offline'}</span>`,
      `<span class="badge">Quest: ${this.quest.activePath}</span>`,
    ].join('');

    questText.innerHTML = `
      <strong>Primary:</strong> dựng beacon, hoàn thành quest nhánh và hạ boss cuối.<br />
      <strong>Status:</strong> ${this.quest.beaconBuilt ? 'Beacon đã hoàn thành' : 'Cần tài nguyên và vị trí an toàn tại base'}<br />
      <strong>Quest:</strong> ${this.quest.activePath} | kills ${this.quest.kills} | loot ${this.quest.rescuedSupply}<br />
      <strong>Relic:</strong> ${this.inventory.relic} | trade tại base bằng phím V<br />
      <strong>Adaptive AI:</strong> ${Math.round(this.enemyMemory.rangedBias * 100)}% anti-range, ${Math.round(this.enemyMemory.buildBias * 100)}% anti-build
    `;
  }

  private spawnBoss(): void {
    this.quest.bossSummoned = true;
    this.boss = createBoss();
    const spawnSide = randomInt(0, 3);
    if (spawnSide === 0) {
      this.boss.x = TILE * 2;
      this.boss.y = randomRange(TILE * 2, WORLD_H - TILE * 2);
    } else if (spawnSide === 1) {
      this.boss.x = WORLD_W - TILE * 2;
      this.boss.y = randomRange(TILE * 2, WORLD_H - TILE * 2);
    } else if (spawnSide === 2) {
      this.boss.x = randomRange(TILE * 2, WORLD_W - TILE * 2);
      this.boss.y = TILE * 2;
    } else {
      this.boss.x = randomRange(TILE * 2, WORLD_W - TILE * 2);
      this.boss.y = WORLD_H - TILE * 2;
    }
    this.log('Night Warden xuất hiện. Trận chiến cuối cùng đã bắt đầu.');
  }

  private render(): void {
    const width = canvas.width;
    const height = canvas.height;
    const shake = this.cameraShake;
    this.cameraShake = Math.max(0, this.cameraShake - 0.02);
    const offsetX = shake > 0 ? randomRange(-shake, shake) * 8 : 0;
    const offsetY = shake > 0 ? randomRange(-shake, shake) * 8 : 0;

    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.translate(width / 2 + offsetX - this.player.x, height / 2 + offsetY - this.player.y);

    this.renderBackground();
    this.renderTiles();
    this.renderResources();
    this.renderStructures();
    this.renderProjectiles();
    this.renderEnemies();
    this.renderBoss();
    this.renderPlayer();
    this.renderFog();

    ctx.restore();
    this.renderMiniLegend();
    this.renderMiniMap();
  }

  private renderBackground(): void {
    const gradient = ctx.createRadialGradient(this.player.x, this.player.y, 80, this.player.x, this.player.y, 500);
    gradient.addColorStop(0, 'rgba(60, 120, 200, 0.12)');
    gradient.addColorStop(1, 'rgba(4, 8, 16, 1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(this.player.x - 900, this.player.y - 700, 1800, 1400);
  }

  private renderTiles(): void {
    for (let gy = 0; gy < MAP_H; gy++) {
      for (let gx = 0; gx < MAP_W; gx++) {
        const index = tileIndex(gx, gy);
        if (!this.seen[index]) {
          continue;
        }
        const tile = this.tiles[index];
        const visible = this.visible[index];
        const x = gx * TILE;
        const y = gy * TILE;
        if (tile === 'rock') {
          ctx.fillStyle = visible ? '#0f1727' : '#09101b';
        } else if (tile === 'base') {
          ctx.fillStyle = visible ? '#243453' : '#141c2c';
        } else {
          ctx.fillStyle = biomeFloorColor(getBiome(gx, gy), visible);
        }
        ctx.fillRect(x, y, TILE, TILE);
        ctx.strokeStyle = visible ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)';
        ctx.strokeRect(x, y, TILE, TILE);
      }
    }
  }

  private renderResources(): void {
    for (const resource of this.resources) {
      const grid = worldToTile(resource.x, resource.y);
      if (!this.visible[tileIndex(grid.x, grid.y)]) continue;
      ctx.beginPath();
      const biome = getBiome(grid.x, grid.y);
      ctx.fillStyle = resource.type === 'wood' ? '#9adf7c' : resource.type === 'scrap' ? (biome === 'ridge' ? '#a8c6ff' : '#b6bbc6') : biome === 'swamp' ? '#f6d06a' : '#ffd07a';
      ctx.arc(resource.x, resource.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderStructures(): void {
    for (const structure of this.structures) {
      const visible = this.visible[tileIndex(structure.gx, structure.gy)];
      if (!visible) continue;
      const pos = tileCenter(structure.gx, structure.gy);
      if (structure.kind === 'wall') {
        ctx.fillStyle = '#8b6b4f';
        ctx.fillRect(pos.x - 10, pos.y - 10, 20, 20);
      } else if (structure.kind === 'turret') {
        ctx.fillStyle = '#7ee0ff';
        ctx.fillRect(pos.x - 8, pos.y - 8, 16, 16);
      } else {
        ctx.fillStyle = '#ffb84d';
        ctx.fillRect(pos.x - 14, pos.y - 14, 28, 28);
      }
    }
  }

  private renderProjectiles(): void {
    for (const projectile of this.projectiles) {
      const grid = worldToTile(projectile.x, projectile.y);
      if (!this.visible[tileIndex(grid.x, grid.y)]) continue;
      ctx.beginPath();
      ctx.fillStyle = projectile.from === 'player' ? '#7ee0ff' : '#ff7c7c';
      ctx.arc(projectile.x, projectile.y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderEnemies(): void {
    for (const enemy of this.enemies) {
      const grid = worldToTile(enemy.x, enemy.y);
      if (!this.visible[tileIndex(grid.x, grid.y)]) continue;
      ctx.beginPath();
      ctx.fillStyle = enemy.kind === 'runner' ? '#ff8f6b' : enemy.kind === 'stalker' ? '#c58bff' : '#ff5f5f';
      ctx.arc(enemy.x, enemy.y, enemy.kind === 'brute' ? 11 : 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0c0f14';
      ctx.fillRect(enemy.x - 5, enemy.y - 2, 10, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(enemy.x - 4, enemy.y - 6, 8, 1.5);
    }
  }

  private renderBoss(): void {
    if (!this.boss) {
      return;
    }
    const grid = worldToTile(this.boss.x, this.boss.y);
    if (!this.visible[tileIndex(grid.x, grid.y)]) {
      return;
    }
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = '#ff4d6d';
    ctx.arc(this.boss.x, this.boss.y, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffd1db';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#15060b';
    ctx.fillRect(this.boss.x - 8, this.boss.y - 3, 16, 6);
    ctx.fillStyle = '#fff';
    ctx.fillRect(this.boss.x - 7, this.boss.y - 10, 14, 2);
    ctx.restore();
  }

  private renderPlayer(): void {
    ctx.beginPath();
    ctx.fillStyle = '#7ee0ff';
    ctx.arc(this.player.x, this.player.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.moveTo(this.player.x, this.player.y);
    ctx.lineTo(this.player.x + this.player.facingX * 16, this.player.y + this.player.facingY * 16);
    ctx.stroke();
  }

  private renderFog(): void {
    ctx.fillStyle = 'rgba(0,0,0,0.58)';
    ctx.fillRect(this.player.x - 1000, this.player.y - 1000, 2000, 2000);

    const radius = TILE * (VIEW_RADIUS + (this.weather === 'clear' ? 1 : 0) - (this.weather === 'storm' ? 2 : 0));
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    const fogGradient = ctx.createRadialGradient(this.player.x, this.player.y, radius * 0.15, this.player.x, this.player.y, radius * 1.5);
    fogGradient.addColorStop(0, 'rgba(0,0,0,0.96)');
    fogGradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fogGradient;
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, radius * 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private renderMiniLegend(): void {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = 'rgba(8, 12, 20, 0.75)';
    ctx.fillRect(16, canvas.height - 64, 240, 44);
    ctx.fillStyle = '#e8f0ff';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('Prototype: roguelike survival tactics with adaptive AI', 28, canvas.height - 36);
    ctx.fillStyle = '#8da4c4';
    ctx.fillText('Space bắn | F nhặt | K wall | L turret | R medkit | Q quest | B shop | M save | N new', 28, canvas.height - 20);
    ctx.restore();
  }

  private renderMiniMap(): void {
    const width = minimapCanvas.width;
    const height = minimapCanvas.height;
    minimapCtx.clearRect(0, 0, width, height);
    minimapCtx.fillStyle = 'rgba(6, 10, 18, 0.96)';
    minimapCtx.fillRect(0, 0, width, height);

    const scaleX = width / MAP_W;
    const scaleY = height / MAP_H;
    for (let gy = 0; gy < MAP_H; gy++) {
      for (let gx = 0; gx < MAP_W; gx++) {
        const index = tileIndex(gx, gy);
        if (!this.seen[index]) {
          continue;
        }
        minimapCtx.fillStyle = this.tiles[index] === 'rock' ? 'rgba(255,255,255,0.06)' : this.tiles[index] === 'base' ? '#ffb84d' : 'rgba(126,224,255,0.22)';
        minimapCtx.fillRect(gx * scaleX, gy * scaleY, Math.max(1, scaleX), Math.max(1, scaleY));
      }
    }

    for (const resource of this.resources) {
      const grid = worldToTile(resource.x, resource.y);
      if (!inBounds(grid.x, grid.y) || !this.visible[tileIndex(grid.x, grid.y)]) {
        continue;
      }
      minimapCtx.fillStyle = resource.type === 'wood' ? '#9adf7c' : resource.type === 'scrap' ? '#b6bbc6' : resource.type === 'relic' ? '#d28bff' : '#ffd07a';
      minimapCtx.fillRect(grid.x * scaleX + 1, grid.y * scaleY + 1, 2, 2);
    }

    for (const enemy of this.enemies) {
      const grid = worldToTile(enemy.x, enemy.y);
      if (!inBounds(grid.x, grid.y) || !this.visible[tileIndex(grid.x, grid.y)]) {
        continue;
      }
      minimapCtx.fillStyle = '#ff6b6b';
      minimapCtx.fillRect(grid.x * scaleX + 1, grid.y * scaleY + 1, 2, 2);
    }

    if (this.boss) {
      const bossGrid = worldToTile(this.boss.x, this.boss.y);
      if (inBounds(bossGrid.x, bossGrid.y) && this.visible[tileIndex(bossGrid.x, bossGrid.y)]) {
        minimapCtx.fillStyle = '#ff3156';
        minimapCtx.fillRect(bossGrid.x * scaleX, bossGrid.y * scaleY, 4, 4);
      }
    }

    const playerGrid = worldToTile(this.player.x, this.player.y);
    minimapCtx.fillStyle = '#7ee0ff';
    minimapCtx.fillRect(playerGrid.x * scaleX, playerGrid.y * scaleY, Math.max(2, scaleX * 1.5), Math.max(2, scaleY * 1.5));
    minimapCtx.strokeStyle = 'rgba(255,255,255,0.16)';
    minimapCtx.strokeRect(0.5, 0.5, width - 1, height - 1);
  }

  private saveGame(): void {
    const payload: SavedGame = {
      seed: rngSeed,
      player: this.player,
      inventory: this.inventory,
      quest: this.quest,
      boss: this.boss,
      upgrades: this.upgrades,
      resources: this.resources,
      enemies: this.enemies,
      projectiles: this.projectiles,
      structures: this.structures,
      logs: this.logs,
      time: this.time,
      dayProgress: this.dayProgress,
      waveTimer: this.waveTimer,
      day: this.day,
      weather: this.weather,
      weatherTimer: this.weatherTimer,
      spawnTimer: this.spawnTimer,
      enemyId: this.enemyId,
      resourceId: this.resourceId,
      cameraShake: this.cameraShake,
      dangerLevel: this.dangerLevel,
      enemyMemory: this.enemyMemory,
      seen: this.seen,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  }

  private loadGame(): SavedGame | null {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as Partial<SavedGame>;
      if (typeof parsed.seed !== 'number' || !parsed.player || !parsed.inventory || !parsed.quest || !parsed.upgrades) {
        return null;
      }
      return parsed as SavedGame;
    } catch {
      return null;
    }
  }

  private applySavedGame(saved: SavedGame): void {
    this.player = saved.player;
    this.inventory = saved.inventory;
    this.quest = saved.quest;
    this.upgrades = saved.upgrades;
    this.resources = saved.resources;
    this.enemies = saved.enemies;
    this.projectiles = saved.projectiles;
    this.structures = saved.structures;
    this.logs = saved.logs.length > 0 ? saved.logs : this.logs;
    this.time = saved.time;
    this.dayProgress = saved.dayProgress;
    this.waveTimer = saved.waveTimer;
    this.day = saved.day;
    this.weather = saved.weather;
    this.weatherTimer = saved.weatherTimer;
    this.spawnTimer = saved.spawnTimer;
    this.enemyId = saved.enemyId;
    this.resourceId = saved.resourceId;
    this.cameraShake = saved.cameraShake;
    this.dangerLevel = saved.dangerLevel;
    this.enemyMemory = saved.enemyMemory;
    this.seen = saved.seen.length === MAP_W * MAP_H ? saved.seen : this.seen;
    this.boss = saved.boss;
  }
}

new Game();
