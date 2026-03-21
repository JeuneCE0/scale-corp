export default function Stripe() {
  return {
    checkout: { sessions: { create: async () => ({ url: 'https://checkout.stripe.com/test', id: 'sess_test' }) } },
    subscriptions: { retrieve: async () => ({ id: 'sub_1', status: 'active', current_period_end: 1700000000, cancel_at_period_end: false, items: { data: [{ id: 'si_1', price: { id: 'price_starter' } }] } }), update: async () => ({}) },
    customers: { create: async () => ({ id: 'cus_test' }) },
    billingPortal: { sessions: { create: async () => ({ url: 'https://billing.stripe.com/test' }) } },
    webhooks: { constructEvent: () => ({}) },
  };
}
