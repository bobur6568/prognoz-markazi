import { getFixturesByDate, getTeamStats, getLeagueAverageGoals } from "./apiFootball.js";
import { calculateTeamStrength, calculateExpectedGoals, predictMatch } from "./poisson.js";
import { sendTelegramMessage, formatMatchPost } from "./telegram.js";

// Kuzatiladigan ligalar (API-Football ID'lari bo'yicha)
// 39 = Premier League, 140 = La Liga, 135 = Serie A, 78 = Bundesliga, 61 = Ligue 1
const TRACKED_LEAGUES = {
  39: "Premier League",
  140: "La Liga",
  135: "Serie A",
  78: "Bundesliga",
  61: "Ligue 1",
};

const SEASON = "2026";

function toTashkentTime(utcDateString) {
  const date = new Date(utcDateString);
  return date.toLocaleTimeString("uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tashkent",
  });
}

/**
 * Asosiy ish jarayoni: bugungi o'yinlarni topish, prognoz qilish,
 * va har biri uchun kanalga post yuborish.
 */
async function runDailyPredictions(env) {
  const today = new Date().toISOString().split("T")[0];
  const leagueIds = Object.keys(TRACKED_LEAGUES).map(Number);

  const fixtures = await getFixturesByDate(today, env.API_FOOTBALL_KEY, leagueIds);

  if (fixtures.length === 0) {
    console.log("Bugun kuzatilayotgan ligalarda o'yin yo'q.");
    return { postedCount: 0 };
  }

  // Bir kunda liga statistikasini bir marta olib, keshlab qo'yamiz
  const leagueAvgCache = {};
  let postedCount = 0;

  for (const fixture of fixtures) {
    const fixtureKey = `posted:${fixture.fixture.id}`;

    // Takroriy post bo'lmasligi uchun tekshirish
    const alreadyPosted = await env.PROGNOZ_KV.get(fixtureKey);
    if (alreadyPosted) continue;

    const leagueId = fixture.league.id;
    const leagueName = TRACKED_LEAGUES[leagueId] || fixture.league.name;

    if (!leagueAvgCache[leagueId]) {
      leagueAvgCache[leagueId] = await getLeagueAverageGoals(leagueId, SEASON, env.API_FOOTBALL_KEY);
    }
    const leagueAvg = leagueAvgCache[leagueId];

    try {
      const homeStats = await getTeamStats(fixture.teams.home.id, leagueId, SEASON, env.API_FOOTBALL_KEY);
      const awayStats = await getTeamStats(fixture.teams.away.id, leagueId, SEASON, env.API_FOOTBALL_KEY);

      const homeStrength = calculateTeamStrength(
        homeStats.goalsFor,
        homeStats.goalsAgainst,
        leagueAvg.avgScored,
        leagueAvg.avgConceded
      );
      const awayStrength = calculateTeamStrength(
        awayStats.goalsFor,
        awayStats.goalsAgainst,
        leagueAvg.avgScored,
        leagueAvg.avgConceded
      );

      const { homeLambda, awayLambda } = calculateExpectedGoals(homeStrength, awayStrength, leagueAvg.avgScored);
      const prediction = predictMatch(homeLambda, awayLambda);

      const postText = formatMatchPost({
        leagueName,
        homeTeam: fixture.teams.home.name,
        awayTeam: fixture.teams.away.name,
        kickoffTime: toTashkentTime(fixture.fixture.date),
        prediction,
      });

      await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHANNEL_ID, postText);

      // Post qilinganini belgilash (24 soatlik TTL bilan)
      await env.PROGNOZ_KV.put(fixtureKey, "1", { expirationTtl: 86400 });
      postedCount++;
    } catch (err) {
      console.error(`Xato (fixture ${fixture.fixture.id}):`, err.message);
      // Bitta o'yinda xato bo'lsa ham, qolganlarni davom ettiramiz
      continue;
    }
  }

  return { postedCount, totalFixtures: fixtures.length };
}

export default {
  // Cron trigger orqali chaqiriladi (wrangler.toml dagi [triggers] bo'yicha)
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runDailyPredictions(env));
  },

  // Qo'lda sinash uchun HTTP endpoint (masalan brauzerdan yoki curl bilan)
  // Productionda buni olib tashlash yoki maxfiy token bilan himoyalash tavsiya etiladi
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/run") {
      const result = await runDailyPredictions(env);
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response("Prognoz Markazi bot ishlayapti. /run orqali qo'lda sinab ko'ring.");
  },
};
