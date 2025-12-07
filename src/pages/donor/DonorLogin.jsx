import React, { useState } from 'react';
import '../../App.css';
import ThemeSwitcher, { themes } from '../../components/ThemeSwitcher';
import PaydaLogo from '../../components/PaydaLogo';

const DonorLogin = ({ onBack, onLoginSuccess, onGoToRegister }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentTheme, setCurrentTheme] = useState(() => {
        const saved = localStorage.getItem('appTheme') || 'default';
        return themes[saved] || themes.default;
    });

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Timeout ile fetch işlemi (10 saniye)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch('http://localhost:8080/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Response'un başarılı olup olmadığını kontrol et
            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch {
                    errorData = { detail: `Sunucu hatası: ${response.status} ${response.statusText}` };
                }
                setError(errorData.detail || 'Giriş yapılamadı.');
                setLoading(false);
                return;
            }

            const data = await response.json();

            if (data.role === 'donor' || data.role === 'admin') {
                localStorage.setItem("user", JSON.stringify(data));
                onLoginSuccess({ name: data.username || data.name, role: 'donor', id: data.id, balance: data.balance });
            } else {
                setError('Bu hesap Bağışçı rolünde değil.');
                setLoading(false);
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                setError('İstek zaman aşımına uğradı. Backend çalışıyor mu?');
            } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
                setError('Backend\'e bağlanılamadı. Backend\'in http://localhost:8080 adresinde çalıştığından emin olun.');
            } else {
                setError(`Hata: ${err.message || 'Bilinmeyen bir hata oluştu'}`);
            }
            setLoading(false);
        }
    };

    return (
        <div className="login-container" style={{ 
            background: currentTheme.secondary,
            minHeight: '100vh',
            position: 'relative'
        }}>
            <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                zIndex: 1000
            }}>
                <ThemeSwitcher onThemeChange={setCurrentTheme} />
            </div>

            <div className="login-card" style={{
                background: 'white',
                maxWidth: '450px',
                padding: '50px 40px',
                borderRadius: '20px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '-50px',
                    right: '-50px',
                    width: '200px',
                    height: '200px',
                    background: currentTheme.primary,
                    borderRadius: '50%',
                    opacity: 0.1,
                    zIndex: 0
                }}></div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px' }}>
                        <PaydaLogo size={60} showText={true} onClick={onBack} darkBackground={false} />
                    </div>
                    <p className="subtitle" style={{ 
                        marginBottom: '30px',
                        fontSize: '16px',
                        color: '#666'
                    }}>
                        <i className="fas fa-heart" style={{ marginRight: '8px', color: '#e91e63' }}></i>
                        Gönüllü / Bağışçı Girişi
                    </p>

                    <form onSubmit={handleLogin}>
                        <div className="input-group" style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#333'
                            }}>
                                <i className="fas fa-user" style={{ marginRight: '8px', color: currentTheme.accent }}></i>
                                Kullanıcı Adı
                            </label>
                            <input 
                                type="text" 
                                placeholder="Kullanıcı adınızı girin" 
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)} 
                                className="input-field" 
                                required 
                                style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    border: '2px solid #e1e4e8',
                                    borderRadius: '12px',
                                    fontSize: '16px',
                                    outline: 'none',
                                    transition: 'all 0.3s ease',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = currentTheme.accent;
                                    e.target.style.boxShadow = `0 0 0 4px ${currentTheme.accent}20`;
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#e1e4e8';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        <div className="input-group" style={{ marginBottom: '25px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#333'
                            }}>
                                <i className="fas fa-lock" style={{ marginRight: '8px', color: currentTheme.accent }}></i>
                                Şifre
                            </label>
                            <input 
                                type="password" 
                                placeholder="Şifrenizi girin" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                className="input-field" 
                                required 
                                style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    border: '2px solid #e1e4e8',
                                    borderRadius: '12px',
                                    fontSize: '16px',
                                    outline: 'none',
                                    transition: 'all 0.3s ease',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = currentTheme.accent;
                                    e.target.style.boxShadow = `0 0 0 4px ${currentTheme.accent}20`;
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#e1e4e8';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        {error && (
                            <div style={{ 
                                background: '#fee',
                                color: '#c33',
                                padding: '12px 16px',
                                borderRadius: '10px',
                                marginBottom: '20px',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <i className="fas fa-exclamation-circle"></i>
                                {error}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            className="login-btn" 
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '16px',
                                background: loading ? '#ccc' : currentTheme.primary,
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '18px',
                                fontWeight: '700',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: loading ? 'none' : `0 6px 20px ${currentTheme.accent}40`,
                                marginBottom: '20px'
                            }}
                            onMouseEnter={(e) => {
                                if (!loading) {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = `0 8px 24px ${currentTheme.accent}50`;
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!loading) {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = `0 6px 20px ${currentTheme.accent}40`;
                                }
                            }}
                        >
                            {loading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                                    Giriş Yapılıyor...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-sign-in-alt" style={{ marginRight: '8px' }}></i>
                                    Giriş Yap
                                </>
                            )}
                        </button>
                    </form>

                    <div style={{ 
                        marginTop: '25px', 
                        padding: '20px',
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                        borderRadius: '12px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                            <span>Hesabınız yok mu? </span>
                            <a 
                                href="#" 
                                onClick={(e) => { e.preventDefault(); onGoToRegister && onGoToRegister(); }} 
                                style={{ 
                                    color: currentTheme.accent, 
                                    textDecoration: 'none', 
                                    fontWeight: '700',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                            >
                                Kayıt Ol
                            </a>
                        </div>
                        <button 
                            onClick={onBack} 
                            className="back-btn" 
                            style={{ 
                                marginTop: '10px',
                                background: 'transparent',
                                border: 'none',
                                color: '#999',
                                fontSize: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.color = currentTheme.accent}
                            onMouseLeave={(e) => e.target.style.color = '#999'}
                        >
                            <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i>
                            Geri Dön
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DonorLogin;
