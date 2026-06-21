// Selected Works — project data. Pure data, unit-tested in works.test.js.
// Summaries / tools / metrics are illustrative placeholders (real content swapped in later).
export const MOTIFS = ['churn', 'forecast', 'sentiment', 'recsys'];

export const WORKS = [
  {
    id: 'churn',
    title: 'Customer Churn Prediction',
    category: 'Prediction',
    summary: 'Flagging at-risk accounts before they lapse, so retention can act early.',
    tools: ['Python', 'scikit-learn', 'XGBoost'],
    metric: { value: '↓ 23%', label: 'churn in pilot' },
    motif: 'churn',
    href: '#',
  },
  {
    id: 'forecast',
    title: 'Sales Forecasting Dashboard',
    category: 'Forecasting',
    summary: 'Turning noisy history into a forward view leaders can plan against.',
    tools: ['Python', 'Prophet', 'Plotly'],
    metric: { value: '92%', label: 'forecast accuracy' },
    motif: 'forecast',
    href: '#',
  },
  {
    id: 'sentiment',
    title: 'Sentiment Analysis from Social Data',
    category: 'Natural Language',
    summary: 'Reading the mood of the crowd across millions of unstructured posts.',
    tools: ['Python', 'spaCy', 'Transformers'],
    metric: { value: '1.2M', label: 'posts classified' },
    motif: 'sentiment',
    href: '#',
  },
  {
    id: 'recsys',
    title: 'Recommendation Engine',
    category: 'Personalization',
    summary: 'Matching people to what they will value next, at scale and in real time.',
    tools: ['Python', 'TensorFlow', 'FAISS'],
    metric: { value: '+18%', label: 'recommendation CTR' },
    motif: 'recsys',
    href: '#',
  },
];
