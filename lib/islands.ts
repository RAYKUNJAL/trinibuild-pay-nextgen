export type IslandCode =
  | "tt"
  | "jm"
  | "bb"
  | "gy"
  | "gd"
  | "lc"
  | "ag"
  | "vc"
  | "dm"
  | "bs"
  | "kn"
  | "lc"
  | "vi";

export interface Island {
  code: string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  /** Approximate carnival / major fete season label */
  carnival: string;
  cities: readonly string[];
}

export const ISLANDS: Island[] = [
  {
    code: "tt",
    name: "Trinidad & Tobago",
    flag: "🇹🇹",
    currency: "TTD",
    currencySymbol: "TT$",
    carnival: "Feb/Mar",
    cities: ["Port of Spain", "San Fernando", "Arima", "Chaguanas", "Tobago", "Scarborough"],
  },
  {
    code: "jm",
    name: "Jamaica",
    flag: "🇯🇲",
    currency: "JMD",
    currencySymbol: "J$",
    carnival: "Aug",
    cities: ["Kingston", "Montego Bay", "Ocho Rios", "Negril", "Portmore"],
  },
  {
    code: "bb",
    name: "Barbados",
    flag: "🇧🇧",
    currency: "BBD",
    currencySymbol: "Bds$",
    carnival: "Jul/Aug",
    cities: ["Bridgetown", "Holetown", "Oistins", "Speightstown"],
  },
  {
    code: "gy",
    name: "Guyana",
    flag: "🇬🇾",
    currency: "GYD",
    currencySymbol: "G$",
    carnival: "May",
    cities: ["Georgetown", "Linden", "New Amsterdam", "Bartica"],
  },
  {
    code: "gd",
    name: "Grenada",
    flag: "🇬🇩",
    currency: "XCD",
    currencySymbol: "EC$",
    carnival: "Aug",
    cities: ["St. George's", "Gouyave", "Grenville"],
  },
  {
    code: "lc",
    name: "St. Lucia",
    flag: "🇱🇨",
    currency: "XCD",
    currencySymbol: "EC$",
    carnival: "Jul",
    cities: ["Castries", "Gros Islet", "Soufrière", "Vieux Fort"],
  },
  {
    code: "ag",
    name: "Antigua & Barbuda",
    flag: "🇦🇬",
    currency: "XCD",
    currencySymbol: "EC$",
    carnival: "Aug",
    cities: ["St. John's", "English Harbour", "Jolly Harbour"],
  },
  {
    code: "vc",
    name: "St. Vincent",
    flag: "🇻🇨",
    currency: "XCD",
    currencySymbol: "EC$",
    carnival: "Jun/Jul",
    cities: ["Kingstown", "Georgetown", "Barrouallie"],
  },
  {
    code: "dm",
    name: "Dominica",
    flag: "🇩🇲",
    currency: "XCD",
    currencySymbol: "EC$",
    carnival: "Feb/Mar",
    cities: ["Roseau", "Portsmouth"],
  },
  {
    code: "bs",
    name: "Bahamas",
    flag: "🇧🇸",
    currency: "BSD",
    currencySymbol: "B$",
    carnival: "Jun/Jul",
    cities: ["Nassau", "Freeport", "Marsh Harbour"],
  },
  {
    code: "kn",
    name: "St. Kitts & Nevis",
    flag: "🇰🇳",
    currency: "XCD",
    currencySymbol: "EC$",
    carnival: "Dec/Jan",
    cities: ["Basseterre", "Charlestown"],
  },
  {
    code: "vi",
    name: "US Virgin Islands",
    flag: "🇻🇮",
    currency: "USD",
    currencySymbol: "$",
    carnival: "Apr",
    cities: ["Charlotte Amalie", "Christiansted", "Cruz Bay"],
  },
];

export const ISLAND_MAP = Object.fromEntries(ISLANDS.map((i) => [i.code, i])) as Record<string, Island>;

export function getIslandByCode(code: string): Island | undefined {
  return ISLAND_MAP[code];
}

export function getIslandCities(code: string): readonly string[] {
  return ISLAND_MAP[code]?.cities ?? [];
}

export function getIslandCurrency(code: string): string {
  return ISLAND_MAP[code]?.currency ?? "TTD";
}

export const DEFAULT_ISLAND = "tt";
