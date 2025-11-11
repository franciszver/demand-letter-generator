import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-steno-gray-50">
      <nav className="bg-white shadow-sm border-b border-steno-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="text-steno-teal hover:text-steno-teal-dark font-medium transition-colors">
              ← Back to Home
            </Link>
            <h1 className="text-xl font-heading font-bold text-steno-navy">Privacy Policy</h1>
            <div></div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-steno-gray-300 p-8">
          <h1 className="text-3xl font-heading font-bold text-steno-navy mb-6">Privacy Policy</h1>
          <p className="text-steno-charcoal-light mb-4">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose max-w-none space-y-6 text-steno-charcoal">
            <section>
              <h2 className="text-2xl font-heading font-semibold text-steno-navy mb-3">1. Information We Collect</h2>
              <p>
                Steno Draft collects information necessary to provide our AI-powered demand letter generation service:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Account information (name, email address, password)</li>
                <li>Case documents you upload (PDFs, Word documents, images)</li>
                <li>Generated letter drafts and templates</li>
                <li>Usage analytics (letter generation, refinement, export activities)</li>
                <li>System logs and error reports</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold text-steno-navy mb-3">2. How We Use Your Information</h2>
              <p>We use your information to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide and improve our AI-powered letter generation services</li>
                <li>Process and analyze case documents using AI technology</li>
                <li>Generate and refine demand letters based on your instructions</li>
                <li>Enable real-time collaboration features</li>
                <li>Analyze usage patterns to improve our service</li>
                <li>Ensure system security and prevent fraud</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold text-steno-navy mb-3">3. Data Storage and Security</h2>
              <p>
                Your data is stored securely using industry-standard encryption and security measures:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Documents and letter drafts are stored in secure cloud storage (AWS S3)</li>
                <li>Database information is encrypted at rest</li>
                <li>All data transmissions use HTTPS encryption</li>
                <li>Access is restricted to authorized personnel only</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold text-steno-navy mb-3">4. AI Processing</h2>
              <p>
                Case documents and letter content are processed using third-party AI services (OpenRouter/GPT-4o).
                This processing is necessary to provide our core functionality. We do not use your data to train
                AI models or share it with third parties for marketing purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold text-steno-navy mb-3">5. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal data (via data export feature)</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your account and data</li>
                <li>Opt out of non-essential data collection</li>
                <li>Export your data in a machine-readable format</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold text-steno-navy mb-3">6. Data Retention</h2>
              <p>
                We retain your data for as long as your account is active or as needed to provide our services.
                You can request deletion of your account and associated data at any time. Deleted data is
                permanently removed from our systems within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-heading font-semibold text-steno-navy mb-3">7. Contact Us</h2>
              <p>
                If you have questions about this privacy policy or wish to exercise your rights, please contact
                your system administrator or Steno Draft support.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-steno-gray-200">
            <Link
              to="/"
              className="px-4 py-2 bg-steno-navy text-white rounded-lg hover:bg-steno-navy-dark font-medium transition-colors inline-block"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;

