export const mockKPIData = {
  todaysOrders: {
    value: 247,
    change: 12.5,
    sparkline: [180, 195, 210, 225, 235, 247],
  },
  conversionRate: {
    value: 68.4,
    change: 3.2,
    trend: 'up' as const,
  },
  upsellRevenue: {
    value: 45200,
    percentage: 18.5,
    change: 8.3,
  },
  couponUsage: {
    redeemed: 89,
    topCoupon: 'SUMMER20',
    savings: 12400,
  },
  aov: {
    value: 1847,
    benchmark: 1620,
    change: 14.0,
  },
};

export const liveCheckoutData = {
  currentShoppers: 27,
  recentIncrease: 3,
  atPayment: 2,
  interactingWithUpsells: 7,
  lastUpdate: new Date(),
};

export const predictionData = {
  predictedOrders: 142,
  predictedOrdersChange: 12,
  predictedRevenue: 1800000,
  predictedUpsellIncrease: [6, 9] as [number, number],
};

export const heatPulseEvents = [
  { type: 'opened' as const, timestamp: Date.now() - 2000, id: '1' },
  { type: 'interacting' as const, timestamp: Date.now() - 5000, id: '2' },
  { type: 'upsell' as const, timestamp: Date.now() - 8000, id: '3' },
  { type: 'completed' as const, timestamp: Date.now() - 12000, id: '4' },
  { type: 'opened' as const, timestamp: Date.now() - 15000, id: '5' },
];

export const networkInsights = [
  {
    type: 'benchmark' as const,
    text: 'Your conversion rate is 19% above similar stores',
    icon: 'trendingUp',
  },
  {
    type: 'related' as const,
    text: 'Your customers also browse Store X & Y',
    icon: 'users',
  },
  {
    type: 'trending' as const,
    text: 'Top upsells in your category: Accessories, Bundles, Care Plans',
    icon: 'star',
  },
];

export const futureModules = [
  {
    id: 'checkout-builder',
    title: 'Checkout Builder',
    description: 'Customize your checkout experience',
    icon: 'wand',
    comingSoon: true,
  },
  {
    id: 'coupons-engine',
    title: 'Coupons Engine',
    description: 'Create conditions, freebies, flash rewards',
    icon: 'ticket',
    comingSoon: true,
  },
  {
    id: 'orders-management',
    title: 'Orders Management',
    description: 'Manage all Flowcart-powered orders',
    icon: 'clipboard',
  },
  {
    id: 'customer-analytics',
    title: 'Customer + Analytics',
    description: 'Repeat customers, insights, cohorts',
    icon: 'userCircle',
    comingSoon: true,
  },
];
