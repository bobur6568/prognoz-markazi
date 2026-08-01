/**
 * Poisson taqsimoti asosidagi futbol natija prognozi.
 *
 * G'oya: har bir jamoaning "kuch" ko'rsatkichi (attack/defense strength)
 * ligadagi o'rtacha ko'rsatkichlarga nisbatan hisoblanadi, so'ng ikkala
 * jamoaning kutilayotgan gol soni (lambda) topiladi va Poisson
 * taqsimoti yordamida har xil natija ehtimolliklari hisoblanadi.
 */

// Faktorial (Poisson formulasi uchun kerak)
function factorial(n) {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

// Poisson ehtimollik funksiyasi: P(X = k) berilgan lambda uchun
function poissonProbability(lambda, k) {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

/**
 * Jamoa kuchini hisoblash.
 * @param {number} teamGoalsScoredAvg - jamoaning o'rtacha urgan goli
 * @param {number} teamGoalsConcededAvg - jamoaning o'rtacha yegan goli
 * @param {number} leagueAvgGoalsScored - liga o'rtacha gol ko'rsatkichi
 * @param {number} leagueAvgGoalsConceded - liga o'rtacha yegan gol ko'rsatkichi
 */
function calculateTeamStrength(teamGoalsScoredAvg, teamGoalsConcededAvg, leagueAvgGoalsScored, leagueAvgGoalsConceded) {
  return {
    attack: teamGoalsScoredAvg / leagueAvgGoalsScored,
    defense: teamGoalsConcededAvg / leagueAvgGoalsConceded,
  };
}

/**
 * Ikki jamoa uchun kutilayotgan gol sonini (lambda) hisoblash.
 * homeAdvantage - uy egasi ustunligi koeffitsienti (odatda ~1.1-1.4)
 */
function calculateExpectedGoals(homeStrength, awayStrength, leagueAvgGoalsScored, homeAdvantage = 1.2) {
  const homeLambda = homeStrength.attack * awayStrength.defense * leagueAvgGoalsScored * homeAdvantage;
  const awayLambda = awayStrength.attack * homeStrength.defense * leagueAvgGoalsScored;
  return { homeLambda, awayLambda };
}

/**
 * To'liq prognoz: 1X2 ehtimolliklari va eng ehtimolli hisob.
 * @param {number} maxGoals - hisoblanadigan maksimal gol soni (odatda 6 yetarli)
 */
function predictMatch(homeLambda, awayLambda, maxGoals = 6) {
  let homeWinProb = 0;
  let drawProb = 0;
  let awayWinProb = 0;
  const scoreProbs = [];

  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      const p = poissonProbability(homeLambda, h) * poissonProbability(awayLambda, a);
      scoreProbs.push({ home: h, away: a, prob: p });

      if (h > a) homeWinProb += p;
      else if (h === a) drawProb += p;
      else awayWinProb += p;
    }
  }

  // Eng ehtimolli aniq hisobni topish
  scoreProbs.sort((a, b) => b.prob - a.prob);
  const mostLikelyScore = scoreProbs[0];

  const expectedTotalGoals = homeLambda + awayLambda;

  return {
    homeWinProb: Math.round(homeWinProb * 100),
    drawProb: Math.round(drawProb * 100),
    awayWinProb: Math.round(awayWinProb * 100),
    mostLikelyScore: `${mostLikelyScore.home}-${mostLikelyScore.away}`,
    expectedTotalGoals: expectedTotalGoals.toFixed(1),
  };
}

export { calculateTeamStrength, calculateExpectedGoals, predictMatch, poissonProbability };
