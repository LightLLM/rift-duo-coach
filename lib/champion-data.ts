/**
 * Champion Data Service
 * 
 * Fetches and caches champion data from Riot Data Dragon API
 * Provides mapping from champion IDs to champion names and images
 */

// Data Dragon version (update periodically)
const DATA_DRAGON_VERSION = '14.1.1';
const DATA_DRAGON_BASE = `https://ddragon.leagueoflegends.com/cdn/${DATA_DRAGON_VERSION}`;

/**
 * Champion information from Data Dragon
 */
export interface ChampionInfo {
  id: string;
  key: string; // Champion ID as string
  name: string;
  title: string;
  image: {
    full: string;
    sprite: string;
    group: string;
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

/**
 * Data Dragon API response structure
 */
interface DataDragonResponse {
  type: string;
  format: string;
  version: string;
  data: Record<string, ChampionInfo>;
}

// In-memory cache for champion data
let championCache: Record<string, ChampionInfo> | null = null;
let championIdMap: Record<number, ChampionInfo> | null = null;

/**
 * Static fallback mapping for top 50 most played champions
 * Used when Data Dragon API is unavailable
 */
const STATIC_CHAMPION_MAP: Record<number, { name: string; id: string }> = {
  1: { name: 'Annie', id: 'Annie' },
  2: { name: 'Olaf', id: 'Olaf' },
  3: { name: 'Galio', id: 'Galio' },
  4: { name: 'Twisted Fate', id: 'TwistedFate' },
  5: { name: 'Xin Zhao', id: 'XinZhao' },
  6: { name: 'Urgot', id: 'Urgot' },
  7: { name: 'LeBlanc', id: 'Leblanc' },
  8: { name: 'Vladimir', id: 'Vladimir' },
  9: { name: 'Fiddlesticks', id: 'Fiddlesticks' },
  10: { name: 'Kayle', id: 'Kayle' },
  11: { name: 'Master Yi', id: 'MasterYi' },
  12: { name: 'Alistar', id: 'Alistar' },
  13: { name: 'Ryze', id: 'Ryze' },
  14: { name: 'Sion', id: 'Sion' },
  15: { name: 'Sivir', id: 'Sivir' },
  16: { name: 'Soraka', id: 'Soraka' },
  17: { name: 'Teemo', id: 'Teemo' },
  18: { name: 'Tristana', id: 'Tristana' },
  19: { name: 'Warwick', id: 'Warwick' },
  20: { name: 'Nunu', id: 'Nunu' },
  21: { name: 'Miss Fortune', id: 'MissFortune' },
  22: { name: 'Ashe', id: 'Ashe' },
  23: { name: 'Tryndamere', id: 'Tryndamere' },
  24: { name: 'Jax', id: 'Jax' },
  25: { name: 'Morgana', id: 'Morgana' },
  26: { name: 'Zilean', id: 'Zilean' },
  27: { name: 'Singed', id: 'Singed' },
  28: { name: 'Evelynn', id: 'Evelynn' },
  29: { name: 'Twitch', id: 'Twitch' },
  30: { name: 'Karthus', id: 'Karthus' },
  31: { name: "Cho'Gath", id: 'Chogath' },
  32: { name: 'Amumu', id: 'Amumu' },
  33: { name: 'Rammus', id: 'Rammus' },
  34: { name: 'Anivia', id: 'Anivia' },
  35: { name: 'Shaco', id: 'Shaco' },
  36: { name: 'Dr. Mundo', id: 'DrMundo' },
  37: { name: 'Sona', id: 'Sona' },
  38: { name: 'Kassadin', id: 'Kassadin' },
  39: { name: 'Irelia', id: 'Irelia' },
  40: { name: 'Janna', id: 'Janna' },
  41: { name: 'Gangplank', id: 'Gangplank' },
  42: { name: 'Corki', id: 'Corki' },
  43: { name: 'Karma', id: 'Karma' },
  44: { name: 'Taric', id: 'Taric' },
  45: { name: 'Veigar', id: 'Veigar' },
  48: { name: 'Trundle', id: 'Trundle' },
  50: { name: 'Swain', id: 'Swain' },
  51: { name: 'Caitlyn', id: 'Caitlyn' },
  53: { name: 'Blitzcrank', id: 'Blitzcrank' },
  54: { name: 'Malphite', id: 'Malphite' },
  55: { name: 'Katarina', id: 'Katarina' },
  56: { name: 'Nocturne', id: 'Nocturne' },
  57: { name: 'Maokai', id: 'Maokai' },
  58: { name: 'Renekton', id: 'Renekton' },
  59: { name: 'Jarvan IV', id: 'JarvanIV' },
  60: { name: 'Elise', id: 'Elise' },
  61: { name: 'Orianna', id: 'Orianna' },
  62: { name: 'Wukong', id: 'MonkeyKing' },
  63: { name: 'Brand', id: 'Brand' },
  64: { name: 'Lee Sin', id: 'LeeSin' },
  67: { name: 'Vayne', id: 'Vayne' },
  68: { name: 'Rumble', id: 'Rumble' },
  69: { name: 'Cassiopeia', id: 'Cassiopeia' },
  72: { name: 'Skarner', id: 'Skarner' },
  74: { name: 'Heimerdinger', id: 'Heimerdinger' },
  75: { name: 'Nasus', id: 'Nasus' },
  76: { name: 'Nidalee', id: 'Nidalee' },
  77: { name: 'Udyr', id: 'Udyr' },
  78: { name: 'Poppy', id: 'Poppy' },
  79: { name: 'Gragas', id: 'Gragas' },
  80: { name: 'Pantheon', id: 'Pantheon' },
  81: { name: 'Ezreal', id: 'Ezreal' },
  82: { name: 'Mordekaiser', id: 'Mordekaiser' },
  83: { name: 'Yorick', id: 'Yorick' },
  84: { name: 'Akali', id: 'Akali' },
  85: { name: 'Kennen', id: 'Kennen' },
  86: { name: 'Garen', id: 'Garen' },
  89: { name: 'Leona', id: 'Leona' },
  90: { name: 'Malzahar', id: 'Malzahar' },
  91: { name: 'Talon', id: 'Talon' },
  92: { name: 'Riven', id: 'Riven' },
  96: { name: "Kog'Maw", id: 'KogMaw' },
  98: { name: 'Shen', id: 'Shen' },
  99: { name: 'Lux', id: 'Lux' },
  101: { name: 'Xerath', id: 'Xerath' },
  102: { name: 'Shyvana', id: 'Shyvana' },
  103: { name: 'Ahri', id: 'Ahri' },
  104: { name: 'Graves', id: 'Graves' },
  105: { name: 'Fizz', id: 'Fizz' },
  106: { name: 'Volibear', id: 'Volibear' },
  107: { name: 'Rengar', id: 'Rengar' },
  110: { name: 'Varus', id: 'Varus' },
  111: { name: 'Nautilus', id: 'Nautilus' },
  112: { name: 'Viktor', id: 'Viktor' },
  113: { name: 'Sejuani', id: 'Sejuani' },
  114: { name: 'Fiora', id: 'Fiora' },
  115: { name: 'Ziggs', id: 'Ziggs' },
  117: { name: 'Lulu', id: 'Lulu' },
  119: { name: 'Draven', id: 'Draven' },
  120: { name: 'Hecarim', id: 'Hecarim' },
  121: { name: "Kha'Zix", id: 'Khazix' },
  122: { name: 'Darius', id: 'Darius' },
  126: { name: 'Jayce', id: 'Jayce' },
  127: { name: 'Lissandra', id: 'Lissandra' },
  131: { name: 'Diana', id: 'Diana' },
  133: { name: 'Quinn', id: 'Quinn' },
  134: { name: 'Syndra', id: 'Syndra' },
  136: { name: 'Aurelion Sol', id: 'AurelionSol' },
  141: { name: 'Kayn', id: 'Kayn' },
  142: { name: 'Zoe', id: 'Zoe' },
  143: { name: 'Zyra', id: 'Zyra' },
  145: { name: "Kai'Sa", id: 'Kaisa' },
  147: { name: "Seraphine", id: 'Seraphine' },
  150: { name: 'Gnar', id: 'Gnar' },
  154: { name: 'Zac', id: 'Zac' },
  157: { name: 'Yasuo', id: 'Yasuo' },
  161: { name: "Vel'Koz", id: 'Velkoz' },
  163: { name: 'Taliyah', id: 'Taliyah' },
  164: { name: 'Camille', id: 'Camille' },
  166: { name: 'Akshan', id: 'Akshan' },
  200: { name: 'Bel\'Veth', id: 'Belveth' },
  201: { name: 'Braum', id: 'Braum' },
  202: { name: 'Jhin', id: 'Jhin' },
  203: { name: 'Kindred', id: 'Kindred' },
  221: { name: 'Zeri', id: 'Zeri' },
  222: { name: 'Jinx', id: 'Jinx' },
  223: { name: 'Tahm Kench', id: 'TahmKench' },
  234: { name: 'Viego', id: 'Viego' },
  235: { name: 'Senna', id: 'Senna' },
  236: { name: 'Lucian', id: 'Lucian' },
  238: { name: 'Zed', id: 'Zed' },
  240: { name: 'Kled', id: 'Kled' },
  245: { name: 'Ekko', id: 'Ekko' },
  246: { name: 'Qiyana', id: 'Qiyana' },
  254: { name: 'Vi', id: 'Vi' },
  266: { name: 'Aatrox', id: 'Aatrox' },
  267: { name: 'Nami', id: 'Nami' },
  268: { name: 'Azir', id: 'Azir' },
  350: { name: 'Yuumi', id: 'Yuumi' },
  360: { name: 'Samira', id: 'Samira' },
  412: { name: 'Thresh', id: 'Thresh' },
  420: { name: 'Illaoi', id: 'Illaoi' },
  421: { name: "Rek'Sai", id: 'RekSai' },
  427: { name: 'Ivern', id: 'Ivern' },
  429: { name: 'Kalista', id: 'Kalista' },
  432: { name: 'Bard', id: 'Bard' },
  497: { name: 'Rakan', id: 'Rakan' },
  498: { name: 'Xayah', id: 'Xayah' },
  516: { name: 'Ornn', id: 'Ornn' },
  517: { name: 'Sylas', id: 'Sylas' },
  518: { name: 'Neeko', id: 'Neeko' },
  523: { name: 'Aphelios', id: 'Aphelios' },
  526: { name: 'Rell', id: 'Rell' },
  555: { name: 'Pyke', id: 'Pyke' },
  711: { name: 'Vex', id: 'Vex' },
  777: { name: 'Yone', id: 'Yone' },
  875: { name: 'Sett', id: 'Sett' },
  876: { name: 'Lillia', id: 'Lillia' },
  887: { name: 'Gwen', id: 'Gwen' },
  888: { name: 'Renata Glasc', id: 'Renata' },
  895: { name: 'Nilah', id: 'Nilah' },
  897: { name: "K'Sante", id: 'KSante' },
  902: { name: 'Milio', id: 'Milio' },
  910: { name: 'Hwei', id: 'Hwei' },
  950: { name: 'Naafiri', id: 'Naafiri' },
};

/**
 * Fetch champion data from Data Dragon API
 */
export async function getChampionData(): Promise<Record<string, ChampionInfo>> {
  // Return cached data if available
  if (championCache) {
    return championCache;
  }

  try {
    const url = `${DATA_DRAGON_BASE}/data/en_US/champion.json`;
    const response = await fetch(url, {
      next: { revalidate: 86400 } // Cache for 24 hours
    });

    if (!response.ok) {
      throw new Error(`Data Dragon API error: ${response.status}`);
    }

    const data: DataDragonResponse = await response.json();
    championCache = data.data;

    // Build ID map for quick lookups
    championIdMap = {};
    Object.values(data.data).forEach(champ => {
      const id = parseInt(champ.key);
      championIdMap![id] = champ;
    });

    return championCache;
  } catch (error) {
    console.error('Failed to fetch champion data from Data Dragon:', error);
    
    // Return empty cache on error - will use static fallback
    championCache = {};
    return championCache;
  }
}

/**
 * Get champion name by champion ID
 */
export function getChampionName(championId: number): string {
  // Try ID map first (if Data Dragon was loaded)
  if (championIdMap && championIdMap[championId]) {
    return championIdMap[championId].name;
  }

  // Fall back to static map
  if (STATIC_CHAMPION_MAP[championId]) {
    return STATIC_CHAMPION_MAP[championId].name;
  }

  // Unknown champion
  return `Unknown Champion (ID: ${championId})`;
}

/**
 * Get champion image URL
 */
export function getChampionImageUrl(championId: number): string {
  // Try ID map first
  if (championIdMap && championIdMap[championId]) {
    const champ = championIdMap[championId];
    return `${DATA_DRAGON_BASE}/img/champion/${champ.image.full}`;
  }

  // Fall back to static map
  if (STATIC_CHAMPION_MAP[championId]) {
    const champId = STATIC_CHAMPION_MAP[championId].id;
    return `${DATA_DRAGON_BASE}/img/champion/${champId}.png`;
  }

  // Return placeholder
  return `${DATA_DRAGON_BASE}/img/champion/Aatrox.png`;
}

/**
 * Get champion info by ID
 */
export function getChampionInfo(championId: number): ChampionInfo | null {
  if (championIdMap && championIdMap[championId]) {
    return championIdMap[championId];
  }

  // Create basic info from static map
  if (STATIC_CHAMPION_MAP[championId]) {
    const champ = STATIC_CHAMPION_MAP[championId];
    return {
      id: champ.id,
      key: championId.toString(),
      name: champ.name,
      title: '',
      image: {
        full: `${champ.id}.png`,
        sprite: '',
        group: 'champion',
        x: 0,
        y: 0,
        w: 48,
        h: 48,
      }
    };
  }

  return null;
}

/**
 * Initialize champion data cache
 * Call this on application startup
 */
export async function initializeChampionData(): Promise<void> {
  try {
    await getChampionData();
    console.log('Champion data loaded successfully');
  } catch (error) {
    console.error('Failed to initialize champion data:', error);
    console.log('Using static fallback mapping');
  }
}

/**
 * Get all champion IDs and names
 */
export function getAllChampions(): Array<{ id: number; name: string }> {
  const champions: Array<{ id: number; name: string }> = [];

  // Add from ID map if available
  if (championIdMap) {
    Object.entries(championIdMap).forEach(([id, info]) => {
      champions.push({ id: parseInt(id), name: info.name });
    });
  } else {
    // Use static map
    Object.entries(STATIC_CHAMPION_MAP).forEach(([id, info]) => {
      champions.push({ id: parseInt(id), name: info.name });
    });
  }

  return champions.sort((a, b) => a.name.localeCompare(b.name));
}
