import React, { useState, useEffect } from 'react';
import '../../App.css';

const UserProfile = ({ user, onBack, onUpdate }) => {
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [address, setAddress] = useState(user?.address || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // User state'ini güncelle
    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
            setPhone(user.phone || '');
            setAddress(user.address || '');
            setBio(user.bio || '');
        }
    }, [user]);

    // User yoksa loading göster (early return hooks'tan sonra olmalı)
    if (!user || !user.id) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{ 
                        border: '4px solid #f3f3f3',
                        borderTop: '4px solid #2c3e50',
                        borderRadius: '50%',
                        width: '50px',
                        height: '50px',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 20px'
                    }}></div>
                    <p style={{ color: '#2c3e50', fontSize: '18px' }}>Yükleniyor...</p>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            // Profil güncelleme işlemi
            const response = await fetch(`http://localhost:8080/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, phone, address, bio })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Profil başarıyla güncellendi!');
                if (onUpdate) {
                    onUpdate({ ...user, name, email, phone, address, bio });
                }
                setTimeout(() => {
                    onBack();
                }, 1500);
            } else {
                setError(data.detail || 'Profil güncellenemedi');
            }
        } catch (error) {
            console.error('Profil güncelleme hatası:', error);
            setError('Profil güncellenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-layout" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '100vh' }}>
            <main className="main-content" style={{ marginLeft: 0, padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '40px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '30px',
                        paddingBottom: '20px',
                        borderBottom: '2px solid #f0f0f0'
                    }}>
                        <h1 style={{
                            margin: 0,
                            fontSize: '28px',
                            fontWeight: '700',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            <i className="fas fa-user-circle" style={{ marginRight: '10px' }}></i>
                            Profil Ayarları
                        </h1>
                        <button
                            onClick={onBack}
                            style={{
                                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '25px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#667eea'
                            }}
                        >
                            <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i>
                            Geri Dön
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Ad */}
                        <div className="input-group" style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#333'
                            }}>
                                Ad Soyad
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input-field"
                                required
                                style={{
                                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                                    border: '2px solid transparent'
                                }}
                            />
                        </div>

                        {/* E-posta */}
                        <div className="input-group" style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#333'
                            }}>
                                <i className="fas fa-envelope" style={{ marginRight: '8px' }}></i>
                                E-posta
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field"
                                placeholder="ornek@email.com"
                                style={{
                                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                                    border: '2px solid transparent'
                                }}
                            />
                        </div>

                        {/* Telefon */}
                        <div className="input-group" style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#333'
                            }}>
                                <i className="fas fa-phone" style={{ marginRight: '8px' }}></i>
                                Telefon
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="input-field"
                                placeholder="05XX XXX XX XX"
                                style={{
                                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                                    border: '2px solid transparent'
                                }}
                            />
                        </div>

                        {/* Adres */}
                        <div className="input-group" style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#333'
                            }}>
                                <i className="fas fa-map-marker-alt" style={{ marginRight: '8px' }}></i>
                                Adres
                            </label>
                            <textarea
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="input-field"
                                placeholder="Adres bilginizi giriniz"
                                rows="3"
                                style={{
                                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                                    border: '2px solid transparent',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>

                        {/* Bio/Hakkımda */}
                        <div className="input-group" style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#333'
                            }}>
                                <i className="fas fa-user-edit" style={{ marginRight: '8px' }}></i>
                                Hakkımda
                            </label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="input-field"
                                placeholder="Kendiniz hakkında kısa bir bilgi yazın..."
                                rows="4"
                                style={{
                                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                                    border: '2px solid transparent',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>

                        {error && (
                            <div style={{
                                background: '#fee',
                                color: '#c33',
                                padding: '12px',
                                borderRadius: '8px',
                                marginBottom: '15px',
                                fontSize: '14px'
                            }}>
                                <i className="fas fa-exclamation-circle" style={{ marginRight: '8px' }}></i>
                                {error}
                            </div>
                        )}

                        {success && (
                            <div style={{
                                background: '#efe',
                                color: '#3c3',
                                padding: '12px',
                                borderRadius: '8px',
                                marginBottom: '15px',
                                fontSize: '14px'
                            }}>
                                <i className="fas fa-check-circle" style={{ marginRight: '8px' }}></i>
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="login-btn"
                            disabled={loading}
                            style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                width: '100%',
                                padding: '14px',
                                fontSize: '16px',
                                fontWeight: '600',
                                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                            }}
                        >
                            {loading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                                    Güncelleniyor...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-save" style={{ marginRight: '8px' }}></i>
                                    Profili Güncelle
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default UserProfile;

