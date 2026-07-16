/**
 * Bundled venue knowledge base used to ground the AI Fan Copilot (RAG).
 *
 * For the hackathon MVP this ships with the backend so it is available in the
 * App Runner container with no external calls. In production this would be
 * sourced from S3 (see architecture.md) and indexed with Titan embeddings.
 */
export interface KnowledgeDoc {
  id: string;
  title: string;
  category: 'entry' | 'accessibility' | 'amenities' | 'transport' | 'general';
  text: string;
}

export const knowledgeBase: KnowledgeDoc[] = [
  {
    id: 'gates-entry',
    title: 'Entry & Gates',
    category: 'entry',
    text: 'Gates open 3 hours before kickoff. Gate A (North) and Gate C (East) are the main pedestrian entrances. Gate C has step-free access and priority lanes for guests requiring assistance. Bring a mobile ticket; security screening applies at every gate.',
  },
  {
    id: 'accessibility',
    title: 'Accessibility',
    category: 'accessibility',
    text: 'Step-free routes connect all concourse levels via elevators located near Gate C. Sensory-friendly quiet rooms are on Concourse Level 1. Wheelchair-accessible seating and companion seats are available in every stand. Assistance can be requested at any information point or through the app.',
  },
  {
    id: 'amenities',
    title: 'Amenities & Sustainability',
    category: 'amenities',
    text: 'Free water refill stations are available on every concourse level. Recycling and compost stations are located beside all food courts. Reusable cups are encouraged. First-aid points are on each level near the elevators.',
  },
  {
    id: 'transport',
    title: 'Transport',
    category: 'transport',
    text: 'The metro station is a 6-minute step-free walk from Gate A. Accessible shuttle drop-off is at the East plaza near Gate C. Park-and-ride lots run continuous shuttles starting 3 hours before kickoff. Rideshare pickup is at the South lot after the match.',
  },
  {
    id: 'seating-wayfinding',
    title: 'Finding Your Seat',
    category: 'general',
    text: 'Your section, row, and seat are printed on your ticket. Enter through the gate nearest your section: North sections use Gate A, East sections use Gate C. Stewards in high-visibility vests can direct you, and the app provides gate-to-seat directions including step-free options.',
  },
  {
    id: 'match-info',
    title: 'Match Day Information',
    category: 'general',
    text: 'Kickoff times are shown on your ticket and the app. Prohibited items include large bags, professional cameras, and outside alcohol. Lost property is handled at the main information point near Gate A. Smoking is only permitted in designated outdoor areas.',
  },
];
