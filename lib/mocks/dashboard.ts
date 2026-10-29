/** UI-only mock data for the dashboard (Phase 5). Not loaded from any API. */

export type MockOrg = {
  id: string;
  name: string;
  workspaceSubtitle: string;
  /** Preset or custom label prefix for spots — never assume "Table" globally. */
  spotLabel: string;
  reviewUrl: string;
};

export type QrSpotStatus = "active" | "draft" | "inactive";

export type MockQrSpot = {
  id: string;
  name: string;
  spotLabel: string;
  spotNumber: number;
  area: string;
  detail: string;
  scans30d: number;
  feedbackCount: number;
  lastScanLabel: string;
  status: QrSpotStatus;
  slug: string;
};

export type MockFeedbackItem = {
  id: string;
  rating: number;
  spotName: string;
  spotLabel: string;
  comment: string;
  timestampLabel: string;
  createdAt: string;
};

export const mockOrganization: MockOrg = {
  id: "org-bloom-birch",
  name: "Bloom & Birch Café",
  workspaceSubtitle: "Café workspace",
  spotLabel: "Table",
  reviewUrl: "https://maps.google.com/example",
};

/** Seed spots use the org's configured spot label where applicable. */
export const mockQrSpots: MockQrSpot[] = [
  {
    id: "t07",
    name: "Table 07",
    spotLabel: "Table",
    spotNumber: 7,
    area: "Dining room",
    detail: "Window side",
    scans30d: 284,
    feedbackCount: 96,
    lastScanLabel: "4 min ago",
    status: "active",
    slug: "07",
  },
  {
    id: "t08",
    name: "Table 08",
    spotLabel: "Table",
    spotNumber: 8,
    area: "Dining room",
    detail: "Center aisle",
    scans30d: 251,
    feedbackCount: 83,
    lastScanLabel: "12 min ago",
    status: "active",
    slug: "08",
  },
  {
    id: "t09",
    name: "Table 09",
    spotLabel: "Table",
    spotNumber: 9,
    area: "Dining room",
    detail: "Near the bar",
    scans30d: 218,
    feedbackCount: 74,
    lastScanLabel: "18 min ago",
    status: "active",
    slug: "09",
  },
  {
    id: "p02",
    name: "Patio 02",
    spotLabel: "Patio",
    spotNumber: 2,
    area: "Patio",
    detail: "Garden side",
    scans30d: 196,
    feedbackCount: 61,
    lastScanLabel: "32 min ago",
    status: "active",
    slug: "patio-02",
  },
  {
    id: "c01",
    name: "Counter 01",
    spotLabel: "Counter",
    spotNumber: 1,
    area: "Counter",
    detail: "Pickup counter",
    scans30d: 173,
    feedbackCount: 57,
    lastScanLabel: "1 hr ago",
    status: "active",
    slug: "counter-01",
  },
  {
    id: "t04",
    name: "Table 04",
    spotLabel: "Table",
    spotNumber: 4,
    area: "Dining room",
    detail: "Main dining",
    scans30d: 166,
    feedbackCount: 54,
    lastScanLabel: "2 hr ago",
    status: "inactive",
    slug: "04",
  },
  {
    id: "pd1",
    name: "Private Dining",
    spotLabel: "Room",
    spotNumber: 1,
    area: "Private dining",
    detail: "Private room",
    scans30d: 122,
    feedbackCount: 42,
    lastScanLabel: "Yesterday",
    status: "active",
    slug: "private-dining",
  },
  {
    id: "p04",
    name: "Patio 04",
    spotLabel: "Patio",
    spotNumber: 4,
    area: "Patio",
    detail: "Outdoor seating",
    scans30d: 98,
    feedbackCount: 31,
    lastScanLabel: "Yesterday",
    status: "draft",
    slug: "patio-04",
  },
  {
    id: "t02",
    name: "Table 02",
    spotLabel: "Table",
    spotNumber: 2,
    area: "Dining room",
    detail: "Main dining",
    scans30d: 90,
    feedbackCount: 28,
    lastScanLabel: "Yesterday",
    status: "active",
    slug: "02",
  },
  {
    id: "t03",
    name: "Table 03",
    spotLabel: "Table",
    spotNumber: 3,
    area: "Dining room",
    detail: "Main dining",
    scans30d: 78,
    feedbackCount: 24,
    lastScanLabel: "2 days ago",
    status: "active",
    slug: "03",
  },
  {
    id: "p01",
    name: "Patio 01",
    spotLabel: "Patio",
    spotNumber: 1,
    area: "Patio",
    detail: "Garden entrance",
    scans30d: 64,
    feedbackCount: 20,
    lastScanLabel: "2 days ago",
    status: "active",
    slug: "patio-01",
  },
  {
    id: "c02",
    name: "Counter 02",
    spotLabel: "Counter",
    spotNumber: 2,
    area: "Counter",
    detail: "Side counter",
    scans30d: 0,
    feedbackCount: 0,
    lastScanLabel: "Never",
    status: "draft",
    slug: "counter-02",
  },
];

export const mockRecentFeedback: MockFeedbackItem[] = [
  {
    id: "fb-1",
    rating: 2,
    spotName: "Table 07",
    spotLabel: "Table",
    comment: "Food arrived cold; waited a long time.",
    timestampLabel: "4 min ago",
    createdAt: "2026-10-29T10:02:00Z",
  },
  {
    id: "fb-2",
    rating: 5,
    spotName: "Patio 02",
    spotLabel: "Patio",
    comment: "Lovely brunch and friendly staff.",
    timestampLabel: "22 min ago",
    createdAt: "2026-10-29T09:44:00Z",
  },
  {
    id: "fb-3",
    rating: 1,
    spotName: "Counter 01",
    spotLabel: "Counter",
    comment: "Order was wrong twice.",
    timestampLabel: "1 hr ago",
    createdAt: "2026-10-29T09:05:00Z",
  },
  {
    id: "fb-4",
    rating: 4,
    spotName: "Table 09",
    spotLabel: "Table",
    comment: "Great espresso, noisy at peak hour.",
    timestampLabel: "2 hr ago",
    createdAt: "2026-10-29T08:10:00Z",
  },
  {
    id: "fb-5",
    rating: 3,
    spotName: "Private Dining",
    spotLabel: "Room",
    comment: "Room was perfect; service felt rushed.",
    timestampLabel: "Yesterday",
    createdAt: "2026-10-28T19:30:00Z",
  },
];

export const QR_AREAS = [
  "Dining room",
  "Patio",
  "Counter",
  "Private dining",
] as const;

export const LOW_RATING_ALERT_COUNT = mockRecentFeedback.filter(
  (f) => f.rating <= 2,
).length;
