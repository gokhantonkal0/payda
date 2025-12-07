import React, { useState } from 'react';
import '../../App.css';

const UserSettings = ({ user, onBack }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('Yeni şifreler eşleşmiyor');
            return;
        }

        if (newPassword.length < 6) {
            setError('Şifre en az 6 karakter olmalıdır');
            return;
        }

        setLoading(true);

        try {
            // Şifre değiştirme işlemi
            const response = await fetch(`http://localhost:8080/users/${user.id}/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Şifre başarıyla değiştirildi!');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setTimeout(() => {
                    onBack();
                }, 1500);
            } else {
                setError(data.detail || 'Şifre değiştirilemedi');
            }
        } catch (error) {
            console.error('Şifre değiştirme hatası:', error);
            setError('Şifre değiştirilirken bir hata oluştu');
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
                            <i className="fas fa-cog" style={{ marginRight: '10px' }}></i>
                            Şifre Değiştir
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
                        {/* Mevcut Şifre */}
                        <div className="input-group" style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#333'
                            }}>
                                Mevcut Şifre
                            </label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="input-field"
                                required
                                style={{
                                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                                    border: '2px solid transparent'
                                }}
                            />
                        </div>

                        {/* Yeni Şifre */}
                        <div className="input-group" style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#333'
                            }}>
                                Yeni Şifre
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="input-field"
                                required
                                minLength={6}
                                style={{
                                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                                    border: '2px solid transparent'
                                }}
                            />
                        </div>

                        {/* Şifre Tekrar */}
                        <div className="input-group" style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#333'
                            }}>
                                Yeni Şifre (Tekrar)
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="input-field"
                                required
                                minLength={6}
                                style={{
                                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                                    border: '2px solid transparent'
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
                                    Değiştiriliyor...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-key" style={{ marginRight: '8px' }}></i>
                                    Şifreyi Değiştir
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default UserSettings;





