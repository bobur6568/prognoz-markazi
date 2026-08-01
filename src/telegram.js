/**
 * Telegram Bot API orqali kanalga xabar yuborish.
 */

async function sendTelegramMessage(botToken, channelId, text) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: channelId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Telegram xatosi: ${response.status} ${errorBody}`);
  }

  return response.json();
}

/**
 * Bitta o'yin uchun post matnini formatlash.
 */
function formatMatchPost({ leagueName, homeTeam, awayTeam, kickoffTime, prediction }) {
  return `⚽️ <b>BUGUNGI PROGNOZ</b>

🏆 ${leagueName}
${homeTeam} 🆚 ${awayTeam}
🕐 ${kickoffTime} (Toshkent vaqti)

📊 <b>Ehtimolliklar:</b>
1️⃣ ${homeTeam} g'alabasi — ${prediction.homeWinProb}%
❌ Durang — ${prediction.drawProb}%
2️⃣ ${awayTeam} g'alabasi — ${prediction.awayWinProb}%

🎯 Eng ehtimolli hisob: ${prediction.mostLikelyScore}
⚡️ Kutilayotgan gollar: ${prediction.expectedTotalGoals}

#PrognozMarkazi`;
}

export { sendTelegramMessage, formatMatchPost };
