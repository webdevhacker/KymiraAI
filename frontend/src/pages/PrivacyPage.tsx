import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPage: React.FC = () => (
  <div style={{ padding: 40, maxWidth: 800, margin: '0 auto', color: 'var(--text-primary)', lineHeight: 1.6, height: '100dvh', overflowY: 'auto' }}>
    <Link to="/" style={{ color: 'var(--primary-light)', textDecoration: 'none', marginBottom: 20, display: 'inline-block' }}>← Back</Link>
    <h1>Privacy Policy</h1>
    <p>Last updated: July 2026</p>
    
    <section style={{ marginTop: 30 }}>
      <h2>1. Introduction</h2>
      <p>This Privacy Policy is published in compliance with the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 under the Information Technology Act, 2000 of India.</p>
    </section>

    <section style={{ marginTop: 30 }}>
      <h2>2. Information We Collect</h2>
      <p>We collect personal information that you provide to us, including your name, email address, and conversation data. We process this data lawfully and fairly to provide our AI services.</p>
    </section>

    <section style={{ marginTop: 30 }}>
      <h2>3. Use of Information</h2>
      <p>Your data is used to provide, maintain, and improve KymiraAI. By using our service, you consent to your conversation data being processed to improve our AI models, unless you explicitly opt out in your settings.</p>
    </section>

    <section style={{ marginTop: 30 }}>
      <h2>4. Data Security</h2>
      <p>We implement reasonable security practices and procedures as mandated by Indian law to protect your sensitive personal data from unauthorized access, disclosure, or destruction. We utilize Two-Factor Authentication and JWT rotation.</p>
    </section>

    <section style={{ marginTop: 30 }}>
      <h2>5. Disclosure of Information</h2>
      <p>We do not sell your personal data. We may disclose your data if required by law or to authorized government agencies as mandated under the IT Act, 2000.</p>
    </section>

    <section style={{ marginTop: 30 }}>
      <h2>6. Grievance Officer</h2>
      <p>In accordance with the Information Technology Act, 2000 and the rules made thereunder, for any grievances or concerns regarding your privacy or data, please contact our Grievance Officer at: <strong>hello@isharankumar.com</strong>.</p>
    </section>
  </div>
);

export default PrivacyPage;
