import { LearningStep } from '@/types/learning';

export const LEARNING_STEPS: LearningStep[] = [
  {
    id: 'understand-company',
    stepNumber: 1,
    targetElementId: 'guided-start-trading',
    title: 'Understanding the Company',
    educationalContent:
      'Before buying any stock, the most important step is understanding what the company actually does. What products or services does it sell? Who are its customers? How does it make money? A strong business model is the foundation of every sound investment thesis. Never buy a stock just because the price is moving — understand the business first.',
    cryptoContent:
      'Before buying any cryptocurrency, understand the project behind it. What problem does it solve? Who uses the protocol? What gives the token its value? Is it a store of value like Bitcoin, a smart contract platform like Ethereum, or a utility token? Never buy crypto just because the price is rising.',
    keyConcepts: [
      'Always research the business model before trading',
      'Understand how the company generates revenue',
      'Know the industry and competitive landscape',
      'A rising price alone is never a reason to buy',
    ],
    proTip:
      'Read the company\'s "About" section and recent news before making any trade. If you can\'t explain what the company does in one sentence, you don\'t understand it well enough yet.',
    placement: 'bottom',
    mentorPrompt:
      'Explain why understanding a company\'s business model is the first step before trading its stock. Give examples of what to research and red flags to watch for. Keep it educational and beginner-friendly.',
    interactionLockIds: ['guided-sell-button'],
  },
  {
    id: 'price-history',
    stepNumber: 2,
    targetElementId: 'guided-performance-chart',
    title: 'Reading Price History',
    educationalContent:
      'Charts show you how a stock\'s price has moved over time. Look for trends — is the price generally going up, down, or sideways? High volatility (big swings) means higher risk. Don\'t try to predict the future from charts alone, but use them to understand the stock\'s behavior and how much it typically moves.',
    cryptoContent:
      'Crypto charts can show extreme volatility compared to stocks. A 10-20% daily swing is not unusual for cryptocurrencies. This means both bigger potential gains and bigger potential losses. Use charts to understand typical price ranges, not to predict future movement.',
    keyConcepts: [
      'Identify trends: uptrend, downtrend, or sideways',
      'Volatility measures how much prices swing',
      'Past performance does not predict future results',
      'Use different time ranges to see short-term vs long-term patterns',
    ],
    proTip:
      'Look at both the 1-month and 1-year charts. A stock might look great on a 5-day chart but terrible over a year. Always zoom out to see the bigger picture.',
    placement: 'top',
    mentorPrompt:
      'Teach me how to read a basic stock price chart. What are trends, support, resistance, and volatility? How should a beginner interpret price history without falling into prediction traps?',
  },
  {
    id: 'news-sentiment',
    stepNumber: 3,
    targetElementId: null,
    title: 'News & Market Sentiment',
    educationalContent:
      'News moves markets. Earnings reports, product launches, regulatory changes, and macroeconomic events all affect stock prices. However, by the time you read news, the market has often already reacted. Learn to distinguish between noise (daily headlines) and signal (fundamental business changes). Don\'t make trades based on a single headline.',
    cryptoContent:
      'Crypto markets are especially sensitive to news — a single tweet, regulatory announcement, or exchange hack can move prices dramatically. Social media sentiment drives short-term crypto prices more than fundamentals. Be skeptical of hype and fear alike.',
    keyConcepts: [
      'Markets often price in news before you read it',
      'Distinguish between noise and meaningful business changes',
      'Earnings reports are key events for stock prices',
      'Never trade on a single headline or social media post',
    ],
    proTip:
      'When you see breaking news about a stock, check if the price already moved. If it has, the "opportunity" may already be gone. Reacting emotionally to news is one of the biggest mistakes beginners make.',
    placement: 'bottom',
    mentorPrompt:
      'How does news affect stock and crypto prices? Teach me to distinguish between market noise and meaningful signals. What types of news events matter most and how should a beginner react to them?',
    conceptualStep: true,
  },
  {
    id: 'entry-timing',
    stepNumber: 4,
    targetElementId: 'guided-current-price',
    title: 'Entry Timing & Patience',
    educationalContent:
      'When to buy is just as important as what to buy. FOMO (Fear Of Missing Out) causes beginners to buy at peaks. Instead, be patient. There\'s no rush — the market is open every day. Look at the current price relative to recent history. Is it near a high, low, or somewhere in between? Patience and discipline beat impulsive decisions.',
    cryptoContent:
      'Crypto markets run 24/7, which creates constant FOMO pressure. Just because prices are moving right now doesn\'t mean you need to act immediately. Crypto is especially prone to "buy the hype, sell the news" patterns. Patience is even more critical in volatile crypto markets.',
    keyConcepts: [
      'FOMO is the enemy of good decision-making',
      'Compare current price to historical range before buying',
      'There is always another opportunity — don\'t rush',
      'Buying at all-time highs carries additional risk',
    ],
    proTip:
      'Ask yourself: "Would I still want to buy this at this price if the market was closed for 5 years?" If the answer is no, you might be chasing short-term momentum rather than investing in value.',
    placement: 'left',
    mentorPrompt:
      'Explain the concept of entry timing in trading. What is FOMO and how does it hurt beginners? How should someone think about when to buy a stock or crypto? Emphasize patience and discipline.',
    interactionLockIds: ['guided-start-trading'],
  },
  {
    id: 'position-sizing',
    stepNumber: 5,
    targetElementId: 'guided-start-trading',
    title: 'Position Sizing',
    educationalContent:
      'How much to invest in a single trade is a critical decision. A common beginner mistake is putting too much money into one stock. Position sizing means deciding what percentage of your total portfolio to allocate to each trade. Most experienced traders risk only 1-5% of their portfolio on any single position. This protects you if one trade goes wrong.',
    cryptoContent:
      'Position sizing is even more important with crypto because of extreme volatility. A 50% drop in a single crypto is not uncommon. If you put 50% of your portfolio into one crypto and it drops 50%, you\'ve lost 25% of everything. Keep crypto positions small relative to your total portfolio.',
    keyConcepts: [
      'Never put all your money in a single trade',
      'Risk only 1-5% of your portfolio per position',
      'Smaller positions let you survive bad trades',
      'Position size should reflect your conviction AND the risk',
    ],
    proTip:
      'Before every trade, calculate: "If this drops 20%, how much of my total portfolio do I lose?" If the answer makes you uncomfortable, your position is too large.',
    placement: 'bottom',
    mentorPrompt:
      'Teach me about position sizing in trading. What percentage of a portfolio should a beginner allocate to a single trade? Why is position sizing considered one of the most important risk management tools?',
    interactionLockIds: ['guided-sell-button'],
  },
  {
    id: 'risk-management',
    stepNumber: 6,
    targetElementId: 'guided-allocation',
    title: 'Risk Management & Diversification',
    educationalContent:
      'Risk management is what separates successful traders from those who blow up their accounts. Diversification — spreading your money across different stocks, sectors, and asset types — reduces the impact of any single bad trade. Your allocation bar shows how your portfolio is split. Keeping some cash reserve is important so you can take advantage of opportunities.',
    cryptoContent:
      'Diversification in crypto means owning different types of tokens — not just multiple meme coins. Consider spreading across large-caps (BTC, ETH), mid-caps, and keeping significant cash reserves. Crypto correlation is high during crashes, so cash is your real diversification.',
    keyConcepts: [
      'Diversify across different stocks, sectors, and asset types',
      'Keep a cash reserve for new opportunities',
      'Correlation matters — assets that move together don\'t diversify',
      'Capital preservation is more important than capital growth',
    ],
    proTip:
      'The allocation bar on your portfolio is your risk dashboard. If more than 30% of your portfolio is in a single stock, you\'re concentrated — not diversified. Rebalancing is not a sign of weakness, it\'s discipline.',
    placement: 'top',
    mentorPrompt:
      'Explain risk management and diversification for beginner traders. What is portfolio allocation, why does it matter, and how should someone think about balancing risk and reward?',
  },
  {
    id: 'trade-execution',
    stepNumber: 7,
    targetElementId: 'guided-start-trading',
    title: 'Executing a Trade',
    educationalContent:
      'When you\'re ready to trade, slow down. Double-check the symbol, quantity, and total cost before confirming. In real markets, you also consider order types (market vs limit), spreads, and fees. Here in virtual trading, focus on building the habit of reviewing every order carefully. A misplaced decimal point has cost real traders real money.',
    cryptoContent:
      'In real crypto trading, transaction fees (gas fees) can vary wildly and eat into your profits, especially on small trades. Some exchanges charge different fees for market vs limit orders. Here in virtual trading, practice the discipline of double-checking every detail.',
    keyConcepts: [
      'Always double-check symbol, quantity, and total cost',
      'In real markets, order type matters (market vs limit)',
      'Trading fees reduce your profits on every trade',
      'Build the habit of careful review before every execution',
    ],
    proTip:
      'Create a pre-trade checklist: 1) Do I understand this company? 2) Is my position size appropriate? 3) What\'s my plan if it drops 20%? 4) Am I buying based on research or emotion? If you can\'t answer all four, don\'t trade.',
    placement: 'bottom',
    mentorPrompt:
      'Walk me through best practices for executing a trade. What should a beginner check before confirming an order? What are common execution mistakes and how to avoid them?',
  },
  {
    id: 'monitoring-positions',
    stepNumber: 8,
    targetElementId: 'guided-holdings',
    title: 'Monitoring Your Positions',
    educationalContent:
      'After buying, you\'ll see your holdings and their unrealized profit/loss. "Unrealized" means you haven\'t sold yet — the gain or loss only becomes real when you sell. Watching positions go red is emotionally difficult, but it\'s normal. Markets fluctuate daily. The key is having a plan before you buy so you\'re not making emotional decisions while watching your P/L.',
    cryptoContent:
      'Crypto positions can swing wildly in hours. Checking your portfolio every 5 minutes creates anxiety and leads to impulsive trades. Set a schedule for reviewing positions (e.g., once daily) rather than watching every tick. Unrealized losses in crypto can be gut-wrenching but often recover.',
    keyConcepts: [
      'Unrealized P/L only becomes real when you sell',
      'Daily fluctuations are normal — don\'t panic',
      'Have a plan before you buy so emotions don\'t drive decisions',
      'Checking too frequently leads to overtrading',
    ],
    proTip:
      'The best traders make their plan BEFORE entering a trade: "I\'ll sell if it drops X% or rises Y%." Then they follow the plan regardless of emotions. Write your plan down before each trade.',
    placement: 'top',
    mentorPrompt:
      'Explain how to monitor stock positions without letting emotions drive decisions. What is unrealized vs realized P/L? How often should a beginner check their portfolio? What are signs of emotional trading?',
    interactionLockIds: ['guided-start-trading'],
  },
  {
    id: 'exit-strategy',
    stepNumber: 9,
    targetElementId: 'guided-sell-button',
    title: 'Exit Strategy',
    educationalContent:
      'Knowing when to sell is harder than knowing when to buy. An exit strategy means deciding in advance: at what profit will you take gains? At what loss will you cut? Without a plan, greed makes you hold winners too long (and watch profits evaporate) while fear makes you sell losers too early or hold them hoping for recovery.',
    cryptoContent:
      'Exit strategy is critical in crypto where 80-90% drops are possible. "Diamond hands" (never selling) sounds brave but has destroyed portfolios. Taking partial profits at milestones — selling 25% at 2x, 25% at 3x — is a disciplined approach that locks in gains while keeping upside exposure.',
    keyConcepts: [
      'Decide your exit points BEFORE entering a trade',
      'Set both profit targets and stop-loss levels',
      'Partial selling lets you lock in gains while keeping exposure',
      'Hoping a losing position will recover is not a strategy',
    ],
    proTip:
      'A simple rule: never let a winning trade turn into a losing trade. If a stock rises 20% and then starts falling back, consider taking some profit. Protecting gains is as important as generating them.',
    placement: 'left',
    mentorPrompt:
      'Teach me about exit strategies in trading. When should someone sell a stock — both for taking profits and cutting losses? What is a stop-loss? How do emotions interfere with selling decisions?',
  },
  {
    id: 'post-trade-review',
    stepNumber: 10,
    targetElementId: 'guided-transactions',
    title: 'Post-Trade Review',
    educationalContent:
      'Your transaction history is your trading journal. After every trade, review what went right and wrong. Did you follow your plan? Did you buy impulsively? Did you sell too early or too late? The best traders constantly learn from their past decisions. Patterns in your mistakes will teach you more than any book.',
    cryptoContent:
      'Review your crypto trades especially carefully. Did you FOMO into a pump? Did you panic sell during a dip? Crypto\'s volatility makes emotional trading more likely. Your transaction history reveals patterns in your behavior that you might not notice in the moment.',
    keyConcepts: [
      'Review every trade to understand what you did right and wrong',
      'Look for patterns in your mistakes',
      'A trading journal accelerates learning dramatically',
      'Your transaction history is your most valuable teacher',
    ],
    proTip:
      'After each trade, write one sentence: "I traded because..." If your reason was an emotion ("I was scared" or "everyone was buying"), that\'s a red flag. Good reasons are research-based, not feeling-based.',
    placement: 'top',
    mentorPrompt:
      'Why is post-trade review important for improving as a trader? How should a beginner review their transaction history? What patterns should they look for in their trading mistakes?',
  },
  {
    id: 'trading-psychology',
    stepNumber: 11,
    targetElementId: 'guided-total-value',
    title: 'Trading Psychology',
    educationalContent:
      'The biggest obstacle in trading isn\'t the market — it\'s yourself. Fear makes you sell at the worst time. Greed makes you hold too long or bet too big. Overconfidence after a win leads to reckless trades. The market doesn\'t care about your emotions, but your emotions will destroy your returns if left unchecked. Master yourself before trying to master the market.',
    cryptoContent:
      'Crypto amplifies every psychological trap. 24/7 markets mean you can make impulsive trades at 3 AM. Social media creates echo chambers of hype. The extreme volatility triggers fight-or-flight responses. Recognize that crypto FOMO and panic are the strongest in all financial markets.',
    keyConcepts: [
      'Fear and greed are the two emotions that destroy traders',
      'Overtrading after a win is as dangerous as panic selling',
      'The market is not your opponent — your emotions are',
      'Discipline and patience beat intelligence and speed',
    ],
    proTip:
      'Set rules and follow them robotically. "I will not trade more than 3 times per week." "I will not check prices more than twice per day." "I will never invest money I can\'t afford to lose." Rules protect you from yourself.',
    placement: 'bottom',
    mentorPrompt:
      'Explain the psychology of trading. What are the most common emotional pitfalls for beginners — fear, greed, FOMO, overconfidence? How can someone develop emotional discipline in trading?',
  },
];
