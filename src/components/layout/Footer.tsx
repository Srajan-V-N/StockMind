'use client';

export function Footer() {
  return (
    <footer className="border-t border-white/10 dark:border-white/5 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold mb-3 gradient-text">StockMind</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your global financial intelligence and learning platform.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Features</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>Stocks & Crypto</li>
              <li>Virtual Trading</li>
              <li>Market News</li>
              <li>AI Chatbot</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>Terms of Service</li>
              <li>Privacy Policy</li>
              <li>Disclaimer</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Disclaimer</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              This platform is for educational purposes only. Not financial advice.
              No real-money trading.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/10 dark:border-white/5 text-center text-sm text-gray-600 dark:text-gray-400">
          <p suppressHydrationWarning>&copy; {new Date().getFullYear()} StockMind. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
