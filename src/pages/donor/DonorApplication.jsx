import React, { useState, useEffect } from 'react';
import '../../App.css';
import ThemeSwitcher, { themes } from '../../components/ThemeSwitcher';
import PaydaLogo from '../../components/PaydaLogo';

const DonorApplication = ({ user, onBack, onApplicationSuccess }) => {
    const [qrData, setQrData] = useState('');
    const [documentUrl, setDocumentUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [existingApplication, setExistingApplication] = useState(null);
    const [currentTheme, setCurrentTheme] = useState(() => {
        const saved = localStorage.getItem('appTheme') || 'default';
        return themes[saved] || themes.default;
    });

    // Mevcut başvuruyu kontrol et
    useEffect(() => {
        if (user && user.id) {
            fetch(`http://localhost:8080/donor-applications/user/${user.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.id) {
                        setExistingApplication(data);
                    }
                })
                .catch(err => console.error('Başvuru kontrolü hatası:', err));
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        if (!user || !user.id) {
            setError('Kullanıcı bilgisi bulunamadı. Lütfen önce giriş yapın.');
            setLoading(false);
            return;
        }

        if (!qrData.trim()) {
            setError('QR kod verisi gereklidir. Lütfen evraktan QR kodu okuyun.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`http://localhost:8080/donor-applications?user_id=${user.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    qr_data: qrData,
                    document_url: documentUrl || null
                })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Başvurunuz başarıyla gönderildi! Admin onayı bekleniyor.');
                setQrData('');
                setDocumentUrl('');
                if (onApplicationSuccess) {
                    setTimeout(() => {
                        onApplicationSuccess();
                    }, 2000);
                }
            } else {
                setError(data.detail || 'Başvuru gönderilemedi.');
            }
        } catch (err) {
            setError('Sunucuya bağlanılamadı. Backend terminali açık mı?');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return { text: 'Beklemede', color: '#ff9800', bg: '#fff3e0' };
            case 'approved':
                return { text: 'Onaylandı', color: '#4caf50', bg: '#e8f5e9' };
            case 'rejected':
                return { text: 'Reddedildi', color: '#f44336', bg: '#ffebee' };
            default:
                return { text: 'Bilinmeyen', color: '#757575', bg: '#f5f5f5' };
        }
    };

    if (existingApplication) {
        const statusBadge = getStatusBadge(existingApplication.verification_status);
        
        return (
            <div style={{
                minHeight: '100vh',
                background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.secondary} 100%)`,
                padding: '20px'
            }}>
                <div style={{
                    maxWidth: '800px',
                    margin: '0 auto',
                    background: 'white',
                    borderRadius: '20px',
                    padding: '40px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                        <PaydaLogo size={50} showText={true} onClick={onBack} darkBackground={false} />
                        <button
                            onClick={onBack}
                            style={{
                                padding: '10px 20px',
                                background: currentTheme.secondary,
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontSize: '16px'
                            }}
                        >
                            <i className="fas fa-arrow-left"></i> Geri
                        </button>
                    </div>

                    <h2 style={{ 
                        color: currentTheme.primary,
                        marginBottom: '20px',
                        textAlign: 'center'
                    }}>
                        Gönüllü Başvuru Durumu
                    </h2>

                    <div style={{
                        background: statusBadge.bg,
                        border: `2px solid ${statusBadge.color}`,
                        borderRadius: '15px',
                        padding: '25px',
                        marginBottom: '20px',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            fontSize: '24px',
                            fontWeight: 'bold',
                            color: statusBadge.color,
                            marginBottom: '10px'
                        }}>
                            {statusBadge.text}
                        </div>
                        {existingApplication.verification_status === 'pending' && (
                            <p style={{ color: '#666', marginTop: '10px' }}>
                                Başvurunuz admin onayı bekliyor. Lütfen bekleyin.
                            </p>
                        )}
                        {existingApplication.verification_status === 'approved' && (
                            <p style={{ color: '#666', marginTop: '10px' }}>
                                Tebrikler! Başvurunuz onaylandı. Artık gönüllü olarak bağış yapabilirsiniz.
                            </p>
                        )}
                        {existingApplication.verification_status === 'rejected' && (
                            <div style={{ marginTop: '15px' }}>
                                <p style={{ color: '#666', marginBottom: '10px' }}>
                                    Başvurunuz reddedildi.
                                </p>
                                {existingApplication.rejection_reason && (
                                    <div style={{
                                        background: 'white',
                                        padding: '15px',
                                        borderRadius: '10px',
                                        marginTop: '10px'
                                    }}>
                                        <strong>Red Nedeni:</strong> {existingApplication.rejection_reason}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div style={{
                        background: '#f5f5f5',
                        borderRadius: '15px',
                        padding: '20px',
                        marginTop: '20px'
                    }}>
                        <h3 style={{ marginBottom: '15px', color: '#333' }}>Başvuru Detayları</h3>
                        <div style={{ marginBottom: '10px' }}>
                            <strong>Başvuru Tarihi:</strong> {new Date(existingApplication.created_at).toLocaleString('tr-TR')}
                        </div>
                        {existingApplication.verified_at && (
                            <div style={{ marginBottom: '10px' }}>
                                <strong>İşlem Tarihi:</strong> {new Date(existingApplication.verified_at).toLocaleString('tr-TR')}
                            </div>
                        )}
                        {existingApplication.verified_by_name && (
                            <div style={{ marginBottom: '10px' }}>
                                <strong>İşlemi Yapan:</strong> {existingApplication.verified_by_name}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.secondary} 100%)`,
            padding: '20px'
        }}>
            <div style={{
                maxWidth: '600px',
                margin: '0 auto',
                background: 'white',
                borderRadius: '20px',
                padding: '40px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <PaydaLogo size={50} showText={true} onClick={onBack} darkBackground={false} />
                    <ThemeSwitcher currentTheme={currentTheme} onThemeChange={(themeName) => {
                        const theme = themes[themeName] || themes.default;
                        setCurrentTheme(theme);
                        localStorage.setItem('appTheme', themeName);
                    }} />
                </div>

                <h2 style={{ 
                    color: currentTheme.primary,
                    marginBottom: '10px',
                    textAlign: 'center'
                }}>
                    Gönüllü Başvuru Formu
                </h2>
                <p style={{ 
                    textAlign: 'center', 
                    color: '#666', 
                    marginBottom: '30px',
                    fontSize: '14px'
                }}>
                    Gönüllü olmak için maddi durum belgenizi QR kod ile okutun
                </p>

                {error && (
                    <div style={{
                        background: '#ffebee',
                        color: '#c62828',
                        padding: '15px',
                        borderRadius: '10px',
                        marginBottom: '20px',
                        border: '1px solid #ef5350'
                    }}>
                        <i className="fas fa-exclamation-circle"></i> {error}
                    </div>
                )}

                {success && (
                    <div style={{
                        background: '#e8f5e9',
                        color: '#2e7d32',
                        padding: '15px',
                        borderRadius: '10px',
                        marginBottom: '20px',
                        border: '1px solid #4caf50'
                    }}>
                        <i className="fas fa-check-circle"></i> {success}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            color: '#333',
                            fontWeight: '600'
                        }}>
                            <i className="fas fa-qrcode"></i> QR Kod Verisi *
                        </label>
                        <input
                            type="text"
                            value={qrData}
                            onChange={(e) => setQrData(e.target.value)}
                            placeholder="Evraktan QR kodu okuyun veya manuel olarak girin"
                            required
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: `2px solid ${currentTheme.primary}`,
                                borderRadius: '10px',
                                fontSize: '16px',
                                boxSizing: 'border-box'
                            }}
                        />
                        <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
                            Evraktan QR kod okutun veya manuel olarak veriyi girin
                        </small>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            color: '#333',
                            fontWeight: '600'
                        }}>
                            <i className="fas fa-file-pdf"></i> Evrak URL'i (Opsiyonel)
                        </label>
                        <input
                            type="url"
                            value={documentUrl}
                            onChange={(e) => setDocumentUrl(e.target.value)}
                            placeholder="https://..."
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
                        style={{
                            width: '100%',
                            padding: '15px',
                            background: loading ? '#ccc' : `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.secondary} 100%)`,
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '18px',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                        }}
                    >
                        {loading ? (
                            <><i className="fas fa-spinner fa-spin"></i> Gönderiliyor...</>
                        ) : (
                            <><i className="fas fa-paper-plane"></i> Başvuruyu Gönder</>
                        )}
                    </button>
                </form>

                <div style={{
                    marginTop: '30px',
                    padding: '20px',
                    background: '#f5f5f5',
                    borderRadius: '10px',
                    fontSize: '14px',
                    color: '#666'
                }}>
                    <strong>Not:</strong> Başvurunuz admin tarafından incelenecek ve onaylandıktan sonra gönüllü olarak bağış yapabileceksiniz.
                </div>
            </div>
        </div>
    );
};

export default DonorApplication;

