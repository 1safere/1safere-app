// Stripe configuration
const STRIPE_CONFIG = {
    publishableKey: 'pk_live_51SF1ItA1rHz05ax8VebO2IuyaoKCuV8TqlTIrgc8pUALn2x2ylbrtAMZpGZAv2mTjPGXfjcepNj6Hz8BkVgZE90S00kTvBMboa', // Replace with your Stripe publishable key
    priceId: 'price_1SF1t1AasCbUOreBV2FtQdyP' // Replace with your Stripe Price ID for $3/month
};

// Initialize Stripe
const stripe = Stripe(STRIPE_CONFIG.publishableKey);

export { stripe, STRIPE_CONFIG };
