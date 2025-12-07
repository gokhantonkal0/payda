import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</h1>
          <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>Bir Hata Oluştu</h2>
          <p style={{ marginBottom: '20px', opacity: 0.9 }}>
            Sayfa yüklenirken bir sorun oluştu. Lütfen sayfayı yenileyin.
          </p>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              background: 'rgba(255,255,255,0.2)',
              border: '2px solid white',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
          >
            Sayfayı Yenile
          </button>
          <details style={{ marginTop: '20px', textAlign: 'left', maxWidth: '600px' }}>
            <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>Hata Detayları</summary>
            <pre style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '15px',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {this.state.error?.toString()}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;





