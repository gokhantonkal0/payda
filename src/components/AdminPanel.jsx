import React, { useState, useEffect } from 'react';
import '../App.css';
import ThemeSwitcher, { themes } from './ThemeSwitcher';

const AdminPanel = ({ user, onBack }) => {
    const [applications, setApplications] = useState([]);
    const [volunteerApplications, setVolunteerApplications] = useState([]);
    const [beneficiaryRegistrations, setBeneficiaryRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
    const [activeTab, setActiveTab] = useState('beneficiary'); // 'beneficiary', 'volunteer' veya 'donor'
    const [currentTheme, setCurrentTheme] = useState(() => {
        const saved = localStorage.getItem('appTheme') || 'default';
        return themes[saved] || themes.default;
    });

    useEffect(() => {
        fetchApplications();
    }, [filter, activeTab]);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            if (activeTab === 'beneficiary') {
                // İhtiyaç sahibi kayıtları
                const url = filter === 'all' 
                    ? 'http://localhost:8080/beneficiary-registrations'
                    : `http://localhost:8080/beneficiary-registrations?status=${filter}`;
                
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    setBeneficiaryRegistrations(data);
                }
            } else if (activeTab === 'volunteer') {
                // Gönüllü başvuruları
                const url = filter === 'all' 
                    ? 'http://localhost:8080/volunteer-applications'
                    : `http://localhost:8080/volunteer-applications?status=${filter}`;
                
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    setVolunteerApplications(data);
                }
            } else {
                // Bağışçı başvuruları
                const url = filter === 'all' 
                    ? 'http://localhost:8080/donor-applications'
                    : `http://localhost:8080/donor-applications?status=${filter}`;
                
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    setApplications(data);
                }
            }
        } catch (error) {
            console.error('Başvurular yüklenemedi:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (applicationId) => {
        if (!window.confirm('Bu başvuruyu onaylamak istediğinize emin misiniz?')) {
            return;
        }

        try {
            let endpoint;
            if (activeTab === 'beneficiary') {
                endpoint = `http://localhost:8080/beneficiary-registrations/${applicationId}/approve?admin_id=${user.id}`;
            } else if (activeTab === 'volunteer') {
                endpoint = `http://localhost:8080/volunteer-applications/${applicationId}/approve?admin_id=${user.id}`;
            } else {
                endpoint = `http://localhost:8080/donor-applications/${applicationId}/approve?admin_id=${user.id}`;
            }
            
            const response = await fetch(endpoint, { method: 'POST' });

            if (response.ok) {
                alert('Başvuru onaylandı!');
                fetchApplications();
            } else {
                const data = await response.json();
                alert(data.detail || 'Onaylama başarısız');
            }
        } catch (error) {
            alert('Sunucuya bağlanılamadı');
        }
    };

    const handleReject = async (applicationId) => {
        const reason = window.prompt('Red nedeni:');
        if (!reason) return;

        try {
            let endpoint;
            if (activeTab === 'beneficiary') {
                endpoint = `http://localhost:8080/beneficiary-registrations/${applicationId}/reject?admin_id=${user.id}&rejection_reason=${encodeURIComponent(reason)}`;
            } else if (activeTab === 'volunteer') {
                endpoint = `http://localhost:8080/volunteer-applications/${applicationId}/reject?admin_id=${user.id}&rejection_reason=${encodeURIComponent(reason)}`;
            } else {
                endpoint = `http://localhost:8080/donor-applications/${applicationId}/reject?admin_id=${user.id}&rejection_reason=${encodeURIComponent(reason)}`;
            }
            
            const response = await fetch(endpoint, { method: 'POST' });

            if (response.ok) {
                alert('Başvuru reddedildi!');
                fetchApplications();
            } else {
                const data = await response.json();
                alert(data.detail || 'Reddetme başarısız');
            }
        } catch (error) {
            alert('Sunucuya bağlanılamadı');
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

    return (
        <div style={{
            minHeight: '100vh',
            background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.secondary} 100%)`,
            padding: '20px'
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                background: 'white',
                borderRadius: '20px',
                padding: '30px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
            }}>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '30px' 
                }}>
                    <h1 style={{ color: currentTheme.primary, margin: 0 }}>
                        <i className="fas fa-user-shield"></i> Admin Paneli - Başvuru Yönetimi
                    </h1>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <ThemeSwitcher 
                            currentTheme={currentTheme} 
                            onThemeChange={(themeName) => {
                                const theme = themes[themeName] || themes.default;
                                setCurrentTheme(theme);
                                localStorage.setItem('appTheme', themeName);
                            }} 
                        />
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
                </div>

                {/* Tab Butonları */}
                <div style={{
                    display: 'flex',
                    gap: '10px',
                    marginBottom: '20px',
                    borderBottom: '2px solid #e0e0e0'
                }}>
                    <button
                        onClick={() => setActiveTab('beneficiary')}
                        style={{
                            padding: '12px 24px',
                            background: activeTab === 'beneficiary' ? currentTheme.primary : 'transparent',
                            color: activeTab === 'beneficiary' ? 'white' : '#666',
                            border: 'none',
                            borderBottom: activeTab === 'beneficiary' ? `3px solid ${currentTheme.primary}` : '3px solid transparent',
                            borderRadius: '8px 8px 0 0',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: activeTab === 'beneficiary' ? '600' : '400',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <i className="fas fa-user-injured" style={{ marginRight: '8px' }}></i>
                        İhtiyaç Sahibi Kayıtları (SGK)
                    </button>
                    <button
                        onClick={() => setActiveTab('volunteer')}
                        style={{
                            padding: '12px 24px',
                            background: activeTab === 'volunteer' ? currentTheme.primary : 'transparent',
                            color: activeTab === 'volunteer' ? 'white' : '#666',
                            border: 'none',
                            borderBottom: activeTab === 'volunteer' ? `3px solid ${currentTheme.primary}` : '3px solid transparent',
                            borderRadius: '8px 8px 0 0',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: activeTab === 'volunteer' ? '600' : '400',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <i className="fas fa-hands-helping" style={{ marginRight: '8px' }}></i>
                        Gönüllü Başvuruları (E-Devlet)
                    </button>
                    <button
                        onClick={() => setActiveTab('donor')}
                        style={{
                            padding: '12px 24px',
                            background: activeTab === 'donor' ? currentTheme.primary : 'transparent',
                            color: activeTab === 'donor' ? 'white' : '#666',
                            border: 'none',
                            borderBottom: activeTab === 'donor' ? `3px solid ${currentTheme.primary}` : '3px solid transparent',
                            borderRadius: '8px 8px 0 0',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: activeTab === 'donor' ? '600' : '400',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <i className="fas fa-heart" style={{ marginRight: '8px' }}></i>
                        Bağışçı Başvuruları
                    </button>
                </div>

                {/* Filtre Butonları */}
                <div style={{
                    display: 'flex',
                    gap: '10px',
                    marginBottom: '20px',
                    flexWrap: 'wrap'
                }}>
                    {['all', 'pending', 'approved', 'rejected'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            style={{
                                padding: '10px 20px',
                                background: filter === status 
                                    ? currentTheme.primary 
                                    : '#f5f5f5',
                                color: filter === status ? 'white' : '#333',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: filter === status ? '600' : '400',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {status === 'all' ? 'Tümü' : 
                             status === 'pending' ? 'Beklemede' :
                             status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: currentTheme.primary }}></i>
                        <p style={{ marginTop: '10px', color: '#666' }}>Yükleniyor...</p>
                    </div>
                ) : (activeTab === 'beneficiary' ? beneficiaryRegistrations : activeTab === 'volunteer' ? volunteerApplications : applications).length === 0 ? (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '40px',
                        background: '#f5f5f5',
                        borderRadius: '10px'
                    }}>
                        <i className="fas fa-inbox" style={{ fontSize: '48px', color: '#ccc', marginBottom: '10px' }}></i>
                        <p style={{ color: '#666' }}>Henüz başvuru bulunmuyor.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '20px' }}>
                        {(activeTab === 'beneficiary' ? beneficiaryRegistrations : activeTab === 'volunteer' ? volunteerApplications : applications).map(app => {
                            const statusBadge = getStatusBadge(app.verification_status);
                            return (
                                <div
                                    key={app.id}
                                    style={{
                                        background: 'white',
                                        border: `2px solid ${statusBadge.color}`,
                                        borderRadius: '15px',
                                        padding: '25px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: '20px'
                                    }}>
                                        <div>
                                            <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>
                                                {app.name || app.user_name}
                                            </h3>
                                            {(app.email || app.user_email) && (
                                                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                                                    <i className="fas fa-envelope"></i> {app.email || app.user_email}
                                                </p>
                                            )}
                                            {app.phone && (
                                                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                                                    <i className="fas fa-phone"></i> {app.phone}
                                                </p>
                                            )}
                                        </div>
                                        <div style={{
                                            background: statusBadge.bg,
                                            color: statusBadge.color,
                                            padding: '8px 16px',
                                            borderRadius: '20px',
                                            fontWeight: '600',
                                            fontSize: '14px'
                                        }}>
                                            {statusBadge.text}
                                        </div>
                                    </div>

                                    <div style={{
                                        background: '#f9f9f9',
                                        padding: '15px',
                                        borderRadius: '10px',
                                        marginBottom: '15px'
                                    }}>
                                        {activeTab === 'beneficiary' ? (
                                            <>
                                                {app.sgk_document_file && (
                                                    <div style={{ marginBottom: '10px' }}>
                                                        <strong>SGK Döküm Evrağı:</strong>
                                                        <div style={{ marginTop: '5px' }}>
                                                            <img 
                                                                src={app.sgk_document_file} 
                                                                alt="SGK döküm evrağı" 
                                                                style={{ 
                                                                    maxWidth: '100%', 
                                                                    maxHeight: '300px',
                                                                    border: '1px solid #ddd',
                                                                    borderRadius: '5px'
                                                                }} 
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                                {app.sgk_document_url && (
                                                    <div style={{ marginBottom: '10px' }}>
                                                        <strong>SGK Belge URL:</strong>
                                                        <div style={{ marginTop: '5px' }}>
                                                            <a 
                                                                href={app.sgk_document_url} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                style={{ color: currentTheme.primary }}
                                                            >
                                                                <i className="fas fa-external-link-alt"></i> Belgeyi Görüntüle
                                                            </a>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        ) : activeTab === 'volunteer' ? (
                                            <>
                                                {app.edevlet_qr_data && (
                                                    <div style={{ marginBottom: '10px' }}>
                                                        <strong>E-Devlet QR Kod Verisi:</strong>
                                                        <div style={{
                                                            background: 'white',
                                                            padding: '10px',
                                                            borderRadius: '5px',
                                                            marginTop: '5px',
                                                            fontFamily: 'monospace',
                                                            fontSize: '12px',
                                                            wordBreak: 'break-all'
                                                        }}>
                                                            {app.edevlet_qr_data}
                                                        </div>
                                                    </div>
                                                )}
                                                {app.edevlet_document_url && (
                                                    <div style={{ marginBottom: '10px' }}>
                                                        <strong>E-Devlet Belge URL:</strong>
                                                        <div style={{ marginTop: '5px' }}>
                                                            <a 
                                                                href={app.edevlet_document_url} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                style={{ color: currentTheme.primary }}
                                                            >
                                                                <i className="fas fa-external-link-alt"></i> Belgeyi Görüntüle
                                                            </a>
                                                        </div>
                                                    </div>
                                                )}
                                                {app.document_file && (
                                                    <div style={{ marginBottom: '10px' }}>
                                                        <strong>E-Devlet Belgesi:</strong>
                                                        <div style={{ marginTop: '5px' }}>
                                                            <img 
                                                                src={app.document_file} 
                                                                alt="E-devlet belgesi" 
                                                                style={{ 
                                                                    maxWidth: '100%', 
                                                                    maxHeight: '300px',
                                                                    border: '1px solid #ddd',
                                                                    borderRadius: '5px'
                                                                }} 
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <div style={{ marginBottom: '10px' }}>
                                                    <strong>QR Kod Verisi:</strong>
                                                    <div style={{
                                                        background: 'white',
                                                        padding: '10px',
                                                        borderRadius: '5px',
                                                        marginTop: '5px',
                                                        fontFamily: 'monospace',
                                                        fontSize: '12px',
                                                        wordBreak: 'break-all'
                                                    }}>
                                                        {app.qr_data || 'Belirtilmemiş'}
                                                    </div>
                                                </div>
                                                {app.document_url && (
                                                    <div style={{ marginBottom: '10px' }}>
                                                        <strong>Evrak URL:</strong>
                                                        <div style={{ marginTop: '5px' }}>
                                                            <a 
                                                                href={app.document_url} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                style={{ color: currentTheme.primary }}
                                                            >
                                                                <i className="fas fa-external-link-alt"></i> {app.document_url}
                                                            </a>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        <div style={{ fontSize: '13px', color: '#666' }}>
                                            <div><strong>Başvuru Tarihi:</strong> {new Date(app.created_at).toLocaleString('tr-TR')}</div>
                                            {app.verified_at && (
                                                <div><strong>İşlem Tarihi:</strong> {new Date(app.verified_at).toLocaleString('tr-TR')}</div>
                                            )}
                                            {app.verified_by_name && (
                                                <div><strong>İşlemi Yapan:</strong> {app.verified_by_name}</div>
                                            )}
                                            {app.rejection_reason && (
                                                <div style={{ marginTop: '10px', color: '#f44336' }}>
                                                    <strong>Red Nedeni:</strong> {app.rejection_reason}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {app.verification_status === 'pending' && (
                                        <div style={{
                                            display: 'flex',
                                            gap: '10px',
                                            justifyContent: 'flex-end'
                                        }}>
                                            <button
                                                onClick={() => handleReject(app.id)}
                                                style={{
                                                    padding: '10px 20px',
                                                    background: '#f44336',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                    fontWeight: '600'
                                                }}
                                            >
                                                <i className="fas fa-times"></i> Reddet
                                            </button>
                                            <button
                                                onClick={() => handleApprove(app.id)}
                                                style={{
                                                    padding: '10px 20px',
                                                    background: '#4caf50',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                    fontWeight: '600'
                                                }}
                                            >
                                                <i className="fas fa-check"></i> Onayla
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;

