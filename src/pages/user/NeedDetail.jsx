import React, { useState, useEffect } from 'react';
import '../../App.css';
import PaydaLogo from '../../components/PaydaLogo';

const NeedDetail = ({ needId, onBack }) => {
    const [need, setNeed] = useState(null);
    const [loading, setLoading] = useState(true);
    const [donations, setDonations] = useState([]);

    useEffect(() => {
        const fetchNeedDetail = async () => {
            try {
                setLoading(true);
                // İhtiyaç detayını çek
                const needResponse = await fetch(`http://localhost:8080/needs/${needId}`);
                if (needResponse.ok) {
                    const needData = await needResponse.json();
                    setNeed(needData);
                }

                // Bu ihtiyaca yapılan bağışları çek (user_id ile filtrele)
                const donationsResponse = await fetch(`http://localhost:8080/donations`);
                if (donationsResponse.ok) {
                    const allDonations = await donationsResponse.json();
                    // İhtiyaç ile ilgili bağışları filtrele (şimdilik tüm bağışları göster)
                    setDonations(allDonations.slice(0, 10)); // Son 10 bağış
                }
            } catch (error) {
                console.error("Detaylar çekilemedi:", error);
            } finally {
                setLoading(false);
            }
        };

        if (needId) {
            fetchNeedDetail();
        }
    }, [needId]);

    if (loading) {
        return (
            <div className="dashboard-layout">
                <main className="main-content" style={{ padding: '40px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: '#007bff', marginBottom: '15px' }}></i>
                        <p style={{ fontSize: '16px', color: '#666' }}>Yükleniyor...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (!need) {
        return (
            <div className="dashboard-layout">
                <main className="main-content" style={{ padding: '40px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <i className="fas fa-exclamation-triangle" style={{ fontSize: '48px', color: '#ddd', marginBottom: '15px' }}></i>
                        <p style={{ color: '#999', fontSize: '16px' }}>İhtiyaç bulunamadı.</p>
                        <button onClick={onBack} className="login-btn" style={{ marginTop: '20px' }}>
                            Geri Dön
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    const remaining = need.target_amount - need.current_amount;
    const progress = need.progress || 0;

    return (
        <div className="dashboard-layout">
            <nav className="sidebar">
                <div className="brand">
                    <i className="fas fa-hands-helping" style={{ color: '#007bff' }}></i>
                    <PaydaLogo size={35} showText={true} onClick={onBack} darkBackground={false} />
                </div>
                <div className="menu-items">
                    <div className="menu-item" onClick={onBack}>
                        <i className="fas fa-arrow-left"></i>
                        <span>Geri Dön</span>
                    </div>
                </div>
            </nav>

            <main className="main-content">
                <header>
                    <h2>İhtiyaç Detayları</h2>
                </header>

                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    {/* Ana Bilgi Kartı */}
                    <div className="product-card" style={{ marginBottom: '30px' }}>
                        <div className="card-header" style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: '20px'
                        }}>
                            <span className="company-badge" style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                padding: '8px 16px',
                                borderRadius: '20px',
                                fontSize: '13px',
                                fontWeight: '600',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <i className="fas fa-user"></i> {need.user_name || 'Kullanıcı'}
                            </span>
                            <span className="category-tag" style={{
                                background: '#f0f7ff',
                                color: '#007bff',
                                padding: '6px 14px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '600',
                                textTransform: 'uppercase'
                            }}>
                                {need.category || 'GENEL'}
                            </span>
                        </div>

                        <h2 style={{ 
                            margin: '0 0 15px 0', 
                            color: '#2c3e50',
                            fontSize: '28px',
                            fontWeight: '700'
                        }}>
                            {need.title}
                        </h2>

                        <p style={{ 
                            color: '#666', 
                            fontSize: '16px', 
                            margin: '0 0 25px 0',
                            lineHeight: '1.6'
                        }}>
                            {need.description || 'Açıklama yok'}
                        </p>

                        {/* İlerleme Bilgisi */}
                        <div className="progress-area" style={{ marginBottom: '25px' }}>
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                marginBottom: '12px',
                                fontSize: '14px',
                                color: '#666'
                            }}>
                                <span>İlerleme</span>
                                <span style={{ fontWeight: '700', color: '#2c3e50', fontSize: '16px' }}>
                                    {Math.round(progress)}%
                                </span>
                            </div>
                            <div className="progress-bar-bg" style={{
                                height: '16px',
                                borderRadius: '10px',
                                overflow: 'hidden',
                                background: '#f0f0f0',
                                marginBottom: '15px'
                            }}>
                                <div className="progress-fill" style={{ 
                                    width: `${progress}%`, 
                                    height: '100%',
                                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                                    transition: 'width 0.3s ease'
                                }}></div>
                            </div>
                            <div className="price-info" style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '16px',
                                fontWeight: '600'
                            }}>
                                <span style={{ color: '#28a745' }}>
                                    Toplanan: ₺{need.current_amount.toFixed(2)}
                                </span>
                                <span style={{ color: '#dc3545' }}>
                                    Kalan: ₺{remaining.toFixed(2)}
                                </span>
                                <span style={{ color: '#2c3e50' }}>
                                    Hedef: ₺{need.target_amount.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Durum ve Tarih */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingTop: '20px',
                            borderTop: '1px solid #f0f0f0'
                        }}>
                            <div>
                                <span style={{
                                    background: need.status === 'completed' ? '#d4edda' : '#fff3cd',
                                    color: need.status === 'completed' ? '#155724' : '#856404',
                                    padding: '6px 14px',
                                    borderRadius: '12px',
                                    fontSize: '13px',
                                    fontWeight: '600'
                                }}>
                                    {need.status === 'completed' ? '✓ Tamamlandı' : '⏳ Aktif'}
                                </span>
                            </div>
                            <div style={{ fontSize: '13px', color: '#666' }}>
                                <i className="fas fa-calendar"></i> Oluşturulma: {new Date(need.created_at).toLocaleDateString('tr-TR')}
                            </div>
                        </div>
                    </div>

                    {/* Bağış Geçmişi */}
                    <div className="product-card">
                        <h3 style={{ 
                            margin: '0 0 20px 0', 
                            color: '#2c3e50',
                            fontSize: '20px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <i className="fas fa-history"></i>
                            Son Bağışlar
                        </h3>

                        {donations.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                                Henüz bağış yapılmamış.
                            </p>
                        ) : (
                            <div style={{
                                maxHeight: '400px',
                                overflowY: 'auto'
                            }}>
                                {donations.map((donation, index) => {
                                    const date = new Date(donation.created_at);
                                    const formattedDate = date.toLocaleDateString('tr-TR', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    });

                                    return (
                                        <div key={donation.id} style={{
                                            padding: '15px',
                                            borderBottom: index < donations.length - 1 ? '1px solid #f0f0f0' : 'none',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div>
                                                <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>
                                                    {formattedDate}
                                                </div>
                                                <span style={{
                                                    background: '#e8f4f8',
                                                    color: '#2c3e50',
                                                    padding: '4px 10px',
                                                    borderRadius: '12px',
                                                    fontSize: '11px',
                                                    fontWeight: '600'
                                                }}>
                                                    Bağışçı #{donation.user_id}
                                                </span>
                                            </div>
                                            <div style={{ 
                                                fontSize: '18px', 
                                                fontWeight: '700', 
                                                color: '#28a745' 
                                            }}>
                                                ₺{donation.amount?.toFixed(2) || '0.00'}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default NeedDetail;



