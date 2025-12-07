import React from 'react';
import './App.css';

const Dashboard = ({ user, onLogout }) => {
    const { role, name } = user;

    // ROL'e göre Başlık Ayarlama
    const getRoleTitle = () => {
        if (role === 'student') return 'Kullanıcı Paneli';
        if (role === 'donor') return 'Gönüllü Paneli';
        if (role === 'business') return 'İşletme Paneli';
        return 'Panel';
    };

    return (
        <div className="dashboard-layout">
            {/* SIDEBAR */}
            <nav className="sidebar">
                <div className="brand">
                    <i className="fas fa-hands-helping" style={{ fontSize: '32px', color: 'var(--soft-pink)' }}></i>
                    <span>PAYDA</span>
                </div>

                <div className="menu-items">
                    <div className="menu-item active">
                        <i className="fas fa-home"></i> <span>Ana Sayfa</span>
                    </div>

                    {/* Rol Bazlı Menü */}
                    {role === 'student' && (
                        <div className="menu-item"><i className="fas fa-bullhorn"></i> <span>Destek İste</span></div>
                    )}
                    {role === 'business' && (
                        <div className="menu-item"><i className="fas fa-plus-circle"></i> <span>Ürün Ekle</span></div>
                    )}

                    <div className="menu-item"><i className="fas fa-cog"></i> <span>Ayarlar</span></div>

                    <div style={{ marginTop: 'auto' }}></div>
                    <div className="menu-item logout-btn" onClick={onLogout}>
                        <i className="fas fa-sign-out-alt"></i> <span>Çıkış Yap</span>
                    </div>
                </div>
            </nav>

            {/* SAĞ İÇERİK */}
            <main className="main-content">
                <header>
                    <div>
                        <h2 style={{ fontWeight: '700' }}>Hoş Geldin, {name} 👋</h2>
                        <p style={{ color: 'var(--navy-light)' }}>{getRoleTitle()}desin. İyilik dolu bir gün olsun.</p>
                    </div>
                    <div className="user-profile-icon">
                        {name.charAt(0).toUpperCase()}
                    </div>
                </header>

                {/* İÇERİK DEĞİŞİM ALANI */}
                <section>

                    {/* ÖĞRENCİ GÖRÜNÜMÜ */}
                    {role === 'student' && (
                        <>
                            <div className="section-title">🎓 Senin İçin Önerilenler</div>
                            <div className="product-grid">
                                <div className="product-card">
                                    <h4>Erzak Paketi İste</h4>
                                    <p>İhtiyaç durumuna göre başvuru yap.</p>
                                    <button className="card-btn">Talep Oluştur</button>
                                </div>
                                <div className="product-card">
                                    <h4>Kitap Desteği</h4>
                                    <p>Ders kitapların için destek bul.</p>
                                    <button className="card-btn">İncele</button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* BAĞIŞÇI GÖRÜNÜMÜ */}
                    {role === 'donor' && (
                        <>
                            <div className="section-title">💖 Bekleyen Destekler</div>
                            <div className="product-grid">
                                <div className="product-card">
                                    <h4>Ali'nin Kitap İhtiyacı</h4>
                                    <p>KPSS seti için desteğe ihtiyacı var.</p>
                                    <div className="funding-area">Hedef: ₺1000</div>
                                    <button className="card-btn">Destek Ol</button>
                                </div>
                                <div className="product-card">
                                    <h4>Öğrenci Yurdu Gıda</h4>
                                    <p>3 öğrenci için gıda paketi.</p>
                                    <div className="funding-area">Tutar: ₺500</div>
                                    <button className="card-btn">Destek Ol</button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* İŞLETME GÖRÜNÜMÜ */}
                    {role === 'business' && (
                        <>
                            <div className="section-title">📊 İşletme Durumu</div>
                            <div className="product-grid">
                                <div className="product-card">
                                    <h4>Askıda Ürünlerim</h4>
                                    <p>Şu an vitrinde 5 adet ürünün var.</p>
                                    <button className="card-btn">Yönet</button>
                                </div>
                                <div className="product-card">
                                    <h4>Rozet Durumu</h4>
                                    <p>Gümüş Rozet sahibisin. Altın için az kaldı!</p>
                                    <button className="card-btn">Detaylar</button>
                                </div>
                            </div>
                        </>
                    )}

                </section>
            </main>
        </div>
    );
};

export default Dashboard;