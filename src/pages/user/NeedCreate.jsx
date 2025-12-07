import React, { useState } from 'react';
import { categories } from '../../data';
import '../../App.css';
import PaydaLogo from '../../components/PaydaLogo';

const NeedCreate = ({ user, onBack, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('all');
    const [targetAmount, setTargetAmount] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Kullanıcı kontrolü
        if (!user || !user.id) {
            setError('Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
            setLoading(false);
            return;
        }

        // Validasyon
        if (!title.trim()) {
            setError('Başlık gereklidir');
            setLoading(false);
            return;
        }
        if (!category || category === 'all') {
            setError('Kategori seçmelisiniz');
            setLoading(false);
            return;
        }
        if (!targetAmount || parseFloat(targetAmount) <= 0) {
            setError('Geçerli bir hedef tutar giriniz');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/needs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    title: title.trim(),
                    description: description.trim() || null,
                    category: category,
                    target_amount: parseFloat(targetAmount)
                })
            });

            let data;
            try {
                data = await response.json();
            } catch (jsonErr) {
                setError('Sunucudan geçersiz yanıt alındı');
                setLoading(false);
                return;
            }

            if (!response.ok) {
                setError(data.detail || data.message || 'İhtiyaç oluşturulamadı');
                setLoading(false);
                return;
            }

            // Başarılı
            if (onSuccess) {
                onSuccess(data);
            } else {
                onBack();
            }

        } catch (err) {
            console.error('İhtiyaç oluşturma hatası:', err);
            if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
                setError('Backend\'e bağlanılamadı. Backend\'in http://localhost:8080 adresinde çalıştığından emin olun.');
            } else {
                setError(`Hata: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-layout" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '100vh' }}>
            <nav className="sidebar" style={{
                background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '4px 0 20px rgba(102, 126, 234, 0.2)'
            }}>
                <div className="brand" style={{
                    background: 'rgba(255,255,255,0.1)',
                    padding: '20px',
                    borderRadius: '12px',
                    marginBottom: '30px',
                    backdropFilter: 'blur(10px)',
                    color: 'white'
                }}>
                    <i className="fas fa-hands-helping" style={{ 
                        color: '#ffd700', 
                        fontSize: '28px',
                        marginRight: '10px'
                    }}></i>
                    <span style={{ 
                        fontSize: '24px', 
                        fontWeight: '700',
                        color: 'white'
                    }}>
                        <PaydaLogo size={35} showText={true} onClick={onBack} darkBackground={true} />
                    </span>
                </div>
                <div className="menu-items">
                    <div className="menu-item" onClick={onBack} style={{
                        borderRadius: '12px',
                        marginBottom: '8px',
                        transition: 'all 0.3s ease',
                        color: 'white',
                        cursor: 'pointer',
                        background: 'rgba(255,255,255,0.1)'
                    }}>
                        <i className="fas fa-arrow-left"></i>
                        <span>Geri Dön</span>
                    </div>
                </div>
            </nav>

            <main className="main-content" style={{ 
                background: 'transparent',
                padding: '30px'
            }}>
                <header style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '25px 30px',
                    borderRadius: '16px',
                    marginBottom: '25px',
                    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: 'white'
                }}>
                    <div>
                        <h2 style={{ 
                            margin: 0, 
                            fontSize: '28px', 
                            fontWeight: '700',
                            color: 'white'
                        }}>
                            <i className="fas fa-bullhorn" style={{ marginRight: '10px' }}></i>
                            Yeni İhtiyaç Oluştur
                        </h2>
                        <p style={{ 
                            margin: '8px 0 0 0', 
                            fontSize: '14px', 
                            opacity: 0.9,
                            color: 'white'
                        }}>
                            İhtiyacınızı detaylı bir şekilde tanımlayın
                        </p>
                    </div>
                </header>

                <section style={{ 
                    maxWidth: '700px', 
                    margin: '0 auto',
                    background: 'white',
                    padding: '30px',
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}>
                    <form onSubmit={handleSubmit}>
                        <div className="input-group" style={{ marginBottom: '25px' }}>
                            <label style={{ 
                                display: 'block', 
                                marginBottom: '10px', 
                                fontWeight: '600', 
                                color: '#333',
                                fontSize: '15px'
                            }}>
                                <i className="fas fa-heading" style={{ marginRight: '8px', color: '#667eea' }}></i>
                                Başlık *
                            </label>
                            <input
                                type="text"
                                placeholder="Örn: KPSS Kitap Seti İhtiyacı"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="input-field"
                                style={{
                                    width: '100%',
                                    padding: '12px 15px',
                                    border: '2px solid #e0e0e0',
                                    borderRadius: '10px',
                                    fontSize: '15px',
                                    transition: 'all 0.3s ease',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                required
                            />
                        </div>

                        <div className="input-group" style={{ marginBottom: '25px' }}>
                            <label style={{ 
                                display: 'block', 
                                marginBottom: '10px', 
                                fontWeight: '600', 
                                color: '#333',
                                fontSize: '15px'
                            }}>
                                <i className="fas fa-align-left" style={{ marginRight: '8px', color: '#667eea' }}></i>
                                Açıklama
                            </label>
                            <textarea
                                placeholder="İhtiyacınız hakkında detaylı bilgi verin..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="input-field"
                                rows="5"
                                style={{ 
                                    resize: 'vertical', 
                                    fontFamily: 'inherit',
                                    width: '100%',
                                    padding: '12px 15px',
                                    border: '2px solid #e0e0e0',
                                    borderRadius: '10px',
                                    fontSize: '15px',
                                    transition: 'all 0.3s ease',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                            />
                        </div>

                        <div className="input-group" style={{ marginBottom: '25px' }}>
                            <label style={{ 
                                display: 'block', 
                                marginBottom: '10px', 
                                fontWeight: '600', 
                                color: '#333',
                                fontSize: '15px'
                            }}>
                                <i className="fas fa-tags" style={{ marginRight: '8px', color: '#667eea' }}></i>
                                Kategori *
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="input-field"
                                style={{
                                    width: '100%',
                                    padding: '12px 15px',
                                    border: '2px solid #e0e0e0',
                                    borderRadius: '10px',
                                    fontSize: '15px',
                                    transition: 'all 0.3s ease',
                                    boxSizing: 'border-box',
                                    background: 'white',
                                    cursor: 'pointer'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                required
                            >
                                <option value="all">Kategori Seçiniz</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="input-group" style={{ marginBottom: '25px' }}>
                            <label style={{ 
                                display: 'block', 
                                marginBottom: '10px', 
                                fontWeight: '600', 
                                color: '#333',
                                fontSize: '15px'
                            }}>
                                <i className="fas fa-lira-sign" style={{ marginRight: '8px', color: '#667eea' }}></i>
                                Hedef Tutar (₺) *
                            </label>
                            <input
                                type="number"
                                placeholder="Örn: 1000"
                                value={targetAmount}
                                onChange={(e) => setTargetAmount(e.target.value)}
                                className="input-field"
                                min="1"
                                step="0.01"
                                style={{
                                    width: '100%',
                                    padding: '12px 15px',
                                    border: '2px solid #e0e0e0',
                                    borderRadius: '10px',
                                    fontSize: '15px',
                                    transition: 'all 0.3s ease',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                required
                            />
                        </div>

                        {error && (
                            <div style={{ 
                                color: '#dc3545', 
                                marginBottom: '20px', 
                                padding: '15px', 
                                backgroundColor: '#f8d7da', 
                                borderRadius: '10px',
                                fontSize: '14px',
                                border: '1px solid #f5c6cb',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <i className="fas fa-exclamation-circle"></i>
                                <span>{error}</span>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                            <button
                                type="submit"
                                disabled={loading}
                                style={{ 
                                    flex: 1,
                                    padding: '15px 25px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    background: loading 
                                        ? 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)'
                                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                                }}
                                onMouseOver={(e) => {
                                    if (!loading) {
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if (!loading) {
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
                                    }
                                }}
                            >
                                {loading ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                                        Oluşturuluyor...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-paper-plane" style={{ marginRight: '8px' }}></i>
                                        İhtiyacı Yayınla
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={onBack}
                                style={{ 
                                    flex: 1,
                                    padding: '15px 25px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    background: 'white',
                                    color: '#667eea',
                                    border: '2px solid #667eea',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.background = '#667eea';
                                    e.target.style.color = 'white';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.background = 'white';
                                    e.target.style.color = '#667eea';
                                }}
                            >
                                <i className="fas fa-times" style={{ marginRight: '8px' }}></i>
                                İptal
                            </button>
                        </div>
                    </form>
                </section>
            </main>
        </div>
    );
};

export default NeedCreate;
