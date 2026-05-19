/** Map Stripe subscription status to internal Subscription.status values. */
export function mapStripeSubscriptionStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'active'
    case 'past_due':
      return 'past_due'
    case 'unpaid':
      return 'unpaid'
    case 'canceled':
    case 'incomplete_expired':
      return 'canceled'
    default:
      return stripeStatus
  }
}
