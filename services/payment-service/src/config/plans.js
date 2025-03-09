// src/config/plans.js
/**
 * Subscription plan definitions for the Tax Sahi Hai platform
 * Contains pricing, features, and other plan details
 */

export const subscriptionPlans = [
    {
      id: 'basic',
      name: 'BASIC',
      displayName: 'Basic Plan',
      price: 999,
      description: 'Perfect for individuals with simple tax filing needs',
      duration: 365, // days
      features: [
        'Basic ITR filing',
        'Document storage',
        'Email support',
        'Limited AI assistance'
      ],
      documentLimit: 20,
      memberLimit: 1,
      aiQueriesLimit: 10,
      stripeProductId: process.env.STRIPE_BASIC_PRODUCT_ID || 'prod_basic'
    },
    {
      id: 'standard',
      name: 'STANDARD',
      displayName: 'Standard Plan',
      price: 1999,
      description: 'Comprehensive package for individuals with multiple income sources',
      duration: 365, // days
      features: [
        'Advanced ITR filing',
        'Unlimited document storage',
        'Priority email support',
        'Full AI tax assistant',
        'Tax saving recommendations'
      ],
      documentLimit: 50,
      memberLimit: 1,
      aiQueriesLimit: 50,
      stripeProductId: process.env.STRIPE_STANDARD_PRODUCT_ID || 'prod_standard'
    },
    {
      id: 'premium',
      name: 'PREMIUM',
      displayName: 'Premium Plan',
      price: 4999,
      description: 'Complete tax management solution for families or business owners',
      duration: 365, // days
      features: [
        'Complete ITR filing for all categories',
        'Multiple family members support',
        'Unlimited document storage',
        'Priority support with dedicated CA',
        'Advanced AI tax planning',
        'Year-round tax advisory',
        'Audit protection'
      ],
      documentLimit: 200,
      memberLimit: 5,
      aiQueriesLimit: 200,
      stripeProductId: process.env.STRIPE_PREMIUM_PRODUCT_ID || 'prod_premium'
    }
  ];
  
  export default subscriptionPlans;