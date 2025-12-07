import React, { useState, useEffect } from 'react';
import './App.css';
import ThemeSwitcher, { themes } from './components/ThemeSwitcher';
import PaydaLogo from './components/PaydaLogo';

const RoleSelection = ({ onSelectRole, onAdminVolunteerLogin }) => {
    const [currentTheme, setCurrentTheme] = useState(() => {
        const saved = localStorage.getItem('appTheme') || 'default';
        return themes[saved] || themes.default;
    });
    const [stats, setStats] = useState({ users: 0, donations: 0, merchants: 0 });

    useEffect(() => {
        // Platform istatistiklerini çek
        const fetchStats = async () => {
            try {
                const response = await fetch('http://localhost:8080/database/overview');
                if (response.ok) {
                    const data = await response.json();
                    // Backend'den gelen veri yapısına göre parse et
                    const totalUsers = data.users?.total || 0;
                    const totalDonations = data.donations?.total_amount || 0;
                    const totalMerchants = data.users?.by_role?.merchant || 0;
                    
                    setStats({
                        users: totalUsers,
                        donations: totalDonations,
                        merchants: totalMerchants
                    });
                }
            } catch (error) {
                console.error('İstatistikler çekilemedi:', error);
                // Backend bağlantı hatası durumunda varsayılan değerleri göster
            }
        };
        fetchStats();
        
        // Her 30 saniyede bir istatistikleri güncelle
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="login-container" style={{ 
            background: currentTheme.secondary,
            minHeight: '100vh',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Sol taraftaki dekoratif görseller */}
            <div style={{
                position: 'fixed',
                left: '-100px',
                top: '10%',
                width: '300px',
                height: '300px',
                background: currentTheme.primary,
                borderRadius: '50%',
                opacity: 0.15,
                filter: 'blur(40px)',
                zIndex: 0,
                animation: 'float 6s ease-in-out infinite'
            }}></div>
            <div style={{
                position: 'fixed',
                left: '-50px',
                top: '50%',
                width: '200px',
                height: '200px',
                background: currentTheme.primary,
                borderRadius: '50%',
                opacity: 0.1,
                filter: 'blur(30px)',
                zIndex: 0,
                animation: 'float 8s ease-in-out infinite',
                animationDelay: '1s'
            }}></div>
            <div style={{
                position: 'fixed',
                left: '20px',
                top: '30%',
                fontSize: '120px',
                opacity: 0.08,
                zIndex: 0,
                color: currentTheme.accent,
                transform: 'rotate(-15deg)'
            }}>
                <i className="fas fa-hands-helping"></i>
            </div>
            
            {/* Admin Gönüllü Giriş Butonu - Sol Üst */}
            <div style={{
                position: 'fixed',
                top: '20px',
                left: '20px',
                zIndex: 1000
            }}>
                <button
                    onClick={() => {
                        // Admin gönüllü giriş sayfasına yönlendir
                        if (onAdminVolunteerLogin) {
                            onAdminVolunteerLogin();
                        } else {
                            window.location.href = '/admin-volunteer-login';
                        }
                    }}
                    style={{
                        padding: '12px 20px',
                        background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.3)';
                    }}
                >
                    <i className="fas fa-user-shield"></i>
                    <span>Admin Gönüllü Girişi</span>
                </button>
            </div>
            <div style={{
                position: 'fixed',
                left: '50px',
                bottom: '20%',
                fontSize: '80px',
                opacity: 0.06,
                zIndex: 0,
                color: currentTheme.accent,
                transform: 'rotate(10deg)'
            }}>
                <i className="fas fa-heart"></i>
            </div>

            {/* Sağ taraftaki dekoratif görseller */}
            <div style={{
                position: 'fixed',
                right: '-100px',
                top: '20%',
                width: '300px',
                height: '300px',
                background: currentTheme.primary,
                borderRadius: '50%',
                opacity: 0.15,
                filter: 'blur(40px)',
                zIndex: 0,
                animation: 'float 7s ease-in-out infinite',
                animationDelay: '0.5s'
            }}></div>
            <div style={{
                position: 'fixed',
                right: '-50px',
                bottom: '15%',
                width: '250px',
                height: '250px',
                background: currentTheme.primary,
                borderRadius: '50%',
                opacity: 0.1,
                filter: 'blur(30px)',
                zIndex: 0,
                animation: 'float 9s ease-in-out infinite',
                animationDelay: '1.5s'
            }}></div>
            <div style={{
                position: 'fixed',
                right: '30px',
                top: '25%',
                fontSize: '100px',
                opacity: 0.08,
                zIndex: 0,
                color: currentTheme.accent,
                transform: 'rotate(15deg)'
            }}>
                <i className="fas fa-users"></i>
            </div>
            <div style={{
                position: 'fixed',
                right: '40px',
                bottom: '25%',
                fontSize: '90px',
                opacity: 0.06,
                zIndex: 0,
                color: currentTheme.accent,
                transform: 'rotate(-10deg)'
            }}>
                <i className="fas fa-handshake"></i>
            </div>
            <div style={{
                position: 'fixed',
                right: '60px',
                top: '60%',
                fontSize: '70px',
                opacity: 0.07,
                zIndex: 0,
                color: currentTheme.accent,
                transform: 'rotate(20deg)'
            }}>
                <i className="fas fa-gift"></i>
            </div>

            {/* Dekoratif çizgiler ve şekiller */}
            <div style={{
                position: 'fixed',
                left: '0',
                top: '0',
                width: '2px',
                height: '100%',
                background: `linear-gradient(180deg, transparent 0%, ${currentTheme.accent}30 20%, ${currentTheme.accent}30 80%, transparent 100%)`,
                zIndex: 0
            }}></div>
            <div style={{
                position: 'fixed',
                right: '0',
                top: '0',
                width: '2px',
                height: '100%',
                background: `linear-gradient(180deg, transparent 0%, ${currentTheme.accent}30 20%, ${currentTheme.accent}30 80%, transparent 100%)`,
                zIndex: 0
            }}></div>

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
                maxWidth: '1200px',
                padding: '50px 40px',
                position: 'relative',
                overflow: 'hidden',
                zIndex: 1,
                boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
            }}>
                {/* Dekoratif arka plan elementleri */}
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
                <div style={{
                    position: 'absolute',
                    bottom: '-30px',
                    left: '-30px',
                    width: '150px',
                    height: '150px',
                    background: currentTheme.primary,
                    borderRadius: '50%',
                    opacity: 0.1,
                    zIndex: 0
                }}></div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    {/* Logo ve Başlık */}
                    <div style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px' }}>
                            <PaydaLogo size={80} showText={true} darkBackground={false} />
                        </div>
                        <p className="subtitle" style={{ 
                            fontSize: '18px',
                            color: '#666',
                            marginBottom: '20px'
                        }}>
                            Dayanışmanın Dijital Köprüsü
                        </p>
                        <div style={{
                            width: '80px',
                            height: '4px',
                            background: currentTheme.primary,
                            margin: '0 auto',
                            borderRadius: '2px'
                        }}></div>
                    </div>

                    {/* Platform İstatistikleri */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '30px',
                        marginBottom: '50px',
                        flexWrap: 'wrap'
                    }}>
                        <div style={{
                            textAlign: 'center',
                            padding: '20px',
                            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                            borderRadius: '16px',
                            minWidth: '150px'
                        }}>
                            <div style={{
                                fontSize: '32px',
                                fontWeight: '700',
                                background: currentTheme.primary,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>{stats.users}+</div>
                            <div style={{ color: '#666', fontSize: '14px', marginTop: '5px' }}>Aktif Kullanıcı</div>
                        </div>
                        <div style={{
                            textAlign: 'center',
                            padding: '20px',
                            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                            borderRadius: '16px',
                            minWidth: '150px'
                        }}>
                            <div style={{
                                fontSize: '32px',
                                fontWeight: '700',
                                background: currentTheme.primary,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>
                                {stats.donations > 0 ? `₺${stats.donations.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}` : '₺0'}
                            </div>
                            <div style={{ color: '#666', fontSize: '14px', marginTop: '5px' }}>Toplam Bağış</div>
                        </div>
                        <div style={{
                            textAlign: 'center',
                            padding: '20px',
                            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                            borderRadius: '16px',
                            minWidth: '150px'
                        }}>
                            <div style={{
                                fontSize: '32px',
                                fontWeight: '700',
                                background: currentTheme.primary,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>{stats.merchants}+</div>
                            <div style={{ color: '#666', fontSize: '14px', marginTop: '5px' }}>İşletme</div>
                        </div>
                    </div>

                    {/* Ana Başlık */}
                    <h2 style={{ 
                        fontSize: '24px', 
                        marginBottom: '40px', 
                        color: '#333',
                        fontWeight: '700'
                    }}>
                    Lütfen Giriş Türü Seçiniz:
                </h2>

                    {/* Rol Kartları */}
                    <div className="cards-container" style={{ gap: '25px', marginBottom: '40px' }}>
                    {/* 1. İhtiyaç Sahibi */}
                        <div 
                            className="card" 
                            onClick={() => onSelectRole('user')}
                            style={{
                                background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
                                border: `2px solid ${currentTheme.accent}20`,
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = `0 10px 30px ${currentTheme.accent}30`;
                                e.currentTarget.style.borderColor = currentTheme.accent;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                                e.currentTarget.style.borderColor = `${currentTheme.accent}20`;
                            }}
                        >
                            <div style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                width: '60px',
                                height: '60px',
                                background: `${currentTheme.accent}15`,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '28px'
                            }}>
                                👤
                            </div>
                            <div className="icon" style={{
                                fontSize: '48px',
                                marginBottom: '15px',
                                background: currentTheme.primary,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>👤</div>
                            <h3 style={{ 
                                fontSize: '22px',
                                marginBottom: '10px',
                                color: '#333',
                                fontWeight: '700'
                            }}>İhtiyaç Sahibi</h3>
                            <p style={{ 
                                color: '#666',
                                fontSize: '14px',
                                marginBottom: '15px',
                                lineHeight: '1.6'
                            }}>
                                Destek talebi oluştur ve ihtiyaçlarını paylaş.
                            </p>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                color: currentTheme.accent,
                                fontSize: '12px',
                                fontWeight: '600'
                            }}>
                                <i className="fas fa-arrow-right"></i>
                                <span>Giriş Yap</span>
                            </div>
                        </div>

                        {/* 2. Gönüllü (E-Devlet Onaylı) */}
                        <div 
                            className="card" 
                            onClick={() => onSelectRole('volunteer')}
                            style={{
                                background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
                                border: `2px solid ${currentTheme.accent}20`,
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = `0 10px 30px ${currentTheme.accent}30`;
                                e.currentTarget.style.borderColor = currentTheme.accent;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)';
                                e.currentTarget.style.borderColor = `${currentTheme.accent}20`;
                            }}
                        >
                            <div style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                                color: 'white',
                                padding: '5px 12px',
                                borderRadius: '20px',
                                fontSize: '11px',
                                fontWeight: '600',
                                boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
                            }}>
                                <i className="fas fa-check-circle" style={{ marginRight: '5px' }}></i>
                                E-Devlet Onaylı
                            </div>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                margin: '0 auto 20px',
                                background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '36px',
                                color: 'white',
                                boxShadow: '0 8px 20px rgba(76, 175, 80, 0.3)'
                            }}>
                                <i className="fas fa-hands-helping"></i>
                            </div>
                            <h3 style={{ 
                                fontSize: '22px', 
                                fontWeight: '700', 
                                color: '#333',
                                marginBottom: '10px',
                                textAlign: 'center'
                            }}>Gönüllü Olmak İstiyorum</h3>
                            <p style={{ 
                                color: '#666',
                                fontSize: '14px',
                                marginBottom: '15px',
                                lineHeight: '1.6',
                                textAlign: 'center'
                            }}>
                                E-devlet belgeniz ile gönüllü olun. Admin onayından sonra platformda aktif olacaksınız.
                            </p>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                color: currentTheme.accent,
                                fontSize: '13px',
                                fontWeight: '600'
                            }}>
                                <i className="fas fa-file-check"></i>
                                <span>E-Devlet Belgesi Gerekli</span>
                            </div>
                    </div>

                        {/* 3. Bağışçı */}
                        <div 
                            className="card" 
                            onClick={() => onSelectRole('donor')}
                            style={{
                                background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
                                border: `2px solid ${currentTheme.accent}20`,
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = `0 10px 30px ${currentTheme.accent}30`;
                                e.currentTarget.style.borderColor = currentTheme.accent;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                                e.currentTarget.style.borderColor = `${currentTheme.accent}20`;
                            }}
                        >
                            <div style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                width: '60px',
                                height: '60px',
                                background: `${currentTheme.accent}15`,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '28px'
                            }}>
                                ❤️
                            </div>
                            <div className="icon" style={{
                                fontSize: '48px',
                                marginBottom: '15px'
                            }}>❤️</div>
                            <h3 style={{ 
                                fontSize: '22px',
                                marginBottom: '10px',
                                color: '#333',
                                fontWeight: '700'
                            }}>Gönüllü / Bağışçı</h3>
                            <p style={{ 
                                color: '#666',
                                fontSize: '14px',
                                marginBottom: '15px',
                                lineHeight: '1.6'
                            }}>
                                Destek vermek için giriş yap ve ihtiyaç sahiplerine yardım et.
                            </p>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                color: currentTheme.accent,
                                fontSize: '12px',
                                fontWeight: '600'
                            }}>
                                <i className="fas fa-arrow-right"></i>
                                <span>Giriş Yap</span>
                            </div>
                    </div>

                    {/* 3. Şirket */}
                        <div 
                            className="card" 
                            onClick={() => onSelectRole('seller')}
                            style={{
                                background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
                                border: `2px solid ${currentTheme.accent}20`,
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = `0 10px 30px ${currentTheme.accent}30`;
                                e.currentTarget.style.borderColor = currentTheme.accent;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                                e.currentTarget.style.borderColor = `${currentTheme.accent}20`;
                            }}
                        >
                            <div style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                width: '60px',
                                height: '60px',
                                background: `${currentTheme.accent}15`,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '28px'
                            }}>
                                🏢
                            </div>
                            <div className="icon" style={{
                                fontSize: '48px',
                                marginBottom: '15px'
                            }}>🏢</div>
                            <h3 style={{ 
                                fontSize: '22px',
                                marginBottom: '10px',
                                color: '#333',
                                fontWeight: '700'
                            }}>Şirket</h3>
                            <p style={{ 
                                color: '#666',
                                fontSize: '14px',
                                marginBottom: '15px',
                                lineHeight: '1.6'
                            }}>
                                İyilik vitrinine katıl ve sosyal sorumluluğunu yerine getir.
                            </p>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                color: currentTheme.accent,
                                fontSize: '12px',
                                fontWeight: '600'
                            }}>
                                <i className="fas fa-arrow-right"></i>
                                <span>Giriş Yap</span>
                            </div>
                        </div>
                    </div>

                    {/* Nasıl Çalışır Bölümü */}
                    <div style={{
                        marginTop: '60px',
                        padding: '40px',
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
                        borderRadius: '20px',
                        border: `2px solid ${currentTheme.accent}15`
                    }}>
                        <h3 style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: '#333',
                            textAlign: 'center',
                            marginBottom: '30px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px'
                        }}>
                            <i className="fas fa-question-circle" style={{ color: currentTheme.accent }}></i>
                            PAYDA Nasıl Çalışır?
                        </h3>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '25px',
                            marginTop: '30px'
                        }}>
                            <div style={{
                                background: 'white',
                                padding: '25px',
                                borderRadius: '16px',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                                textAlign: 'center',
                                transition: 'transform 0.3s ease',
                                border: `1px solid ${currentTheme.accent}10`
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    margin: '0 auto 15px',
                                    background: currentTheme.primary,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '28px',
                                    color: 'white'
                                }}>
                                    <i className="fas fa-user-plus"></i>
                                </div>
                                <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#333', marginBottom: '10px' }}>
                                    1. Kayıt Ol
                                </h4>
                                <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
                                    Rolünüze uygun hesap oluşturun ve platforma katılın
                                </p>
                            </div>
                            <div style={{
                                background: 'white',
                                padding: '25px',
                                borderRadius: '16px',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                                textAlign: 'center',
                                transition: 'transform 0.3s ease',
                                border: `1px solid ${currentTheme.accent}10`
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    margin: '0 auto 15px',
                                    background: currentTheme.primary,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '28px',
                                    color: 'white'
                                }}>
                                    <i className="fas fa-hand-holding-heart"></i>
                                </div>
                                <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#333', marginBottom: '10px' }}>
                                    2. Bağış Yap / Talep Oluştur
                                </h4>
                                <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
                                    İhtiyaç sahipleri destek talebi oluşturur, bağışçılar destek verir
                                </p>
                            </div>
                            <div style={{
                                background: 'white',
                                padding: '25px',
                                borderRadius: '16px',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                                textAlign: 'center',
                                transition: 'transform 0.3s ease',
                                border: `1px solid ${currentTheme.accent}10`
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    margin: '0 auto 15px',
                                    background: currentTheme.primary,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '28px',
                                    color: 'white'
                                }}>
                                    <i className="fas fa-gift"></i>
                                </div>
                                <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#333', marginBottom: '10px' }}>
                                    3. Kupon Kullan
                                </h4>
                                <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
                                    İşletmelerden kupon alın ve ihtiyaçlarınızı karşılayın
                                </p>
                            </div>
                            <div style={{
                                background: 'white',
                                padding: '25px',
                                borderRadius: '16px',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                                textAlign: 'center',
                                transition: 'transform 0.3s ease',
                                border: `1px solid ${currentTheme.accent}10`
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    margin: '0 auto 15px',
                                    background: currentTheme.primary,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '28px',
                                    color: 'white'
                                }}>
                                    <i className="fas fa-check-circle"></i>
                                </div>
                                <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#333', marginBottom: '10px' }}>
                                    4. Dayanışma Büyüsün
                                </h4>
                                <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
                                    Toplumsal dayanışma ağı genişler, herkes kazanır
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Platform Özellikleri */}
                    <div style={{
                        marginTop: '50px',
                        padding: '40px',
                        background: 'white',
                        borderRadius: '20px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                        border: `2px solid ${currentTheme.accent}10`
                    }}>
                        <h3 style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: '#333',
                            textAlign: 'center',
                            marginBottom: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px'
                        }}>
                            <i className="fas fa-star" style={{ color: currentTheme.accent }}></i>
                            Platform Özellikleri
                        </h3>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '25px'
                        }}>
                            <div style={{
                                textAlign: 'center',
                                padding: '20px',
                                background: `linear-gradient(135deg, ${currentTheme.accent}10 0%, ${currentTheme.accent}05 100%)`,
                                borderRadius: '16px',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = `linear-gradient(135deg, ${currentTheme.accent}20 0%, ${currentTheme.accent}10 100%)`;
                                e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = `linear-gradient(135deg, ${currentTheme.accent}10 0%, ${currentTheme.accent}05 100%)`;
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                            >
                                <div style={{
                                    fontSize: '36px',
                                    marginBottom: '12px',
                                    color: currentTheme.accent
                                }}>
                                    <i className="fas fa-shield-alt"></i>
                                </div>
                                <div style={{ fontSize: '16px', color: '#333', fontWeight: '700', marginBottom: '8px' }}>
                                    Güvenli Platform
                                </div>
                                <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.5' }}>
                                    Verileriniz SSL ile korunur ve gizliliğiniz önceliklidir
                                </div>
                            </div>
                            <div style={{
                                textAlign: 'center',
                                padding: '20px',
                                background: `linear-gradient(135deg, ${currentTheme.accent}10 0%, ${currentTheme.accent}05 100%)`,
                                borderRadius: '16px',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = `linear-gradient(135deg, ${currentTheme.accent}20 0%, ${currentTheme.accent}10 100%)`;
                                e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = `linear-gradient(135deg, ${currentTheme.accent}10 0%, ${currentTheme.accent}05 100%)`;
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                            >
                                <div style={{
                                    fontSize: '36px',
                                    marginBottom: '12px',
                                    color: currentTheme.accent
                                }}>
                                    <i className="fas fa-chart-line"></i>
                                </div>
                                <div style={{ fontSize: '16px', color: '#333', fontWeight: '700', marginBottom: '8px' }}>
                                    Şeffaf Sistem
                                </div>
                                <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.5' }}>
                                    Tüm işlemler blockchain benzeri takip sistemi ile izlenir
                                </div>
                            </div>
                            <div style={{
                                textAlign: 'center',
                                padding: '20px',
                                background: `linear-gradient(135deg, ${currentTheme.accent}10 0%, ${currentTheme.accent}05 100%)`,
                                borderRadius: '16px',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = `linear-gradient(135deg, ${currentTheme.accent}20 0%, ${currentTheme.accent}10 100%)`;
                                e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = `linear-gradient(135deg, ${currentTheme.accent}10 0%, ${currentTheme.accent}05 100%)`;
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                            >
                                <div style={{
                                    fontSize: '36px',
                                    marginBottom: '12px',
                                    color: currentTheme.accent
                                }}>
                                    <i className="fas fa-users"></i>
                                </div>
                                <div style={{ fontSize: '16px', color: '#333', fontWeight: '700', marginBottom: '8px' }}>
                                    Toplumsal Dayanışma
                                </div>
                                <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.5' }}>
                                    Birlikte güçlüyüz, dayanışma ağımız her geçen gün büyüyor
                                </div>
                            </div>
                            <div style={{
                                textAlign: 'center',
                                padding: '20px',
                                background: `linear-gradient(135deg, ${currentTheme.accent}10 0%, ${currentTheme.accent}05 100%)`,
                                borderRadius: '16px',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = `linear-gradient(135deg, ${currentTheme.accent}20 0%, ${currentTheme.accent}10 100%)`;
                                e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = `linear-gradient(135deg, ${currentTheme.accent}10 0%, ${currentTheme.accent}05 100%)`;
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                            >
                                <div style={{
                                    fontSize: '36px',
                                    marginBottom: '12px',
                                    color: currentTheme.accent
                                }}>
                                    <i className="fas fa-mobile-alt"></i>
                                </div>
                                <div style={{ fontSize: '16px', color: '#333', fontWeight: '700', marginBottom: '8px' }}>
                                    Kolay Kullanım
                                </div>
                                <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.5' }}>
                                    Modern ve kullanıcı dostu arayüz ile herkes kolayca kullanabilir
                                </div>
                            </div>
                            <div style={{
                                textAlign: 'center',
                                padding: '20px',
                                background: `linear-gradient(135deg, ${currentTheme.accent}10 0%, ${currentTheme.accent}05 100%)`,
                                borderRadius: '16px',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = `linear-gradient(135deg, ${currentTheme.accent}20 0%, ${currentTheme.accent}10 100%)`;
                                e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = `linear-gradient(135deg, ${currentTheme.accent}10 0%, ${currentTheme.accent}05 100%)`;
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                            >
                                <div style={{
                                    fontSize: '36px',
                                    marginBottom: '12px',
                                    color: currentTheme.accent
                                }}>
                                    <i className="fas fa-store"></i>
                                </div>
                                <div style={{ fontSize: '16px', color: '#333', fontWeight: '700', marginBottom: '8px' }}>
                                    İşletme Desteği
                                </div>
                                <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.5' }}>
                                    İşletmeler sosyal sorumluluklarını yerine getirirken tanınır
                                </div>
                            </div>
                            <div style={{
                                textAlign: 'center',
                                padding: '20px',
                                background: `linear-gradient(135deg, ${currentTheme.accent}10 0%, ${currentTheme.accent}05 100%)`,
                                borderRadius: '16px',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = `linear-gradient(135deg, ${currentTheme.accent}20 0%, ${currentTheme.accent}10 100%)`;
                                e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = `linear-gradient(135deg, ${currentTheme.accent}10 0%, ${currentTheme.accent}05 100%)`;
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                            >
                                <div style={{
                                    fontSize: '36px',
                                    marginBottom: '12px',
                                    color: currentTheme.accent
                                }}>
                                    <i className="fas fa-handshake"></i>
                                </div>
                                <div style={{ fontSize: '16px', color: '#333', fontWeight: '700', marginBottom: '8px' }}>
                                    E-Devlet Entegrasyonu
                                </div>
                                <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.5' }}>
                                    İhtiyaç durumu e-devlet belgeleri ile doğrulanır
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Alt Bilgi Bölümü */}
                    <div style={{
                        marginTop: '50px',
                        padding: '30px',
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                        borderRadius: '16px',
                        border: `1px solid ${currentTheme.accent}20`
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-around',
                            flexWrap: 'wrap',
                            gap: '30px',
                            textAlign: 'center'
                        }}>
                            <div>
                                <div style={{
                                    fontSize: '24px',
                                    marginBottom: '8px',
                                    color: currentTheme.accent
                                }}>
                                    <i className="fas fa-shield-alt"></i>
                                </div>
                                <div style={{ fontSize: '14px', color: '#666', fontWeight: '600' }}>
                                    Güvenli Platform
                                </div>
                                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                                    Verileriniz korunur
                                </div>
                            </div>
                            <div>
                                <div style={{
                                    fontSize: '24px',
                                    marginBottom: '8px',
                                    color: currentTheme.accent
                                }}>
                                    <i className="fas fa-heart"></i>
                                </div>
                                <div style={{ fontSize: '14px', color: '#666', fontWeight: '600' }}>
                                    Şeffaf Sistem
                                </div>
                                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                                    Tüm işlemler takip edilir
                                </div>
                            </div>
                            <div>
                                <div style={{
                                    fontSize: '24px',
                                    marginBottom: '8px',
                                    color: currentTheme.accent
                                }}>
                                    <i className="fas fa-users"></i>
                                </div>
                                <div style={{ fontSize: '14px', color: '#666', fontWeight: '600' }}>
                                    Toplumsal Dayanışma
                                </div>
                                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                                    Birlikte güçlüyüz
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Çağrı Bölümü */}
                    <div style={{
                        marginTop: '50px',
                        padding: '40px',
                        background: currentTheme.primary,
                        borderRadius: '20px',
                        textAlign: 'center',
                        color: 'white',
                        boxShadow: `0 10px 40px ${currentTheme.accent}40`
                    }}>
                        <div style={{
                            fontSize: '48px',
                            marginBottom: '20px'
                        }}>
                            <i className="fas fa-hands-helping"></i>
                        </div>
                        <h3 style={{
                            fontSize: '28px',
                            fontWeight: '700',
                            marginBottom: '15px',
                            color: 'white'
                        }}>
                            Hemen Katıl, Dayanışmayı Büyüt!
                        </h3>
                        <p style={{
                            fontSize: '16px',
                            marginBottom: '25px',
                            opacity: 0.95,
                            lineHeight: '1.6',
                            maxWidth: '600px',
                            margin: '0 auto 25px'
                        }}>
                            PAYDA platformu ile ihtiyaç sahiplerine destek olun, işletmelerle işbirliği yapın ve toplumsal dayanışmayı güçlendirin. Her bağış, her kupon, her işbirliği daha güçlü bir toplum demektir.
                        </p>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '15px',
                            flexWrap: 'wrap'
                        }}>
                            <div style={{
                                background: 'rgba(255,255,255,0.2)',
                                padding: '12px 24px',
                                borderRadius: '25px',
                                fontSize: '14px',
                                fontWeight: '600',
                                backdropFilter: 'blur(10px)'
                            }}>
                                <i className="fas fa-check-circle" style={{ marginRight: '8px' }}></i>
                                100% Güvenli
                            </div>
                            <div style={{
                                background: 'rgba(255,255,255,0.2)',
                                padding: '12px 24px',
                                borderRadius: '25px',
                                fontSize: '14px',
                                fontWeight: '600',
                                backdropFilter: 'blur(10px)'
                            }}>
                                <i className="fas fa-check-circle" style={{ marginRight: '8px' }}></i>
                                Ücretsiz Kullanım
                            </div>
                            <div style={{
                                background: 'rgba(255,255,255,0.2)',
                                padding: '12px 24px',
                                borderRadius: '25px',
                                fontSize: '14px',
                                fontWeight: '600',
                                backdropFilter: 'blur(10px)'
                            }}>
                                <i className="fas fa-check-circle" style={{ marginRight: '8px' }}></i>
                                Anında Başla
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoleSelection;