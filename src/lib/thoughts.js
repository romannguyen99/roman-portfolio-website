// Thoughts — essay/article list data. Pure data, unit-tested in thoughts.test.js.
// Categories / dates / read-times / excerpts are illustrative placeholders (real content later).
export const CATEGORIES = ['Analysis', 'Strategy', 'Perspective', 'Product'];

export const THOUGHTS = [
  {
    id: 'model-built',
    title: 'Why Data Science Projects Fail After the Model Is Built',
    category: 'Analysis',
    date: 'Jun 2026',
    readTime: '6 min read',
    excerpt:
      "A model in a notebook isn't a decision in production — and the gap between the two is where most projects quietly die.",
    href: '#',
  },
  {
    id: 'dashboards-decisions',
    title: 'From Dashboards to Decisions',
    category: 'Strategy',
    date: 'May 2026',
    readTime: '5 min read',
    excerpt:
      'Most dashboards inform; few change what anyone actually does. Designing for the decision, not the chart.',
    href: '#',
  },
  {
    id: 'human-side-ml',
    title: 'The Human Side of Machine Learning',
    category: 'Perspective',
    date: 'Apr 2026',
    readTime: '7 min read',
    excerpt:
      "The hardest problems in ML are rarely the math. They're trust, incentives, and the humans kept in the loop.",
    href: '#',
  },
  {
    id: 'better-data-products',
    title: 'Building Better Data Products',
    category: 'Product',
    date: 'Mar 2026',
    readTime: '5 min read',
    excerpt:
      'What it takes to turn a clever model into something people rely on every day — and keep relying on.',
    href: '#',
  },
];
