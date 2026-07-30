import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Brain, Search, ImageIcon, Shield, ArrowRight, Zap, Globe, Lock } from 'lucide-react';

const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // If already logged in, redirect to chat
  if (isAuthenticated) {
    return <Navigate to="/chat" replace />;
  }

  return (
    <div className="landing-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', color: 'var(--text-primary)', overflowX: 'hidden' }}>
      
      {/* Navigation */}
      <nav style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 100, 
        background: 'rgba(33, 33, 33, 0.9)', 
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 40px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <span style={{ fontSize: 28 }}>🤖</span>
            <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px' }}>KymiraAI</span>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Link to="/auth" style={{ textDecoration: 'none', color: 'var(--text-primary)', padding: '10px 20px', fontWeight: 600 }}>Login</Link>
            <Link to="/auth?mode=register" style={{ textDecoration: 'none', background: '#ececec', color: 'black', padding: '10px 24px', borderRadius: 6, fontWeight: 600 }}>Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', textAlign: 'center', position: 'relative' }}>
        
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: 'var(--bg-elevated)', borderRadius: 100, border: '1px solid var(--border)', marginBottom: 32, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
          <Zap size={14} /> Meet the next generation of AI
        </div>
        
        <h1 style={{ fontSize: 'clamp(40px, 8vw, 72px)', fontWeight: 700, lineHeight: 1.1, marginBottom: 24, maxWidth: 900, letterSpacing: '-1px' }}>
          Intelligence that <br/>
          <span>adapts to your universe.</span>
        </h1>
        
        <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: 'var(--text-desc)', maxWidth: 650, lineHeight: 1.6, marginBottom: 48 }}>
          KymiraAI combines deep persistent memory, live web search, and stunning image generation into one seamless workspace.
        </p>

        <div style={{ display: 'flex', gap: 20, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/auth?mode=register" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', background: '#ececec', color: 'black', padding: '16px 32px', borderRadius: 6, fontWeight: 600, fontSize: 16, transition: 'transform 0.2s' }}>
            Start Exploring <ArrowRight size={18} />
          </Link>
          <a href="#features" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '16px 32px', borderRadius: 6, fontWeight: 600, fontSize: 16, transition: 'background 0.2s' }}>
            Learn More
          </a>
        </div>
      </main>

      {/* Features Grid */}
      <section id="features" style={{ scrollMarginTop: '80px', padding: '100px 20px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>Limitless Capabilities</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 18, maxWidth: 600, margin: '0 auto' }}>Everything you need to accelerate your workflow and creativity.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {[
              { icon: <Brain size={24} color="#a78bfa" />, title: 'Persistent Memory', desc: 'Kymira remembers your past conversations, code snippets, and preferences across all your sessions.' },
              { icon: <Globe size={24} color="#60a5fa" />, title: 'Live Web Search', desc: 'Need real-time data? Kymira searches the web instantly to provide up-to-date and accurate answers.' },
              { icon: <ImageIcon size={24} color="#34d399" />, title: 'Image Generation', desc: 'Turn text into stunning artwork instantly using our integrated AI image generation models.' },
              { icon: <Shield size={24} color="#f472b6" />, title: 'Enterprise Security', desc: 'Your data is secured with industry-leading encryption, 2FA support, and complete privacy controls.' }
            ].map((feature, i) => (
              <div key={i} style={{ padding: 32, background: 'rgba(255,255,255,0.02)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 16, transition: 'transform 0.2s', cursor: 'default' }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700 }}>{feature.title}</h3>
                <p style={{ color: 'var(--text-desc)', lineHeight: 1.6 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 20px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 20, fontSize: 14 }}>
          <Link to="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms of Service</Link>
          <Link to="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy Policy</Link>
          <a href="mailto:hello@isharankumar.com" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Contact</a>
        </div>
        <p style={{ fontSize: 13 }}>&copy; {new Date().getFullYear()} KymiraAI. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
