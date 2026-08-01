/**
 * API-Football (api-football.com, RapidAPI orqali ham mavjud) bilan ishlash.
 * Hujjat: https://www.api-football.com/documentation-v3
 */

const BASE_URL = "https://v3.football.api-sports.io";

async function apiFootballRequest(endpoint, params, apiKey) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  const response = await fetch(url.toString(), {
    headers: {
      "x-apisports-key": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`API-Football xatosi: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.response;
}

/**
 * Bugungi kunga rejalashtirilgan o'yinlarni olish.
 * @param {string} date - "YYYY-MM-DD" formatida
 * @param {string} apiKey
 * @param {number[]} leagueIds - kuzatiladigan liga ID'lari (masalan PL=39, La Liga=140)
 */
async function getFixturesByDate(date, apiKey, leagueIds = []) {
  const fixtures = await apiFootballRequest("/fixtures", { date }, apiKey);

  if (leagueIds.length === 0) return fixtures;
  return fixtures.filter((f) => leagueIds.includes(f.league.id));
}

/**
 * Jamoaning joriy mavsumdagi statistikasini olish (o'rtacha urgan/yegan gol).
 * @param {number} teamId
 * @param {number} leagueId
 * @param {string} season - masalan "2026"
 */
async function getTeamStats(teamId, leagueId, season, apiKey) {
  const stats = await apiFootballRequest(
    "/teams/statistics",
    { team: teamId, league: leagueId, season },
    apiKey
  );

  const goalsFor = parseFloat(stats.goals.for.average.total);
  const goalsAgainst = parseFloat(stats.goals.against.average.total);

  return { goalsFor, goalsAgainst };
}

/**
 * Liganing o'rtacha gol ko'rsatkichini olish (barcha jamoalar bo'yicha o'rtacha).
 * Eslatma: bu soddalashtirilgan hisoblash — real loyihada liga standings
 * endpointidan yoki oldindan hisoblangan konstantalardan foydalanish mumkin.
 */
async function getLeagueAverageGoals(leagueId, season, apiKey) {
  const standings = await apiFootballRequest(
    "/standings",
    { league: leagueId, season },
    apiKey
  );

  const teams = standings[0]?.league?.standings?.[0] || [];
  if (teams.length === 0) return { avgScored: 1.35, avgConceded: 1.35 }; // fallback

  let totalScored = 0;
  let totalConceded = 0;
  let totalGames = 0;

  teams.forEach((team) => {
    totalScored += team.all.goals.for;
    totalConceded += team.all.goals.against;
    totalGames += team.all.played;
  });

  return {
    avgScored: totalScored / totalGames,
    avgConceded: totalConceded / totalGames,
  };
}

export { getFixturesByDate, getTeamStats, getLeagueAverageGoals };
