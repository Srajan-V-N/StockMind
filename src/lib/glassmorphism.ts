// Glassmorphism utility classes and styles
export const glassStyles = {
  card: 'glass-card',
  cardHover: 'glass-card glass-card-hover',
  navbar: 'glass-navbar',
  button: 'glass-button',
  input: 'glass-input',
  dropdown: 'glass-dropdown',
};

// Generate glassmorphism style object
export function createGlassStyle(
  opacity: number = 0.1,
  blur: number = 12
): React.CSSProperties {
  return {
    backgroundColor: `rgba(255, 255, 255, ${opacity})`,
    backdropFilter: `blur(${blur}px)`,
    WebkitBackdropFilter: `blur(${blur}px)`,
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  };
}

// Get glassmorphism class based on theme
export function getGlassClass(variant: 'card' | 'button' | 'input' | 'navbar' = 'card'): string {
  const baseClasses = {
    card: 'bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl shadow-xl',
    button: 'bg-white/5 hover:bg-white/10 dark:hover:bg-white/15 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-lg transition-all duration-200',
    input: 'bg-white/5 dark:bg-black/20 backdrop-blur-sm border border-white/20 dark:border-white/10 focus:border-brand-400 dark:focus:border-brand-500 rounded-lg transition-all',
    navbar: 'bg-white/80 dark:bg-black/80 backdrop-blur-lg border-b border-white/20 dark:border-white/10',
  };

  return baseClasses[variant];
}
