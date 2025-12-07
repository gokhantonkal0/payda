import React, { useState, useEffect, useCallback, useRef } from 'react';
import { coupons } from '../../data';
import '../../App.css';
import UserProfile from '../user/UserProfile';
import UserSettings from '../user/UserSettings';
import NotificationSystem from '../../components/NotificationSystem';
import ThemeSwitcher, { themes } from '../../components/ThemeSwitcher';
import { censorName } from '../../utils/nameCensor';
import PaydaLogo from '../../components/PaydaLogo';

const SellerDashboard = ({ user, onLogout }) => {
    const [needs, setNeeds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('needs'); // 'coupons' veya 'needs'
    const [activeMenu, setActiveMenu] = useState('dashboard'); // 'dashboard' veya 'reports'
    const [reportData, setReportData] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);
    const [donations, setDonations] = useState([]);
    const [donationsLoading, setDonationsLoading] = useState(false);
    const [myCouponsBackend, setMyCouponsBackend] = useState([]);
    const [couponsLoading, setCouponsLoading] = useState(false);
    const [couponTypeCounts, setCouponTypeCounts] = useState({}); // Kupon tipi başına kupon sayısı
    const [showProfile, setShowProfile] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [toastNotifications, setToastNotifications] = useState([]);
    const [earnings, setEarnings] = useState(null);
    const [earningsLoading, setEarningsLoading] = useState(false);
    const [showCouponCreate, setShowCouponCreate] = useState(false);
    const [couponForm, setCouponForm] = useState({
        name: '',
        amount: '',
        category: 'gıda',
        target_amount: ''
    });
    const [couponCreating, setCouponCreating] = useState(false);
    const [currentTheme, setCurrentTheme] = useState(() => {
        const saved = localStorage.getItem('appTheme') || 'default';
        return themes[saved] || themes.default;
    });

    // Kuponları çekme fonksiyonu (dışarıdan çağrılabilir)
    const fetchCoupons = useCallback(async () => {
        if (!user || !user.id) return;
        
        try {
            setCouponsLoading(true);
            // Bu şirkete ait kuponları çek (user.id merchant_id olarak kullanılabilir)
            const couponsResponse = await fetch(`http://localhost:8080/coupons?merchant_id=${user.id}`);
            const itemsResponse = await fetch(`http://localhost:8080/items?merchant_id=${user.id}`);
            
            let allCoupons = [];
            
            if (couponsResponse.ok) {
                const couponsData = await couponsResponse.json();
                allCoupons = couponsData;
            }
            
            // Kupon tiplerini de ekle (henüz kupon oluşturulmamış olsa bile)
            if (itemsResponse.ok) {
                const itemsData = await itemsResponse.json();
                itemsData.forEach(item => {
                    // Eğer bu kupon tipi için henüz kupon yoksa, placeholder ekle
                    const hasCoupon = allCoupons.some(c => c.coupon_type_id === item.coupon_type_id);
                    if (!hasCoupon) {
                        allCoupons.push({
                            id: `type_${item.coupon_type_id}`,
                            coupon_type_id: item.coupon_type_id,
                            coupon_type_name: item.title,
                            coupon_type_amount: item.totalAmount,
                            coupon_type_category: item.category,
                            merchant_name: item.company,
                            beneficiary_id: null,
                            beneficiary_name: null,
                            status: 'pending', // Havuz dolana kadar beklemede
                            created_at: null,
                            used_at: null,
                            pool_info: {
                                target_amount: item.totalAmount,
                                current_balance: item.collected,
                                is_completed: item.is_completed
                            }
                        });
                    }
                });
            }
            
            setMyCouponsBackend(allCoupons);
            
            // Kupon tiplerini grupla ve sayılarını hesapla
            const counts = {};
            allCoupons.forEach(coupon => {
                const typeId = coupon.coupon_type_id;
                if (typeId) {
                    counts[typeId] = (counts[typeId] || 0) + 1;
                }
            });
            setCouponTypeCounts(counts);
        } catch (error) {
            console.error("Kuponlar çekilemedi:", error);
        } finally {
            setCouponsLoading(false);
        }
    }, [user]);

    // İhtiyaçları ve kuponları backend'den çek
    useEffect(() => {
        if (activeMenu === 'dashboard' && user && user.id) {
            const fetchNeeds = async () => {
                try {
                    setLoading(true);
                    const response = await fetch('http://localhost:8080/needs?status=active');
                    if (response.ok) {
                        const data = await response.json();
                        setNeeds(data);
                    }
                } catch (error) {
                    console.error("İhtiyaçlar çekilemedi:", error);
                } finally {
                    setLoading(false);
                }
            };

            const fetchEarnings = async () => {
                try {
                    setEarningsLoading(true);
                    const response = await fetch(`http://localhost:8080/merchants/${user.id}/earnings`);
                    if (response.ok) {
                        const data = await response.json();
                        setEarnings(data);
                    }
                } catch (error) {
                    console.error("Kazanç bilgileri çekilemedi:", error);
                } finally {
                    setEarningsLoading(false);
                }
            };

            fetchNeeds();
            fetchCoupons();
            fetchEarnings();
        }
    }, [activeMenu, user, fetchCoupons]);

    // Raporları ve bağışları backend'den çek
    useEffect(() => {
        if (activeMenu === 'reports') {
            const fetchReports = async () => {
                try {
                    setReportLoading(true);
                    const response = await fetch('http://localhost:8080/reports/summary');
                    if (response.ok) {
                        const data = await response.json();
                        setReportData(data);
                    }
                } catch (error) {
                    console.error("Raporlar çekilemedi:", error);
                } finally {
                    setReportLoading(false);
                }
            };

            const fetchDonations = async () => {
                try {
                    setDonationsLoading(true);
                    const response = await fetch('http://localhost:8080/donations');
                    if (response.ok) {
                        const data = await response.json();
                        // Tarihe göre sırala (en yeni önce)
                        const sorted = data.sort((a, b) => {
                            const dateA = new Date(a.created_at || 0);
                            const dateB = new Date(b.created_at || 0);
                            return dateB - dateA;
                        });
                        setDonations(sorted);
                    }
                } catch (error) {
                    console.error("Bağışlar çekilemedi:", error);
                } finally {
                    setDonationsLoading(false);
                }
            };

            fetchReports();
            fetchDonations();
        }
    }, [activeMenu]);

    // Bildirim ID'lerini takip et (aynı bildirimin iki kere gönderilmesini önle)
    const notificationIdsRef = useRef(new Set());
    
    // Bildirim ekleme fonksiyonu
    const addNotification = useCallback((title, message, type = 'info', icon = 'fa-info-circle') => {
        // Bildirim için unique key oluştur (title + message - timestamp olmadan)
        const notificationKey = `${title}_${message}`;
        const notificationId = Date.now() + Math.random();
        
        // Eğer bu bildirim son 2 saniye içinde gönderildiyse, tekrar gönderme
        if (notificationIdsRef.current.has(notificationKey)) {
            return;
        }
        
        notificationIdsRef.current.add(notificationKey);
        
        // 2 saniye sonra key'i temizle (aynı bildirim tekrar gönderilebilir)
        setTimeout(() => {
            notificationIdsRef.current.delete(notificationKey);
        }, 2000);
        
        const newNotif = {
            id: notificationId,
            title,
            message,
            type,
            icon,
            read: false,
            created_at: new Date().toISOString()
        };
        setNotifications(prev => [newNotif, ...prev]);
        
        const toastId = notificationId;
        setToastNotifications(prev => [...prev, { id: toastId, ...newNotif }]);
        setTimeout(() => {
            setToastNotifications(prev => prev.filter(t => t.id !== toastId));
        }, 5000);
    }, []);

    // Kupon oluşturma fonksiyonu
    const handleCreateCoupon = async (e) => {
        e.preventDefault();
        if (!user || !user.id) {
            addNotification('Hata', 'Kullanıcı bilgisi bulunamadı', 'error', 'fa-exclamation-circle');
            return;
        }

        setCouponCreating(true);
        try {
            const response = await fetch('http://localhost:8080/coupon-types', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    merchant_id: user.id,
                    name: couponForm.name,
                    amount: parseFloat(couponForm.amount),
                    category: couponForm.category,
                    target_amount: parseFloat(couponForm.target_amount)
                })
            });

            const data = await response.json();

            if (response.ok) {
                addNotification('Başarılı', 'Kupon tipi başarıyla oluşturuldu!', 'success', 'fa-check-circle');
                setCouponForm({ name: '', amount: '', category: 'gıda', target_amount: '' });
                setShowCouponCreate(false);
                
                // Kısa bir gecikme ile kuponları yeniden yükle (backend işlemi tamamlansın)
                setTimeout(() => {
                    fetchCoupons();
                }, 500);
            } else {
                addNotification('Hata', data.detail || 'Kupon oluşturulamadı', 'error', 'fa-exclamation-circle');
            }
        } catch (error) {
            console.error('Kupon oluşturma hatası:', error);
            addNotification('Hata', 'Kupon oluşturulurken bir hata oluştu', 'error', 'fa-exclamation-circle');
        } finally {
            setCouponCreating(false);
        }
    };

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const clearAllNotifications = () => {
        setNotifications([]);
    };

    useEffect(() => {
        if (user && user.id) {
            // Sadece bir kere gönder (React StrictMode için)
            const timer = setTimeout(() => {
                addNotification('Hoş Geldiniz!', 'İşletme paneline hoş geldiniz. Kuponlarınızı ve raporlarınızı yönetebilirsiniz.', 'success', 'fa-store');
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [user, addNotification]);

    // user kontrolü - eğer user yoksa loading göster
    if (!user) {
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

    if (showProfile) {
        return (
            <UserProfile
                user={user}
                onBack={() => setShowProfile(false)}
                onUpdate={(updatedUser) => {
                    addNotification('Profil Güncellendi', 'Profil bilgileriniz başarıyla güncellendi.', 'success', 'fa-check-circle');
                }}
            />
        );
    }

    if (showSettings) {
        return (
            <UserSettings
                user={user}
                onBack={() => setShowSettings(false)}
            />
        );
    }

    return (
        <div className="dashboard-layout" style={{ background: currentTheme.secondary, minHeight: '100vh' }}>
            <nav className="sidebar" style={{
                background: currentTheme.sidebar,
                boxShadow: '4px 0 20px rgba(0,0,0,0.1)'
            }}>
                <div className="brand" style={{
                    background: 'rgba(255,255,255,0.1)',
                    padding: '20px',
                    borderRadius: '12px',
                    marginBottom: '30px',
                    backdropFilter: 'blur(10px)',
                    color: 'white'
                }}>
                    <i className="fas fa-store" style={{ 
                        color: '#4facfe', 
                        fontSize: '28px',
                        marginRight: '10px'
                    }}></i>
                    <PaydaLogo size={35} showText={true} onClick={onLogout} darkBackground={true} />
                    <small style={{ 
                        fontSize: '12px', 
                        opacity: 0.8,
                        display: 'block',
                        marginTop: '5px'
                    }}>Business</small>
                </div>
                <div className="menu-items">
                    <div 
                        className={`menu-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveMenu('dashboard')}
                        style={{ 
                            cursor: 'pointer',
                            color: 'white',
                            background: activeMenu === 'dashboard' ? 'rgba(255,255,255,0.2)' : 'transparent',
                            borderRadius: '12px',
                            marginBottom: '8px',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <i className="fas fa-home"></i> Dashboard
                    </div>
                    <div 
                        className={`menu-item ${activeMenu === 'reports' ? 'active' : ''}`}
                        onClick={() => setActiveMenu('reports')}
                        style={{ 
                            cursor: 'pointer',
                            color: 'white',
                            background: activeMenu === 'reports' ? 'rgba(255,255,255,0.2)' : 'transparent',
                            borderRadius: '12px',
                            marginBottom: '8px',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <i className="fas fa-chart-line"></i> Raporlar
                    </div>
                    <div className="menu-item" onClick={() => setShowProfile(true)} style={{
                        borderRadius: '12px',
                        marginBottom: '8px',
                        transition: 'all 0.3s ease',
                        color: 'white',
                        cursor: 'pointer'
                    }}>
                        <i className="fas fa-user-circle"></i>
                        <span>Profil</span>
                    </div>
                    <div className="menu-item" onClick={() => setShowSettings(true)} style={{
                        borderRadius: '12px',
                        marginBottom: '8px',
                        transition: 'all 0.3s ease',
                        color: 'white',
                        cursor: 'pointer'
                    }}>
                        <i className="fas fa-cog"></i>
                        <span>Ayarlar</span>
                    </div>
                    <div className="menu-item logout-btn" onClick={onLogout} style={{ 
                        cursor: 'pointer',
                        borderRadius: '12px',
                        marginTop: 'auto',
                        background: 'rgba(255,255,255,0.2)',
                        transition: 'all 0.3s ease',
                        color: 'white'
                    }}>
                        <i className="fas fa-sign-out-alt"></i> Çıkış
                    </div>
                </div>
            </nav>

            <main className="main-content" style={{ 
                background: 'transparent',
                padding: '30px'
            }}>
                <header style={{
                    background: currentTheme.primary,
                    padding: '25px 30px',
                    borderRadius: '16px',
                    marginBottom: '25px',
                    boxShadow: `0 8px 24px ${currentTheme.accent}40`,
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
                            İşletme Paneli
                        </h2>
                        <p style={{ 
                            margin: '8px 0 0 0', 
                            fontSize: '14px', 
                            opacity: 0.9,
                            color: 'white'
                        }}>
                            Hoş geldin, <strong>{user?.name || 'Kullanıcı'}</strong>
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        {activeMenu === 'dashboard' && (
                            <button
                                onClick={() => setShowCouponCreate(true)}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    backdropFilter: 'blur(10px)',
                                    border: '2px solid rgba(255,255,255,0.3)',
                                    padding: '12px 20px',
                                    borderRadius: '25px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: 'white',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                            >
                                <i className="fas fa-plus-circle"></i>
                                Kupon Aç
                            </button>
                        )}
                        <ThemeSwitcher onThemeChange={setCurrentTheme} />
                        <NotificationSystem
                            notifications={notifications}
                            onMarkAsRead={markAsRead}
                            onClearAll={clearAllNotifications}
                        />
                        <button
                            onClick={() => setShowProfile(true)}
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                backdropFilter: 'blur(10px)',
                                border: '2px solid rgba(255,255,255,0.3)',
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                                color: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'İ'}
                        </button>
                    </div>
                </header>

                {/* Toast Bildirimleri */}
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    zIndex: 10000,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                }}>
                    {toastNotifications.map(toast => (
                        <div
                            key={toast.id}
                            style={{
                                background: toast.type === 'success' 
                                    ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'
                                    : toast.type === 'error'
                                    ? 'linear-gradient(135deg, #dc3545 0%, #ff6b6b 100%)'
                                    : 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
                                color: 'white',
                                padding: '15px 20px',
                                borderRadius: '12px',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                                minWidth: '300px',
                                animation: 'slideInRight 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}
                        >
                            <i className={`fas ${toast.icon}`} style={{ fontSize: '20px' }}></i>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '700', marginBottom: '4px' }}>{toast.title}</div>
                                <div style={{ fontSize: '13px', opacity: 0.9 }}>{toast.message}</div>
                            </div>
                            <button
                                onClick={() => setToastNotifications(prev => prev.filter(t => t.id !== toast.id))}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    color: 'white',
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px'
                                }}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>

                {/* Kazanç Bilgileri - Sadece Dashboard'da göster */}
                {activeMenu === 'dashboard' && earnings && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '20px',
                        marginBottom: '30px'
                    }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            padding: '25px',
                            borderRadius: '16px',
                            color: 'white',
                            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                                <i className="fas fa-coins" style={{ fontSize: '32px', opacity: 0.9 }}></i>
                                <div>
                                    <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '5px' }}>Günlük Kazanç</div>
                                    <div style={{ fontSize: '28px', fontWeight: '700' }}>₺{earnings.daily_earnings.toFixed(2)}</div>
                                </div>
                            </div>
                            <div style={{ fontSize: '13px', opacity: 0.9 }}>
                                Limit: ₺{earnings.daily_limit.toFixed(2)} / Kalan: ₺{earnings.remaining_limit.toFixed(2)}
                            </div>
                        </div>

                        <div style={{
                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                            padding: '25px',
                            borderRadius: '16px',
                            color: 'white',
                            boxShadow: '0 8px 24px rgba(245, 87, 108, 0.3)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                                <i className="fas fa-chart-line" style={{ fontSize: '32px', opacity: 0.9 }}></i>
                                <div>
                                    <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '5px' }}>Toplam Kazanç</div>
                                    <div style={{ fontSize: '28px', fontWeight: '700' }}>₺{earnings.total_earnings.toFixed(2)}</div>
                                </div>
                            </div>
                            <div style={{ fontSize: '13px', opacity: 0.9 }}>
                                Tüm zamanlar
                            </div>
                        </div>

                        <div style={{
                            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                            padding: '25px',
                            borderRadius: '16px',
                            color: 'white',
                            boxShadow: '0 8px 24px rgba(79, 172, 254, 0.3)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                                <i className="fas fa-hand-holding-heart" style={{ fontSize: '32px', opacity: 0.9 }}></i>
                                <div>
                                    <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '5px' }}>Geri Bağış</div>
                                    <div style={{ fontSize: '28px', fontWeight: '700' }}>₺{earnings.total_donated_back.toFixed(2)}</div>
                                </div>
                            </div>
                            <div style={{ fontSize: '13px', opacity: 0.9 }}>
                                Kazancın %{earnings.backflow_rate.toFixed(0)}'u
                            </div>
                        </div>

                        <div style={{
                            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                            padding: '25px',
                            borderRadius: '16px',
                            color: 'white',
                            boxShadow: '0 8px 24px rgba(67, 233, 123, 0.3)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                                <i className="fas fa-wallet" style={{ fontSize: '32px', opacity: 0.9 }}></i>
                                <div>
                                    <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '5px' }}>Bakiye</div>
                                    <div style={{ fontSize: '28px', fontWeight: '700' }}>₺{earnings.merchant_balance.toFixed(2)}</div>
                                </div>
                            </div>
                            <div style={{ fontSize: '13px', opacity: 0.9 }}>
                                Mevcut bakiye
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab Sistemi - Sadece Dashboard'da göster */}
                {activeMenu === 'dashboard' && (
                    <div style={{ 
                        display: 'flex', 
                        gap: '0',
                        marginBottom: '30px',
                        background: 'white',
                        borderRadius: '12px',
                        padding: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    }}>
                        <button
                            onClick={() => setActiveTab('needs')}
                            style={{
                                flex: 1,
                                padding: '15px 25px',
                                border: 'none',
                                background: activeTab === 'needs' ? 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)' : 'transparent',
                                color: activeTab === 'needs' ? 'white' : '#666',
                                cursor: 'pointer',
                                borderRadius: '8px',
                                fontWeight: '600',
                                fontSize: '15px',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: activeTab === 'needs' ? '0 4px 12px rgba(44, 62, 80, 0.3)' : 'none'
                            }}
                        >
                            <i className="fas fa-bullhorn"></i>
                            <span>İhtiyaçlar</span>
                            {needs.length > 0 && (
                                <span style={{
                                    background: activeTab === 'needs' ? 'rgba(255,255,255,0.3)' : '#2c3e50',
                                    color: activeTab === 'needs' ? 'white' : 'white',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}>
                                    {needs.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('coupons')}
                            style={{
                                flex: 1,
                                padding: '15px 25px',
                                border: 'none',
                                background: activeTab === 'coupons' ? 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)' : 'transparent',
                                color: activeTab === 'coupons' ? 'white' : '#666',
                                cursor: 'pointer',
                                borderRadius: '8px',
                                fontWeight: '600',
                                fontSize: '15px',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: activeTab === 'coupons' ? '0 4px 12px rgba(44, 62, 80, 0.3)' : 'none'
                            }}
                        >
                            <i className="fas fa-ticket-alt"></i>
                            <span>Kuponlarım</span>
                            {myCouponsBackend.length > 0 && (
                                <span style={{
                                    background: activeTab === 'coupons' ? 'rgba(255,255,255,0.3)' : '#2c3e50',
                                    color: activeTab === 'coupons' ? 'white' : 'white',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}>
                                    {myCouponsBackend.length}
                                </span>
                            )}
                        </button>
                    </div>
                )}

                <section>
                    {activeMenu === 'reports' ? (
                        <div>
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                marginBottom: '25px'
                            }}>
                                <h3 style={{ 
                                    margin: 0, 
                                    color: '#2c3e50', 
                                    fontSize: '22px', 
                                    fontWeight: '700',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}>
                                    <i className="fas fa-chart-line" style={{ color: '#2c3e50' }}></i>
                                    Platform Raporları
                                </h3>
                            </div>

                            {reportLoading ? (
                                <div style={{ 
                                    textAlign: 'center', 
                                    marginTop: '50px', 
                                    padding: '40px',
                                    background: 'white',
                                    borderRadius: '12px',
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                                }}>
                                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: '#2c3e50', marginBottom: '15px' }}></i>
                                    <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
                                        Raporlar yükleniyor...
                                    </p>
                                </div>
                            ) : reportData ? (
                                <div>
                                    {/* İstatistik Kartları */}
                                    <div className="product-grid" style={{ 
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                                        marginBottom: '30px'
                                    }}>
                                        <div className="product-card" style={{
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            color: 'white',
                                            border: 'none'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                                                <i className="fas fa-users" style={{ fontSize: '32px', opacity: 0.9 }}></i>
                                                <div>
                                                    <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '5px' }}>Toplam Kullanıcı</div>
                                                    <div style={{ fontSize: '28px', fontWeight: '700' }}>{reportData.total_users}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="product-card" style={{
                                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                            color: 'white',
                                            border: 'none'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                                                <i className="fas fa-heart" style={{ fontSize: '32px', opacity: 0.9 }}></i>
                                                <div>
                                                    <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '5px' }}>Toplam Bağışçı</div>
                                                    <div style={{ fontSize: '28px', fontWeight: '700' }}>{reportData.total_donors}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="product-card" style={{
                                            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                            color: 'white',
                                            border: 'none'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                                                <i className="fas fa-hand-holding-heart" style={{ fontSize: '32px', opacity: 0.9 }}></i>
                                                <div>
                                                    <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '5px' }}>İhtiyaç Sahibi</div>
                                                    <div style={{ fontSize: '28px', fontWeight: '700' }}>{reportData.total_beneficiaries}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="product-card" style={{
                                            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                                            color: 'white',
                                            border: 'none'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                                                <i className="fas fa-store" style={{ fontSize: '32px', opacity: 0.9 }}></i>
                                                <div>
                                                    <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '5px' }}>Toplam İşletme</div>
                                                    <div style={{ fontSize: '28px', fontWeight: '700' }}>{reportData.total_merchants}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="product-card" style={{
                                            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                                            color: 'white',
                                            border: 'none'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                                                <i className="fas fa-lira-sign" style={{ fontSize: '32px', opacity: 0.9 }}></i>
                                                <div>
                                                    <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '5px' }}>Toplam Bağış</div>
                                                    <div style={{ fontSize: '28px', fontWeight: '700' }}>
                                                        ₺{reportData.total_donations_amount?.toFixed(2) || '0.00'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="product-card" style={{
                                            background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
                                            color: 'white',
                                            border: 'none'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                                                <i className="fas fa-ticket-alt" style={{ fontSize: '32px', opacity: 0.9 }}></i>
                                                <div>
                                                    <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '5px' }}>Toplam Kupon</div>
                                                    <div style={{ fontSize: '28px', fontWeight: '700' }}>{reportData.total_coupons}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detaylı Kullanıcı Listesi */}
                                    {reportData.users_list && reportData.users_list.length > 0 && (
                                        <div style={{
                                            background: 'white',
                                            borderRadius: '12px',
                                            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                                            padding: '25px',
                                            marginTop: '20px'
                                        }}>
                                            <h4 style={{ 
                                                margin: '0 0 20px 0', 
                                                color: '#2c3e50',
                                                fontSize: '18px',
                                                fontWeight: '700',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px'
                                            }}>
                                                <i className="fas fa-list"></i>
                                                Kullanıcı Listesi ({reportData.users_list.length})
                                            </h4>
                                            <div style={{
                                                maxHeight: '500px',
                                                overflowY: 'auto'
                                            }}>
                                                <table style={{
                                                    width: '100%',
                                                    borderCollapse: 'collapse'
                                                }}>
                                                    <thead style={{
                                                        background: '#f8f9fa',
                                                        position: 'sticky',
                                                        top: 0,
                                                        zIndex: 10
                                                    }}>
                                                        <tr>
                                                            <th style={{ 
                                                                padding: '12px', 
                                                                textAlign: 'left', 
                                                                fontWeight: '600',
                                                                color: '#2c3e50',
                                                                fontSize: '13px',
                                                                borderBottom: '2px solid #e0e0e0'
                                                            }}>
                                                                ID
                                                            </th>
                                                            <th style={{ 
                                                                padding: '12px', 
                                                                textAlign: 'left', 
                                                                fontWeight: '600',
                                                                color: '#2c3e50',
                                                                fontSize: '13px',
                                                                borderBottom: '2px solid #e0e0e0'
                                                            }}>
                                                                Ad
                                                            </th>
                                                            <th style={{ 
                                                                padding: '12px', 
                                                                textAlign: 'left', 
                                                                fontWeight: '600',
                                                                color: '#2c3e50',
                                                                fontSize: '13px',
                                                                borderBottom: '2px solid #e0e0e0'
                                                            }}>
                                                                Rol
                                                            </th>
                                                            <th style={{ 
                                                                padding: '12px', 
                                                                textAlign: 'right', 
                                                                fontWeight: '600',
                                                                color: '#2c3e50',
                                                                fontSize: '13px',
                                                                borderBottom: '2px solid #e0e0e0'
                                                            }}>
                                                                Bakiye
                                                            </th>
                                                            <th style={{ 
                                                                padding: '12px', 
                                                                textAlign: 'center', 
                                                                fontWeight: '600',
                                                                color: '#2c3e50',
                                                                fontSize: '13px',
                                                                borderBottom: '2px solid #e0e0e0'
                                                            }}>
                                                                Durum
                                                            </th>
                            </tr>
                        </thead>
                        <tbody>
                                                        {reportData.users_list.map((u, index) => (
                                                            <tr key={u.id} style={{
                                                                borderBottom: index < reportData.users_list.length - 1 ? '1px solid #f0f0f0' : 'none',
                                                                transition: 'background 0.2s ease'
                                                            }}>
                                                                <td style={{ padding: '12px', color: '#666', fontSize: '13px' }}>
                                                                    #{u.id}
                                    </td>
                                                                <td style={{ padding: '12px', fontWeight: '600', color: '#2c3e50', fontSize: '13px' }}>
                                                                    {u.role === 'donor' ? censorName(u.name) : u.name}
                                                                </td>
                                                                <td style={{ padding: '12px' }}>
                                                                    <span style={{
                                                                        background: u.role === 'merchant' ? '#e8f4f8' : 
                                                                                   u.role === 'donor' ? '#ffeaea' : 
                                                                                   '#f0f7ff',
                                                                        color: u.role === 'merchant' ? '#2c3e50' : 
                                                                               u.role === 'donor' ? '#dc3545' : 
                                                                               '#007bff',
                                                                        padding: '4px 10px',
                                                                        borderRadius: '12px',
                                                                        fontSize: '11px',
                                                                        fontWeight: '600',
                                                                        textTransform: 'capitalize'
                                                                    }}>
                                                                        {u.role === 'merchant' ? 'İşletme' : 
                                                                         u.role === 'donor' ? 'Bağışçı' : 
                                                                         u.role === 'beneficiary' ? 'İhtiyaç Sahibi' : u.role}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#28a745', fontSize: '13px' }}>
                                                                    ₺{u.balance?.toFixed(2) || '0.00'}
                                                                </td>
                                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                    {u.is_verified ? (
                                                                        <span style={{
                                                                            background: '#d4edda',
                                                                            color: '#155724',
                                                                            padding: '4px 10px',
                                                                            borderRadius: '12px',
                                                                            fontSize: '11px',
                                                                            fontWeight: '600'
                                                                        }}>
                                                                            ✓ Doğrulanmış
                                                                        </span>
                                                                    ) : (
                                                                        <span style={{
                                                                            background: '#fff3cd',
                                                                            color: '#856404',
                                                                            padding: '4px 10px',
                                                                            borderRadius: '12px',
                                                                            fontSize: '11px',
                                                                            fontWeight: '600'
                                                                        }}>
                                                                            ⏳ Beklemede
                                                                        </span>
                                                                    )}
                                                                </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Bağış Geçmişi */}
                                    <div style={{
                                        background: 'white',
                                        borderRadius: '12px',
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                                        padding: '25px',
                                        marginTop: '30px'
                                    }}>
                                        <h4 style={{ 
                                            margin: '0 0 20px 0', 
                                            color: '#2c3e50',
                                            fontSize: '18px',
                                            fontWeight: '700',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px'
                                        }}>
                                            <i className="fas fa-history"></i>
                                            Yardım Geçmişi ({donations.length})
                                        </h4>
                                        
                                        {donationsLoading ? (
                                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                                <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: '#2c3e50', marginBottom: '10px' }}></i>
                                                <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>Yükleniyor...</p>
                                            </div>
                                        ) : donations.length === 0 ? (
                                            <div style={{ 
                                                textAlign: 'center', 
                                                padding: '40px',
                                                color: '#999'
                                            }}>
                                                <i className="fas fa-inbox" style={{ fontSize: '32px', marginBottom: '10px', display: 'block' }}></i>
                                                <p style={{ margin: 0, fontSize: '14px' }}>
                                                    Henüz bağış kaydı bulunmamaktadır.
                                                </p>
                                            </div>
                                        ) : (
                                            <div style={{
                                                maxHeight: '500px',
                                                overflowY: 'auto'
                                            }}>
                                                <table style={{
                                                    width: '100%',
                                                    borderCollapse: 'collapse'
                                                }}>
                                                    <thead style={{
                                                        background: '#f8f9fa',
                                                        position: 'sticky',
                                                        top: 0,
                                                        zIndex: 10
                                                    }}>
                                                        <tr>
                                                            <th style={{ 
                                                                padding: '12px', 
                                                                textAlign: 'left', 
                                                                fontWeight: '600',
                                                                color: '#2c3e50',
                                                                fontSize: '13px',
                                                                borderBottom: '2px solid #e0e0e0'
                                                            }}>
                                                                Tarih
                                                            </th>
                                                            <th style={{ 
                                                                padding: '12px', 
                                                                textAlign: 'left', 
                                                                fontWeight: '600',
                                                                color: '#2c3e50',
                                                                fontSize: '13px',
                                                                borderBottom: '2px solid #e0e0e0'
                                                            }}>
                                                                Bağışçı ID
                                                            </th>
                                                            <th style={{ 
                                                                padding: '12px', 
                                                                textAlign: 'left', 
                                                                fontWeight: '600',
                                                                color: '#2c3e50',
                                                                fontSize: '13px',
                                                                borderBottom: '2px solid #e0e0e0'
                                                            }}>
                                                                Kategori
                                                            </th>
                                                            <th style={{ 
                                                                padding: '12px', 
                                                                textAlign: 'right', 
                                                                fontWeight: '600',
                                                                color: '#2c3e50',
                                                                fontSize: '13px',
                                                                borderBottom: '2px solid #e0e0e0'
                                                            }}>
                                                                Tutar
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
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
                                                                <tr key={donation.id} style={{
                                                                    borderBottom: index < donations.length - 1 ? '1px solid #f0f0f0' : 'none',
                                                                    transition: 'background 0.2s ease'
                                                                }}>
                                                                    <td style={{ 
                                                                        padding: '12px', 
                                                                        color: '#666', 
                                                                        fontSize: '13px' 
                                                                    }}>
                                                                        {formattedDate}
                                                                    </td>
                                                                    <td style={{ 
                                                                        padding: '12px',
                                                                    }}>
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
                                                                    </td>
                                                                    <td style={{ 
                                                                        padding: '12px',
                                                                    }}>
                                                                        {donation.coupon_type_id ? (
                                                                            <span style={{
                                                                                background: '#f0f7ff',
                                                                                color: '#007bff',
                                                                                padding: '4px 10px',
                                                                                borderRadius: '12px',
                                                                                fontSize: '11px',
                                                                                fontWeight: '600'
                                                                            }}>
                                                                                Kupon #{donation.coupon_type_id}
                                                                            </span>
                                                                        ) : (
                                                                            <span style={{
                                                                                background: '#fff3cd',
                                                                                color: '#856404',
                                                                                padding: '4px 10px',
                                                                                borderRadius: '12px',
                                                                                fontSize: '11px',
                                                                                fontWeight: '600'
                                                                            }}>
                                                                                Genel Bağış
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td style={{ 
                                                                        padding: '12px', 
                                                                        textAlign: 'right', 
                                                                        fontWeight: '700', 
                                                                        color: '#28a745', 
                                                                        fontSize: '14px' 
                                                                    }}>
                                                                        ₺{donation.amount?.toFixed(2) || '0.00'}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ 
                                    textAlign: 'center', 
                                    padding: '60px 20px',
                                    background: 'white',
                                    borderRadius: '12px',
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                                }}>
                                    <i className="fas fa-exclamation-triangle" style={{ fontSize: '48px', color: '#ddd', marginBottom: '15px' }}></i>
                                    <p style={{ color: '#999', margin: 0, fontSize: '16px' }}>
                                        Rapor verileri yüklenemedi.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : activeMenu === 'dashboard' ? (
                        <>
                            {loading ? (
                                <div style={{ 
                                    textAlign: 'center', 
                                    marginTop: '50px', 
                                    padding: '40px',
                                    background: 'white',
                                    borderRadius: '12px',
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                                }}>
                                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: '#2c3e50', marginBottom: '15px' }}></i>
                                    <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
                                        Yükleniyor, lütfen bekleyin...
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {activeTab === 'needs' ? (
                                <div>
                                    <div style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        marginBottom: '25px'
                                    }}>
                                        <h3 style={{ 
                                            margin: 0, 
                                            color: '#2c3e50', 
                                            fontSize: '22px', 
                                            fontWeight: '700',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px'
                                        }}>
                                            <i className="fas fa-bullhorn" style={{ color: '#2c3e50' }}></i>
                                            Aktif İhtiyaçlar
                                        </h3>
                                        <span style={{
                                            background: '#e8f4f8',
                                            color: '#2c3e50',
                                            padding: '6px 14px',
                                            borderRadius: '20px',
                                            fontSize: '13px',
                                            fontWeight: '600'
                                        }}>
                                            {needs.length} İhtiyaç
                                        </span>
                                    </div>
                                    {needs.length === 0 ? (
                                        <div style={{ 
                                            textAlign: 'center', 
                                            padding: '60px 20px',
                                            background: 'white',
                                            borderRadius: '12px',
                                            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                                        }}>
                                            <i className="fas fa-inbox" style={{ fontSize: '48px', color: '#ddd', marginBottom: '15px' }}></i>
                                            <p style={{ color: '#999', margin: 0, fontSize: '16px' }}>
                                                Henüz aktif ihtiyaç bulunmamaktadır.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="product-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
                                            {needs.map(need => {
                                                const remaining = need.target_amount - need.current_amount;
                                                const progress = need.progress || 0;
                                                
                                                return (
                                                    <div key={need.id} className="product-card" style={{
                                                        background: 'white',
                                                        borderRadius: '16px',
                                                        padding: '25px',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                                        border: '1px solid #f0f0f0',
                                                        transition: 'all 0.3s ease'
                                                    }}>
                                                        <div className="card-header" style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            marginBottom: '15px'
                                                        }}>
                                                            <span className="company-badge" style={{
                                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                                color: 'white',
                                                                padding: '8px 16px',
                                                                borderRadius: '20px',
                                                                fontSize: '12px',
                                                                fontWeight: '600',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '6px'
                                                            }}>
                                                                <i className="fas fa-user"></i> {need.user_name || 'Kullanıcı'}
                                                            </span>
                                                            <span className="category-tag" style={{
                                                                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                                                                color: '#2c3e50',
                                                                padding: '6px 12px',
                                                                borderRadius: '12px',
                                                                fontSize: '11px',
                                                                fontWeight: '600',
                                                                textTransform: 'uppercase'
                                                            }}>
                                                                {need.category || 'Genel'}
                                                            </span>
                                                        </div>

                                                        <h4 style={{
                                                            margin: '0 0 12px 0',
                                                            color: '#2c3e50',
                                                            fontSize: '20px',
                                                            fontWeight: '700'
                                                        }}>
                                                            {need.title}
                                                        </h4>

                                                        <p style={{
                                                            color: '#666',
                                                            fontSize: '14px',
                                                            margin: '0 0 15px 0',
                                                            lineHeight: '1.6',
                                                            minHeight: '40px'
                                                        }}>
                                                            {need.description || 'Açıklama yok'}
                                                        </p>

                                                        <div className="progress-area" style={{ 
                                                            marginBottom: '15px',
                                                            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                                                            padding: '15px',
                                                            borderRadius: '12px'
                                                        }}>
                                                            <div style={{ 
                                                                display: 'flex', 
                                                                justifyContent: 'space-between',
                                                                marginBottom: '10px',
                                                                fontSize: '13px',
                                                                color: '#666',
                                                                fontWeight: '600'
                                                            }}>
                                                                <span>İlerleme</span>
                                                                <span style={{ fontWeight: '700', color: '#2c3e50' }}>
                                                                    {Math.round(progress)}%
                                                                </span>
                                                            </div>
                                                            <div className="progress-bar-bg" style={{
                                                                height: '12px',
                                                                borderRadius: '10px',
                                                                overflow: 'hidden',
                                                                background: '#e0e0e0'
                                                            }}>
                                                                <div className="progress-fill" style={{ 
                                                                    width: `${progress}%`, 
                                                                    height: '100%',
                                                                    background: 'linear-gradient(90deg, #2c3e50 0%, #34495e 100%)',
                                                                    transition: 'width 0.3s ease'
                                                                }}></div>
                                                            </div>
                                                            <div className="price-info" style={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                marginTop: '12px',
                                                                fontSize: '14px'
                                                            }}>
                                                                <span style={{ color: '#28a745', fontWeight: '700' }}>
                                                                    Toplanan: ₺{need.current_amount.toFixed(2)}
                                                                </span>
                                                                <span style={{ color: '#dc3545', fontWeight: '700' }}>
                                                                    Kalan: ₺{remaining.toFixed(2)}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            marginTop: '15px',
                                                            paddingTop: '15px',
                                                            borderTop: '2px solid #f0f0f0'
                                                        }}>
                                                            <span style={{
                                                                background: need.status === 'completed' 
                                                                    ? 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)' 
                                                                    : 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
                                                                color: need.status === 'completed' ? '#155724' : '#856404',
                                                                padding: '8px 16px',
                                                                borderRadius: '20px',
                                                                fontSize: '12px',
                                                                fontWeight: '600',
                                                                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                                                            }}>
                                                                {need.status === 'completed' ? '✓ Tamamlandı' : '⏳ Aktif'}
                                                            </span>
                                                            <button className="card-btn" style={{
                                                                background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
                                                                color: 'white',
                                                                border: 'none',
                                                                padding: '10px 24px',
                                                                borderRadius: '25px',
                                                                cursor: 'pointer',
                                                                fontSize: '14px',
                                                                fontWeight: '600',
                                                                transition: 'all 0.3s ease',
                                                                boxShadow: '0 4px 12px rgba(44, 62, 80, 0.3)'
                                                            }}>
                                                                <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
                                                                Detayları Gör
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <div style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        marginBottom: '25px'
                                    }}>
                                        <h3 style={{ 
                                            margin: 0, 
                                            color: '#2c3e50', 
                                            fontSize: '22px', 
                                            fontWeight: '700',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px'
                                        }}>
                                            <i className="fas fa-ticket-alt" style={{ color: '#2c3e50' }}></i>
                                            Aktif Kuponlarınız
                                        </h3>
                                        <span style={{
                                            background: '#e8f4f8',
                                            color: '#2c3e50',
                                            padding: '6px 14px',
                                            borderRadius: '20px',
                                            fontSize: '13px',
                                            fontWeight: '600'
                                        }}>
                                            {myCouponsBackend.length} Kupon
                                        </span>
                                    </div>
                                    <div style={{
                                        background: 'white',
                                        borderRadius: '12px',
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                                        overflow: 'hidden'
                                    }}>
                                        <table className="seller-table" style={{
                                            width: '100%',
                                            borderCollapse: 'collapse'
                                        }}>
                                            <thead style={{
                                                background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
                                                color: 'white'
                                            }}>
                                                <tr>
                                                    <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Kupon Adı</th>
                                                    <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Değer</th>
                                                    <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>İhtiyaç Sahibi</th>
                                                    <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600' }}>Durum</th>
                                                    <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Oluşturulma</th>
                                                    <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Kullanım</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {myCouponsBackend.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="6" style={{ 
                                                            padding: '40px', 
                                                            textAlign: 'center', 
                                                            color: '#999' 
                                                        }}>
                                                            <i className="fas fa-inbox" style={{ fontSize: '32px', marginBottom: '10px', display: 'block' }}></i>
                                                            Henüz kuponunuz bulunmamaktadır.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    myCouponsBackend.map((coupon, index) => {
                                                        const createdDate = coupon.created_at ? new Date(coupon.created_at).toLocaleDateString('tr-TR') : '-';
                                                        const usedDate = coupon.used_at ? new Date(coupon.used_at).toLocaleDateString('tr-TR') : '-';

                                                        return (
                                                            <tr key={coupon.id} style={{
                                                                borderBottom: index < myCouponsBackend.length - 1 ? '1px solid #f0f0f0' : 'none',
                                                                transition: 'background 0.2s ease'
                                                            }}>
                                                                <td style={{ padding: '15px', fontWeight: '600', color: '#2c3e50' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                        <span>{coupon.coupon_type_name || 'Kupon'}</span>
                                                                        {coupon.coupon_type_id && couponTypeCounts[coupon.coupon_type_id] && (
                                                                            <span style={{
                                                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                                                color: 'white',
                                                                                padding: '4px 10px',
                                                                                borderRadius: '12px',
                                                                                fontSize: '11px',
                                                                                fontWeight: '600'
                                                                            }}>
                                                                                <i className="fas fa-ticket-alt" style={{ marginRight: '4px' }}></i>
                                                                                {couponTypeCounts[coupon.coupon_type_id]} adet
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: '15px', fontWeight: '600', color: '#28a745' }}>
                                                                    ₺{coupon.coupon_type_amount || 0}
                                                                </td>
                                                                <td style={{ padding: '15px', color: '#666' }}>
                                                                    {coupon.beneficiary_name ? (
                                                                        <span style={{
                                                                            background: '#e8f4f8',
                                                                            color: '#2c3e50',
                                                                            padding: '4px 10px',
                                                                            borderRadius: '12px',
                                                                            fontSize: '11px',
                                                                            fontWeight: '600'
                                                                        }}>
                                                                            {coupon.beneficiary_name}
                                                                        </span>
                                                                    ) : (
                                                                        <span style={{ color: '#999', fontSize: '13px' }}>Atanmadı</span>
                                                                    )}
                                                                </td>
                                                                <td style={{ padding: '15px', textAlign: 'center' }}>
                                                                    {coupon.status === 'used' ? (
                                                                        <span style={{
                                                                            background: '#d4edda',
                                                                            color: '#155724',
                                                                            padding: '6px 12px',
                                                                            borderRadius: '20px',
                                                                            fontSize: '12px',
                                                                            fontWeight: '600'
                                                                        }}>
                                                                            ✓ Kullanıldı
                                                                        </span>
                                                                    ) : coupon.status === 'assigned' ? (
                                                                        <span style={{
                                                                            background: '#fff3cd',
                                                                            color: '#856404',
                                                                            padding: '6px 12px',
                                                                            borderRadius: '20px',
                                                                            fontSize: '12px',
                                                                            fontWeight: '600'
                                                                        }}>
                                                                            ⏳ Atandı
                                                                        </span>
                                                                    ) : coupon.status === 'pending' ? (
                                                                        <span style={{
                                                                            background: '#e3f2fd',
                                                                            color: '#1565c0',
                                                                            padding: '6px 12px',
                                                                            borderRadius: '20px',
                                                                            fontSize: '12px',
                                                                            fontWeight: '600'
                                                                        }}>
                                                                            ⏳ Havuz Doluyor
                                                                        </span>
                                                                    ) : (
                                                                        <span style={{
                                                                            background: '#e8f4f8',
                                                                            color: '#2c3e50',
                                                                            padding: '6px 12px',
                                                                            borderRadius: '20px',
                                                                            fontSize: '12px',
                                                                            fontWeight: '600'
                                                                        }}>
                                                                            📋 Oluşturuldu
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td style={{ padding: '15px', color: '#666', fontSize: '13px' }}>
                                                                    {coupon.status === 'pending' ? (
                                                                        <span style={{ color: '#999', fontStyle: 'italic' }}>
                                                                            Havuz dolduğunda oluşturulacak
                                                                        </span>
                                                                    ) : createdDate}
                                                                </td>
                                                                <td style={{ padding: '15px', color: '#666', fontSize: '13px' }}>
                                                                    {coupon.status === 'pending' ? (
                                                                        <span style={{ color: '#999', fontStyle: 'italic' }}>
                                                                            -
                                                                        </span>
                                                                    ) : usedDate !== '-' ? usedDate : '-'}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                        </tbody>
                    </table>
                                    </div>
                                </div>
                            )}
                                </>
                            )}
                        </>
                    ) : null}
                </section>
            </main>

            {/* Kupon Açma Modalı */}
            {showCouponCreate && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000,
                    backdropFilter: 'blur(5px)'
                }}
                onClick={() => setShowCouponCreate(false)}
                >
                    <div style={{
                        background: 'white',
                        borderRadius: '20px',
                        padding: '40px',
                        maxWidth: '500px',
                        width: '90%',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                        position: 'relative'
                    }}
                    onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowCouponCreate(false)}
                            style={{
                                position: 'absolute',
                                top: '15px',
                                right: '15px',
                                background: 'transparent',
                                border: 'none',
                                fontSize: '24px',
                                color: '#999',
                                cursor: 'pointer',
                                width: '35px',
                                height: '35px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = '#f0f0f0';
                                e.target.style.color = '#333';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'transparent';
                                e.target.style.color = '#999';
                            }}
                        >
                            ×
                        </button>

                        <h2 style={{
                            fontSize: '28px',
                            fontWeight: '700',
                            marginBottom: '10px',
                            background: currentTheme.primary,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>
                            <i className="fas fa-gift" style={{ marginRight: '10px' }}></i>
                            Yeni Kupon Oluştur
                        </h2>
                        <p style={{ color: '#666', marginBottom: '30px', fontSize: '14px' }}>
                            İhtiyaç sahipleri için yeni bir kupon tipi oluşturun
                        </p>

                        <form onSubmit={handleCreateCoupon}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#333'
                                }}>
                                    Kupon Adı *
                                </label>
                                <input
                                    type="text"
                                    value={couponForm.name}
                                    onChange={(e) => setCouponForm({ ...couponForm, name: e.target.value })}
                                    placeholder="Örn: Gıda Kuponu, Kırtasiye Desteği"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '2px solid #e1e4e8',
                                        borderRadius: '10px',
                                        fontSize: '16px',
                                        outline: 'none',
                                        transition: 'border-color 0.2s',
                                        boxSizing: 'border-box'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = currentTheme.accent}
                                    onBlur={(e) => e.target.style.borderColor = '#e1e4e8'}
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#333'
                                }}>
                                    Kupon Tutarı (₺) *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={couponForm.amount}
                                    onChange={(e) => setCouponForm({ ...couponForm, amount: e.target.value })}
                                    placeholder="Örn: 100.00"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '2px solid #e1e4e8',
                                        borderRadius: '10px',
                                        fontSize: '16px',
                                        outline: 'none',
                                        transition: 'border-color 0.2s',
                                        boxSizing: 'border-box'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = currentTheme.accent}
                                    onBlur={(e) => e.target.style.borderColor = '#e1e4e8'}
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#333'
                                }}>
                                    Kategori *
                                </label>
                                <select
                                    value={couponForm.category}
                                    onChange={(e) => setCouponForm({ ...couponForm, category: e.target.value })}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '2px solid #e1e4e8',
                                        borderRadius: '10px',
                                        fontSize: '16px',
                                        outline: 'none',
                                        transition: 'border-color 0.2s',
                                        boxSizing: 'border-box',
                                        background: 'white',
                                        cursor: 'pointer'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = currentTheme.accent}
                                    onBlur={(e) => e.target.style.borderColor = '#e1e4e8'}
                                >
                                    <option value="gıda">Gıda</option>
                                    <option value="kırtasiye">Kırtasiye</option>
                                    <option value="giyim">Giyim</option>
                                    <option value="ulaşım">Ulaşım</option>
                                    <option value="sağlık">Sağlık</option>
                                    <option value="diğer">Diğer</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '30px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#333'
                                }}>
                                    Hedef Bağış Tutarı (₺) *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={couponForm.target_amount}
                                    onChange={(e) => setCouponForm({ ...couponForm, target_amount: e.target.value })}
                                    placeholder="Kupon için toplanması gereken toplam bağış"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '2px solid #e1e4e8',
                                        borderRadius: '10px',
                                        fontSize: '16px',
                                        outline: 'none',
                                        transition: 'border-color 0.2s',
                                        boxSizing: 'border-box'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = currentTheme.accent}
                                    onBlur={(e) => e.target.style.borderColor = '#e1e4e8'}
                                />
                                <p style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                                    Bu tutar toplandığında kuponlar oluşturulacak
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '15px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowCouponCreate(false)}
                                    style={{
                                        flex: 1,
                                        padding: '14px',
                                        border: '2px solid #e1e4e8',
                                        borderRadius: '10px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        background: 'white',
                                        color: '#666',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = '#f5f5f5';
                                        e.target.style.borderColor = '#ccc';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = 'white';
                                        e.target.style.borderColor = '#e1e4e8';
                                    }}
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={couponCreating}
                                    style={{
                                        flex: 1,
                                        padding: '14px',
                                        border: 'none',
                                        borderRadius: '10px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        background: couponCreating ? '#ccc' : currentTheme.primary,
                                        color: 'white',
                                        cursor: couponCreating ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.3s ease',
                                        boxShadow: couponCreating ? 'none' : `0 4px 12px ${currentTheme.accent}40`
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!couponCreating) {
                                            e.target.style.transform = 'translateY(-2px)';
                                            e.target.style.boxShadow = `0 6px 16px ${currentTheme.accent}50`;
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!couponCreating) {
                                            e.target.style.transform = 'translateY(0)';
                                            e.target.style.boxShadow = `0 4px 12px ${currentTheme.accent}40`;
                                        }
                                    }}
                                >
                                    {couponCreating ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                                            Oluşturuluyor...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-check-circle" style={{ marginRight: '8px' }}></i>
                                            Kupon Oluştur
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerDashboard;