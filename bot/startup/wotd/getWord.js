const Parser = require("rss-parser");
const parser = new Parser();

async function getWordOfTheDay() {
  const feed = await parser.parseURL(
    "https://www.merriam-webster.com/wotd/feed/rss2",
  );

  const item = feed.items[0];
  return {
    word: item.title,
    link: item.link,
    description: item.contentSnippet || item.content || item.description,
    date: item.pubDate,
  };
}

module.exports = { getWordOfTheDay };
