import React, { useState, useEffect } from 'react';
import '../App.css';
import { censorName } from '../utils/nameCensor';

const DatabasePanel = ({ isOpen, onClose }) => {
    const [databaseData, setDatabaseData] = useState(null);
    const [moneyFlows, setMoneyFlows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview'); // overview, moneyflows

    useEffect(() => {
        if (isOpen) {
            fetchDatabaseData();
            fetchMoneyFlows();
        }
    }, [isOpen]);

    const fetchDatabaseData = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:8080/database/overview');
            if (response.ok) {
                const data = await response.json();
                setDatabaseData(data);
            }
        } catch (error) {
            console.error('Veritabanı bilgisi alınamadı:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMoneyFlows = async () => {
        try {
            const response = await fetch('http://localhost:8080/money-flows?limit=50');
            if (response.ok) {
                const data = await response.json();
                setMoneyFlows(data);
            }
        } catch (error) {
            console.error('Para akışı bilgisi alınamadı:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            right: 0,
            top: 0,
            width: '450px',
            height: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '-4px 0 20px rgba(0,0,0,0.3)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            color: 'white',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                padding: '20px',
                borderBottom: '2px solid rgba(255,255,255,0.2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>
                    <i className="fas fa-database" style={{ marginRight: '10px' }}></i>
                    Veritabanı Paneli
                </h2>
                <button
                    onClick={onClose}
                    style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        color: 'white',
                        width: '35px',
                        height: '35px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        fontSize: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    ×
                </button>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                borderBottom: '2px solid rgba(255,255,255,0.2)',
                padding: '0 20px'
            }}>
                <button
                    onClick={() => setActiveTab('overview')}
                    style={{
                        flex: 1,
                        padding: '15px',
                        background: activeTab === 'overview' ? 'rgba(255,255,255,0.2)' : 'transparent',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: activeTab === 'overview' ? '700' : '400',
                        borderBottom: activeTab === 'overview' ? '3px solid white' : 'none'
                    }}
                >
                    Genel Bakış
                </button>
                <button
                    onClick={() => setActiveTab('moneyflows')}
                    style={{
                        flex: 1,
                        padding: '15px',
                        background: activeTab === 'moneyflows' ? 'rgba(255,255,255,0.2)' : 'transparent',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: activeTab === 'moneyflows' ? '700' : '400',
                        borderBottom: activeTab === 'moneyflows' ? '3px solid white' : 'none'
                    }}
                >
                    Para Akışı
                </button>
            </div>

            {/* Content */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px'
            }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px' }}></i>
                        <p style={{ marginTop: '15px' }}>Yükleniyor...</p>
                    </div>
                ) : activeTab === 'overview' ? (
                    <div>
                        {databaseData && (
                            <>
                                {/* Kullanıcılar */}
                                <div style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    padding: '15px',
                                    marginBottom: '15px'
                                }}>
                                    <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
                                        <i className="fas fa-users" style={{ marginRight: '8px' }}></i>
                                        Kullanıcılar
                                    </h3>
                                    <p style={{ margin: '5px 0', fontSize: '14px', opacity: 0.9 }}>
                                        Toplam: <strong>{databaseData.users.total}</strong>
                                    </p>
                                    <p style={{ margin: '5px 0', fontSize: '14px', opacity: 0.9 }}>
                                        Toplam Bakiye: <strong>₺{databaseData.users.total_balance.toFixed(2)}</strong>
                                    </p>
                                    <div style={{ marginTop: '10px' }}>
                                        {Object.entries(databaseData.users.by_role).map(([role, count]) => (
                                            <span key={role} style={{
                                                display: 'inline-block',
                                                background: 'rgba(255,255,255,0.2)',
                                                padding: '4px 10px',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                                marginRight: '5px',
                                                marginBottom: '5px'
                                            }}>
                                                {role}: {count}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Bağışlar */}
                                <div style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    padding: '15px',
                                    marginBottom: '15px'
                                }}>
                                    <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
                                        <i className="fas fa-heart" style={{ marginRight: '8px' }}></i>
                                        Bağışlar
                                    </h3>
                                    <p style={{ margin: '5px 0', fontSize: '14px', opacity: 0.9 }}>
                                        Toplam: <strong>{databaseData.donations.total}</strong>
                                    </p>
                                    <p style={{ margin: '5px 0', fontSize: '14px', opacity: 0.9 }}>
                                        Toplam Tutar: <strong>₺{databaseData.donations.total_amount.toFixed(2)}</strong>
                                    </p>
                                </div>

                                {/* İhtiyaçlar */}
                                <div style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    padding: '15px',
                                    marginBottom: '15px'
                                }}>
                                    <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
                                        <i className="fas fa-bullhorn" style={{ marginRight: '8px' }}></i>
                                        İhtiyaçlar
                                    </h3>
                                    <p style={{ margin: '5px 0', fontSize: '14px', opacity: 0.9 }}>
                                        Toplam: <strong>{databaseData.needs.total}</strong>
                                    </p>
                                    <p style={{ margin: '5px 0', fontSize: '14px', opacity: 0.9 }}>
                                        Aktif: <strong>{databaseData.needs.active}</strong> | 
                                        Tamamlanan: <strong>{databaseData.needs.completed}</strong>
                                    </p>
                                </div>

                                {/* Kuponlar */}
                                <div style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    padding: '15px',
                                    marginBottom: '15px'
                                }}>
                                    <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
                                        <i className="fas fa-ticket-alt" style={{ marginRight: '8px' }}></i>
                                        Kuponlar
                                    </h3>
                                    <p style={{ margin: '5px 0', fontSize: '14px', opacity: 0.9 }}>
                                        Toplam: <strong>{databaseData.coupons.total}</strong>
                                    </p>
                                    <div style={{ marginTop: '10px' }}>
                                        {Object.entries(databaseData.coupons.by_status).map(([status, count]) => (
                                            <span key={status} style={{
                                                display: 'inline-block',
                                                background: 'rgba(255,255,255,0.2)',
                                                padding: '4px 10px',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                                marginRight: '5px',
                                                marginBottom: '5px'
                                            }}>
                                                {status}: {count}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <div>
                        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
                            <i className="fas fa-exchange-alt" style={{ marginRight: '8px' }}></i>
                            Son Para Akışları
                        </h3>
                        {moneyFlows.length === 0 ? (
                            <p style={{ textAlign: 'center', opacity: 0.7, padding: '20px' }}>
                                Henüz para akışı kaydı yok
                            </p>
                        ) : (
                            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                {moneyFlows.map((flow) => (
                                    <div key={flow.id} style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        borderRadius: '10px',
                                        padding: '12px',
                                        marginBottom: '10px',
                                        fontSize: '13px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                            <span style={{ fontWeight: '600' }}>
                                                {censorName(flow.user_name) || '***'}
                                            </span>
                                            <span style={{
                                                color: flow.amount > 0 ? '#4ade80' : '#f87171',
                                                fontWeight: '700'
                                            }}>
                                                {flow.amount > 0 ? '+' : ''}₺{flow.amount.toFixed(2)}
                                            </span>
                                        </div>
                                        <div style={{ opacity: 0.8, fontSize: '11px', marginBottom: '3px' }}>
                                            {flow.transaction_type === 'coupon_donation' ? (
                                                <span>
                                                    <i className="fas fa-ticket-alt" style={{ marginRight: '5px' }}></i>
                                                    Kupon Bağışı • {flow.coupon_type_name || 'Bilinmeyen Kupon'} ({flow.merchant_name || 'Bilinmeyen İşletme'})
                                                </span>
                                            ) : (
                                                <span>{flow.transaction_type} • {flow.description || ''}</span>
                                            )}
                                        </div>
                                        {flow.balance_before !== null && flow.balance_after !== null ? (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', opacity: 0.7 }}>
                                                <span>Önce: ₺{flow.balance_before.toFixed(2)}</span>
                                                <span>→</span>
                                                <span>Sonra: ₺{flow.balance_after.toFixed(2)}</span>
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: '11px', opacity: 0.7, fontStyle: 'italic' }}>
                                                Kupon havuzuna bağış
                                            </div>
                                        )}
                                        {flow.created_at && (
                                            <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '5px' }}>
                                                {new Date(flow.created_at).toLocaleString('tr-TR')}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DatabasePanel;

