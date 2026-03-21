export default function Legal() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-24">
      <h1 className="text-5xl font-serif mb-12 text-brand-ink">Legal Information</h1>
      
      <section className="mb-16">
        <h2 className="text-2xl font-serif mb-6 text-brand-ink">Terms of Service</h2>
        <div className="prose prose-stone text-gray-600 font-sans font-light leading-relaxed">
          <p>Welcome to Exciting Maldives B2B Portal. By accessing this website, you agree to be bound by these terms and conditions.</p>
          <p>Our services are exclusively for travel professionals and registered agents. All information provided, including rates and availability, is confidential and intended for business use only.</p>
          <h3 className="text-brand-ink font-serif">1. Registration</h3>
          <p>Agents must provide accurate business information during registration. Accounts are subject to approval by our sales team.</p>
          <h3 className="text-brand-ink font-serif">2. Bookings</h3>
          <p>Requests made through this portal are subject to confirmation. Final rates and availability will be confirmed via official invoice.</p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-serif mb-6 text-brand-ink">Privacy Policy</h2>
        <div className="prose prose-stone text-gray-600 font-sans font-light leading-relaxed">
          <p>We take your privacy seriously. This policy describes how we collect and use your personal and business data.</p>
          <p>We collect information necessary for account management and booking processing. We do not share your data with third parties except for the purpose of fulfilling your travel requests.</p>
        </div>
      </section>
    </div>
  );
}
