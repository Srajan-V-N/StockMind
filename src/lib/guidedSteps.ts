import { GuidedStep } from '@/types/guided';

export const GUIDED_STEPS: GuidedStep[] = [
  {
    id: 'available-cash',
    stepNumber: 1,
    targetElementId: 'guided-available-cash',
    title: 'Your Available Cash',
    description:
      'This is your virtual cash balance. You start with $100,000 of play money to practice trading. Think of it as your buying power - you can only purchase assets if you have enough cash here.',
    cryptoDescription:
      'This is your virtual cash balance. You start with $100,000 of play money. You can use this to buy crypto like Bitcoin, Ethereum, or any stock.',
    placement: 'bottom',
    chatbotPrompt:
      'Explain what "available cash" or "buying power" means in a trading portfolio. Keep it beginner-friendly.',
  },
  {
    id: 'total-value',
    stepNumber: 2,
    targetElementId: 'guided-total-value',
    title: 'Total Portfolio Value',
    description:
      'This shows the total value of everything you own - your cash plus the current market value of all your holdings. If this number is higher than your starting balance, your portfolio is in profit!',
    placement: 'bottom',
    chatbotPrompt:
      'What is "total portfolio value" and how is it calculated? Explain the difference between portfolio value and cash balance.',
  },
  {
    id: 'holdings',
    stepNumber: 3,
    targetElementId: 'guided-holdings',
    title: 'Your Holdings',
    description:
      'This table shows every stock you currently own. You can see the quantity, average purchase price, current market price, and your profit or loss on each position.',
    cryptoDescription:
      'This table shows every asset (stocks and crypto) you currently own. Track quantity, average price, current price, and profit/loss on each.',
    placement: 'top',
    chatbotPrompt:
      'What are "holdings" in a trading portfolio? Explain terms like quantity, average price, and unrealized profit/loss.',
  },
  {
    id: 'performance-chart',
    stepNumber: 4,
    targetElementId: 'guided-performance-chart',
    title: 'Performance Chart',
    description:
      'This chart visualizes how your portfolio value has changed over time. An upward trend means your trades have been profitable overall. Use the time range buttons to zoom in on different periods.',
    placement: 'top',
    chatbotPrompt:
      'How do I read a portfolio performance chart? What does it tell me about my trading history?',
  },
  {
    id: 'current-price',
    stepNumber: 5,
    targetElementId: 'guided-current-price',
    title: 'Live Price Updates',
    description:
      'This shows the current market price of your holding. Prices update in near real-time. The difference between your average purchase price and the current price determines your profit or loss.',
    placement: 'left',
    chatbotPrompt:
      'How do live stock prices work? What causes prices to change throughout the day?',
  },
  {
    id: 'start-trading',
    stepNumber: 6,
    targetElementId: 'guided-start-trading',
    title: 'Buy Interface',
    description:
      'Click this button to open the trading panel. You can search for any stock or crypto, enter the quantity you want to buy, and execute a virtual trade. The cost will be deducted from your cash balance.',
    placement: 'bottom',
    chatbotPrompt:
      'Walk me through the steps of buying a stock for the first time. What should a beginner consider?',
  },
  {
    id: 'allocation',
    stepNumber: 7,
    targetElementId: 'guided-allocation',
    title: 'Risk Management',
    description:
      'This allocation bar shows how your portfolio is split between cash and holdings. A balanced portfolio avoids putting all money into a single asset. Diversification helps manage risk.',
    placement: 'top',
    chatbotPrompt:
      'What is portfolio allocation and why is diversification important? Explain risk management basics for beginners.',
  },
  {
    id: 'sell-button',
    stepNumber: 8,
    targetElementId: 'guided-sell-button',
    title: 'Sell Interface',
    description:
      'Use this button to sell some or all of a holding. When you sell, the proceeds are added back to your cash balance. The difference between your buy and sell price determines your realized profit or loss.',
    placement: 'left',
    chatbotPrompt:
      'When and why would someone sell a stock? What is the difference between realized and unrealized profit/loss?',
  },
  {
    id: 'transactions',
    stepNumber: 9,
    targetElementId: 'guided-transactions',
    title: 'Transaction History',
    description:
      'Every trade you make is recorded here. You can review all your buy and sell transactions, including the price at the time of trade and the total amount. Use this to learn from your past decisions.',
    placement: 'top',
    chatbotPrompt:
      'Why is it important to keep track of your trading history? How can reviewing past trades help improve future decisions?',
  },
  {
    id: 'trading-psychology',
    stepNumber: 10,
    targetElementId: 'guided-total-value',
    title: 'Trading Psychology',
    description:
      'Congratulations on completing the tour! Remember: virtual trading is about learning, not chasing profits. Real markets are unpredictable. Focus on understanding how markets work, managing risk, and making informed decisions rather than trying to predict prices.',
    placement: 'bottom',
    chatbotPrompt:
      'What are the most important psychological principles for beginner traders to understand? How can emotions affect trading decisions?',
  },
];
