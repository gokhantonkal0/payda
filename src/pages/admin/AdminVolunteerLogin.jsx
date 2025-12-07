import React, { useState } from 'react';
import '../../App.css';
import ThemeSwitcher, { themes } from '../../components/ThemeSwitcher';
import PaydaLogo from '../../components/PaydaLogo';

const AdminVolunteerLogin = ({ onBack, onLoginSuccess }) => {
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

            const response = await fetch('http://localhost:8080/admin-volunteer-login', {
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

            localStorage.setItem("user", JSON.stringify(data));
            onLoginSuccess({ 
                name: data.username || data.name, 
                role: 'volunteer', 
                id: data.id, 
                balance: data.balance,
                is_admin_volunteer: true
            });
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div className="login-card" style={{
                background: 'white',
                borderRadius: '20px',
                padding: '40px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                maxWidth: '450px',
                width: '100%'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                    <PaydaLogo size={60} showText={true} onClick={onBack} darkBackground={false} />
                </div>
                <h2 style={{ 
                    textAlign: 'center', 
                    color: currentTheme.primary,
                    marginBottom: '10px',
                    fontSize: '24px',
                    fontWeight: '700'
                }}>
                    Admin Gönüllü Girişi
                </h2>
                <p style={{ 
                    textAlign: 'center', 
                    color: '#666', 
                    marginBottom: '30px',
                    fontSize: '14px'
                }}>
                    SGK döküm evraklarını onaylamak için giriş yapın
                </p>

                {error && (
                    <div style={{
                        background: '#ffebee',
                        color: '#c62828',
                        padding: '15px',
                        borderRadius: '10px',
                        marginBottom: '20px',
                        border: '1px solid #ef5350',
                        fontSize: '14px'
                    }}>
                        <i className="fas fa-exclamation-circle"></i> {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="input-group" style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            color: '#333',
                            fontWeight: '600'
                        }}>
                            <i className="fas fa-user"></i> Kullanıcı Adı
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Kullanıcı adınızı girin"
                            required
                            className="input-field"
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: `2px solid ${currentTheme.primary}`,
                                borderRadius: '10px',
                                fontSize: '16px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div className="input-group" style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            color: '#333',
                            fontWeight: '600'
                        }}>
                            <i className="fas fa-lock"></i> Şifre
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Şifrenizi girin"
                            required
                            className="input-field"
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: `2px solid ${currentTheme.primary}`,
                                borderRadius: '10px',
                                fontSize: '16px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="login-btn"
                        style={{
                            width: '100%',
                            padding: '15px',
                            background: loading ? '#ccc' : `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.secondary} 100%)`,
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
                    <button 
                        onClick={onBack} 
                        className="back-btn" 
                        style={{ 
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
    );
};

export default AdminVolunteerLogin;


