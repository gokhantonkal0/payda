import React, { useState, useEffect, useRef } from 'react';
import '../../App.css';
import UserProfile from '../user/UserProfile';
import UserSettings from '../user/UserSettings';
import NotificationSystem from '../../components/NotificationSystem';
import ThemeSwitcher, { themes } from '../../components/ThemeSwitcher';
import PaydaLogo from '../../components/PaydaLogo';

const DonorDashboard = ({ user, onLogout }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [donationAmount, setDonationAmount] = useState({});
    const [needs, setNeeds] = useState([]);
    const [coupons, setCoupons] = useState([]); // Backend'den gelecek kuponlar
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('needs'); // 'coupons', 'needs' veya 'history'
    const [donationHistory, setDonationHistory] = useState([]);
    const [donating, setDonating] = useState({});
    const [userBalance, setUserBalance] = useState(0);
    const [showProfile, setShowProfile] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [toastNotifications, setToastNotifications] = useState([]);
    const [currentTheme, setCurrentTheme] = useState(() => {
        const saved = localStorage.getItem('appTheme') || 'default';
        return themes[saved] || themes.default;
    });

    const handleAmountChange = (id, value) => {
        setDonationAmount({ ...donationAmount, [id]: value });
    };

    // Kullanıcı bakiyesini çek
    useEffect(() => {
        if (user && user.id) {
            const fetchUserBalance = async () => {
                try {
                    const response = await fetch(`http://localhost:8080/users/${user.id}`);
                    if (response.ok) {
                        const data = await response.json();
                        setUserBalance(data.balance || 0);
                    }
                } catch (error) {
                    console.error("Bakiye çekilemedi:", error);
                }
            };
            fetchUserBalance();
        }
    }, [user]);

    // İhtiyaca bağış yapma fonksiyonu
    const handleDonateToNeed = async (needId, amount) => {
        if (!amount || parseFloat(amount) <= 0) {
            alert('Lütfen geçerli bir tutar giriniz');
            return;
        }

        const donateAmount = parseFloat(amount);
        if (donateAmount > userBalance) {
            alert(`Yetersiz bakiye! Mevcut bakiyeniz: ₺${userBalance.toFixed(2)}`);
            return;
        }

        setDonating({ ...donating, [`need_${needId}`]: true });

        try {
            const response = await fetch(`http://localhost:8080/needs/${needId}/donate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    donor_id: user.id,
                    need_id: needId,
                    amount: donateAmount
                })
            });

            const data = await response.json();

            if (response.ok && data.status === 'success') {
                // Bakiyeyi güncelle
                setUserBalance(data.donor_balance || userBalance - donateAmount);
                // Bağış miktarını temizle
                setDonationAmount({ ...donationAmount, [`need_${needId}`]: '' });
                
                // İhtiyaç tamamlandıysa bildirim gönder
                if (data.need_completed && data.coupon_created) {
                    addNotification(
                        'İhtiyaç Tamamlandı!', 
                        `İhtiyaç tamamlandı ve kupon oluşturuldu! Kullanıcının vitrinine düştü.`, 
                        'success', 
                        'fa-check-circle'
                    );
                } else {
                    addNotification(
                        'Bağış Yapıldı', 
                        `₺${donateAmount.toFixed(2)} bağış yapıldı. Yeni bakiyeniz: ₺${(data.donor_balance || userBalance - donateAmount).toFixed(2)}`, 
                        'success', 
                        'fa-heart'
                    );
                }
                
                // İhtiyaçları yeniden yükle
                const needsResponse = await fetch('http://localhost:8080/needs?status=active');
                if (needsResponse.ok) {
                    const needsData = await needsResponse.json();
                    setNeeds(needsData);
                }
            } else {
                alert(data.detail || 'Bağış yapılamadı');
            }
        } catch (error) {
            console.error('Bağış hatası:', error);
            alert('Bağış yapılırken bir hata oluştu');
        } finally {
            setDonating({ ...donating, [`need_${needId}`]: false });
        }
    };

    // Kupon bağışı yapma fonksiyonu
    const handleDonateToCoupon = async (couponTypeId, amount) => {
        if (!amount || parseFloat(amount) <= 0) {
            alert('Lütfen geçerli bir tutar giriniz');
            return;
        }

        const donateAmount = parseFloat(amount);
        if (donateAmount > userBalance) {
            alert(`Yetersiz bakiye! Mevcut bakiyeniz: ₺${userBalance.toFixed(2)}`);
            return;
        }

        setDonating({ ...donating, [`coupon_${couponTypeId}`]: true });

        try {
            // couponTypeId pool id, coupon_type_id'yi bulmalıyız
            const coupon = coupons.find(c => c.id === couponTypeId || c.pool_id === couponTypeId);
            if (!coupon) {
                alert('Kupon bilgisi bulunamadı');
                setDonating({ ...donating, [`coupon_${couponTypeId}`]: false });
                return;
            }

            // coupon_type_id'yi bul
            const couponTypeIdValue = coupon.coupon_type_id;
            if (!couponTypeIdValue) {
                console.error('Kupon tipi ID bulunamadı:', coupon);
                alert('Kupon tipi bilgisi bulunamadı');
                setDonating({ ...donating, [`coupon_${couponTypeId}`]: false });
                return;
            }

            const response = await fetch('http://localhost:8080/donate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    amount: donateAmount,
                    coupon_type_id: couponTypeIdValue
                })
            });

            const data = await response.json();

            if (response.ok && data.status === 'success') {
                // Bakiyeyi HEMEN güncelle - backend'den gelen yanıtı kullan
                const newBalance = data.donor_balance !== undefined ? data.donor_balance : (data.user_balance !== undefined ? data.user_balance : (userBalance - donateAmount));
                setUserBalance(newBalance);
                
                // Bağış miktarını temizle
                setDonationAmount({ ...donationAmount, [couponTypeId]: '' });
                
                // Kuponları HEMEN yeniden yükle (kupon sayıları güncellensin)
                const updateCoupons = async () => {
                    const couponsResponse = await fetch('http://localhost:8080/items');
                    if (couponsResponse.ok) {
                        const couponsData = await couponsResponse.json();
                        // Az kupon olanlara öncelik ver - available_coupons sayısına göre sırala
                        const sorted = couponsData.sort((a, b) => {
                            const aCount = a.available_coupons || 0;
                            const bCount = b.available_coupons || 0;
                            return aCount - bCount;
                        });
                        setCoupons(sorted);
                        
                        // Bağış yapılan kuponun sayısını bildir
                        const donatedCoupon = sorted.find(c => c.coupon_type_id === couponTypeIdValue);
                        if (donatedCoupon) {
                            if (data.created_coupons_count > 0) {
                                addNotification(
                                    'Kuponlar Oluşturuldu!', 
                                    `${data.created_coupons_count} yeni kupon oluşturuldu! Mevcut kupon sayısı: ${donatedCoupon.available_coupons || 0}`, 
                                    'success', 
                                    'fa-ticket-alt'
                                );
                            }
                            // Potansiyel kupon sayısı güncellendi mi kontrol et
                            const oldCoupon = coupons.find(c => c.id === couponTypeId || c.pool_id === couponTypeId);
                            if (oldCoupon && donatedCoupon.potential_coupons !== oldCoupon.potential_coupons) {
                                addNotification(
                                    'Havuz Güncellendi', 
                                    `Potansiyel kupon sayısı: ${donatedCoupon.potential_coupons || 0}`, 
                                    'info', 
                                    'fa-info-circle'
                                );
                            }
                        }
                    }
                };
                
                // Önce hemen güncelle, sonra 300ms sonra tekrar güncelle (backend işlemi tamamlansın)
                updateCoupons();
                setTimeout(updateCoupons, 300);
                
                // Başarı bildirimi
                addNotification(
                    'Bağış Yapıldı', 
                    `₺${donateAmount.toFixed(2)} bağış yapıldı. Yeni bakiyeniz: ₺${newBalance.toFixed(2)}`, 
                    'success', 
                    'fa-heart'
                );
            } else {
                alert(data.detail || data.message || 'Bağış yapılamadı');
            }
        } catch (error) {
            console.error('Bağış hatası:', error);
            alert('Bağış yapılırken bir hata oluştu');
        } finally {
            setDonating({ ...donating, [`coupon_${couponTypeId}`]: false });
        }
    };

    // İhtiyaçları, kuponları ve bağış geçmişini backend'den çek
    useEffect(() => {
        const fetchNeeds = async () => {
            try {
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

        const fetchCoupons = async () => {
            try {
                const response = await fetch('http://localhost:8080/items');
                if (response.ok) {
                    const data = await response.json();
                    // Az kupon olanlara öncelik ver - available_coupons sayısına göre sırala
                    const sorted = data.sort((a, b) => {
                        const aCount = a.available_coupons || 0;
                        const bCount = b.available_coupons || 0;
                        // Önce az kupon olanlar (ascending)
                        return aCount - bCount;
                    });
                    setCoupons(sorted);
                }
            } catch (error) {
                console.error("Kuponlar çekilemedi:", error);
            }
        };

        const fetchDonationHistory = async () => {
            try {
                if (user && user.id) {
                    const response = await fetch(`http://localhost:8080/donations?user_id=${user.id}`);
                    if (response.ok) {
                        const data = await response.json();
                        // Tarihe göre sırala (en yeni önce)
                        const sorted = data.sort((a, b) => {
                            const dateA = new Date(a.created_at || 0);
                            const dateB = new Date(b.created_at || 0);
                            return dateB - dateA;
                        });
                        setDonationHistory(sorted);
                    }
                }
            } catch (error) {
                console.error("Bağış geçmişi çekilemedi:", error);
            }
        };

        fetchNeeds();
        fetchCoupons();
        fetchDonationHistory();
        
        // Kupon sayılarını otomatik güncelle (her 3 saniyede bir)
        const interval = setInterval(() => {
            fetchCoupons();
        }, 3000);
        
        return () => clearInterval(interval);
    }, [user]);

    // Bildirim ID'lerini takip et (aynı bildirimin iki kere gönderilmesini önle)
    const notificationIdsRef = useRef(new Set());
    
    // Bildirim ekleme fonksiyonu
    const addNotification = (title, message, type = 'info', icon = 'fa-info-circle') => {
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
    };

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const clearAllNotifications = () => {
        setNotifications([]);
    };

    useEffect(() => {
        if (user && user.id) {
            addNotification('Hoş Geldiniz!', 'PAYDA platformuna hoş geldiniz. Bağış yaparak ihtiyaç sahiplerine destek olabilirsiniz.', 'success', 'fa-heart');
        }
    }, [user]);

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

    const filteredNeeds = needs.filter(need =>
        need.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (need.user_name && need.user_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

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
                    <i className="fas fa-heart" style={{ 
                        color: '#fff', 
                        fontSize: '28px',
                        marginRight: '10px'
                    }}></i>
                    <PaydaLogo size={35} showText={true} onClick={onLogout} darkBackground={true} />
                </div>
                <div className="menu-items">
                    <div 
                        className={`menu-item ${activeTab === 'needs' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('needs')}
                        style={{
                            background: activeTab === 'needs' ? 'rgba(255,255,255,0.2)' : 'transparent',
                            borderRadius: '12px',
                            marginBottom: '8px',
                            transition: 'all 0.3s ease',
                            color: 'white'
                        }}
                    >
                        <i className="fas fa-bullhorn"></i>
                        <span>İhtiyaçlar</span>
                    </div>
                    <div 
                        className={`menu-item ${activeTab === 'coupons' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('coupons')}
                        style={{
                            background: activeTab === 'coupons' ? 'rgba(255,255,255,0.2)' : 'transparent',
                            borderRadius: '12px',
                            marginBottom: '8px',
                            transition: 'all 0.3s ease',
                            color: 'white'
                        }}
                    >
                        <i className="fas fa-ticket-alt"></i>
                        <span>Kuponlar</span>
                    </div>
                    <div 
                        className={`menu-item ${activeTab === 'history' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('history')}
                        style={{
                            background: activeTab === 'history' ? 'rgba(255,255,255,0.2)' : 'transparent',
                            borderRadius: '12px',
                            marginBottom: '8px',
                            transition: 'all 0.3s ease',
                            color: 'white'
                        }}
                    >
                        <i className="fas fa-history"></i>
                        <span>Bağış Geçmişi</span>
                    </div>
                    <div className="menu-item" onClick={() => setShowProfile(true)} style={{
                        borderRadius: '12px',
                        marginBottom: '8px',
                        transition: 'all 0.3s ease',
                        color: 'white'
                    }}>
                        <i className="fas fa-user-circle"></i>
                        <span>Profil</span>
                    </div>
                    <div className="menu-item" onClick={() => setShowSettings(true)} style={{
                        borderRadius: '12px',
                        marginBottom: '8px',
                        transition: 'all 0.3s ease',
                        color: 'white'
                    }}>
                        <i className="fas fa-cog"></i>
                        <span>Ayarlar</span>
                    </div>
                    <div className="menu-item logout-btn" onClick={onLogout} style={{
                        borderRadius: '12px',
                        marginTop: 'auto',
                        background: 'rgba(255,255,255,0.2)',
                        transition: 'all 0.3s ease',
                        color: 'white'
                    }}>
                        <i className="fas fa-sign-out-alt"></i>
                        <span>Çıkış Yap</span>
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
                            Hoş Geldin, Gönüllü {user?.name || 'Kullanıcı'} ❤️
                        </h2>
                        <p style={{ 
                            margin: '8px 0 0 0', 
                            fontSize: '14px', 
                            opacity: 0.9,
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <i className="fas fa-wallet" style={{ fontSize: '16px' }}></i>
                            Mevcut Bakiyeniz: <strong style={{ fontSize: '18px', color: '#fff' }}>₺{userBalance.toFixed(2)}</strong>
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
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
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
                        </button>
                    </div>
                </header>

                {/* Tab Sistemi */}
                <div style={{ 
                    display: 'flex', 
                    gap: '10px', 
                    marginBottom: '25px',
                    background: 'white',
                    padding: '8px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}>
                    <button
                        onClick={() => setActiveTab('needs')}
                        style={{
                            flex: 1,
                            padding: '12px 20px',
                            border: 'none',
                            background: activeTab === 'needs' ? 'linear-gradient(135deg, #e91e63 0%, #c2185b 100%)' : 'transparent',
                            color: activeTab === 'needs' ? 'white' : '#666',
                            cursor: 'pointer',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: '14px',
                            transition: 'all 0.3s ease',
                            boxShadow: activeTab === 'needs' ? '0 4px 12px rgba(233, 30, 99, 0.3)' : 'none'
                        }}
                    >
                        <i className="fas fa-bullhorn"></i> İhtiyaçlar ({needs.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('coupons')}
                        style={{
                            flex: 1,
                            padding: '12px 20px',
                            border: 'none',
                            background: activeTab === 'coupons' ? 'linear-gradient(135deg, #e91e63 0%, #c2185b 100%)' : 'transparent',
                            color: activeTab === 'coupons' ? 'white' : '#666',
                            cursor: 'pointer',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: '14px',
                            transition: 'all 0.3s ease',
                            boxShadow: activeTab === 'coupons' ? '0 4px 12px rgba(233, 30, 99, 0.3)' : 'none'
                        }}
                    >
                        <i className="fas fa-ticket-alt"></i> Kuponlar
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        style={{
                            flex: 1,
                            padding: '12px 20px',
                            border: 'none',
                            background: activeTab === 'history' ? 'linear-gradient(135deg, #e91e63 0%, #c2185b 100%)' : 'transparent',
                            color: activeTab === 'history' ? 'white' : '#666',
                            cursor: 'pointer',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: '14px',
                            transition: 'all 0.3s ease',
                            boxShadow: activeTab === 'history' ? '0 4px 12px rgba(233, 30, 99, 0.3)' : 'none'
                        }}
                    >
                        <i className="fas fa-history"></i> Bağış Geçmişi ({donationHistory.length})
                    </button>
                </div>

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
                                    : 'linear-gradient(135deg, #e91e63 0%, #c2185b 100%)',
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

                {/* ARAMA */}
                <div className="search-box" style={{ maxWidth: '100%', marginBottom: '20px' }}>
                    <i className="fas fa-search"></i>
                    <input 
                        type="text" 
                        placeholder={activeTab === 'needs' ? "Hangi ihtiyaca destek olmak istersin?" : "Hangi öğrenciye veya konuya destek olmak istersin?"} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                </div>

                {loading ? (
                    <p style={{ textAlign: 'center', marginTop: '50px', fontSize: '18px', color: '#666' }}>
                        Yükleniyor, lütfen bekleyin...
                    </p>
                ) : (
                    <div className="product-grid">
                        {activeTab === 'needs' ? (
                            filteredNeeds.length === 0 ? (
                                <p style={{ width: '100%', textAlign: 'center', color: '#999' }}>Aradığınız kriterde ihtiyaç bulunamadı.</p>
                            ) : filteredNeeds.map(need => {
                                const remaining = need.target_amount - need.current_amount;
                                const progress = need.progress || 0;

                                return (
                                    <div key={need.id} className="product-card" style={{
                                        background: 'white',
                                        borderRadius: '16px',
                                        padding: '25px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                        transition: 'all 0.3s ease',
                                        border: '1px solid #f0f0f0'
                                    }}>
                                        <div style={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '15px'
                                        }}>
                                            <h4 style={{
                                                margin: 0,
                                                fontSize: '20px',
                                                fontWeight: '700',
                                                color: '#2c3e50'
                                            }}>{need.title}</h4>
                                            <span style={{
                                                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                                                color: 'white',
                                                padding: '6px 12px',
                                                borderRadius: '20px',
                                                fontSize: '12px',
                                                fontWeight: '600'
                                            }}>{need.user_name || 'Kullanıcı'}</span>
                                        </div>
                                        <p style={{ 
                                            fontSize: '14px', 
                                            color: '#666',
                                            marginBottom: '15px',
                                            lineHeight: '1.6'
                                        }}>{need.description || 'Açıklama yok'}</p>

                                        <div style={{
                                            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                                            padding: '12px',
                                            borderRadius: '10px',
                                            marginBottom: '15px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: '#333'
                                        }}>
                                            Hedef: <span style={{ color: '#2c3e50' }}>₺{need.target_amount.toFixed(2)}</span> |
                                            Kalan: <span style={{ color: '#e91e63' }}>₺{remaining.toFixed(2)}</span>
                                        </div>

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
                                                <span style={{ color: '#e91e63' }}>{Math.round(progress)}%</span>
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
                                                    background: 'linear-gradient(90deg, #e91e63 0%, #c2185b 100%)',
                                                    transition: 'width 0.3s ease'
                                                }}></div>
                                            </div>
                                        </div>

                                        {/* Bağış Input ve Buton - Aşağıda */}
                                        <div style={{
                                            marginTop: '20px',
                                            paddingTop: '20px',
                                            borderTop: '2px solid #f0f0f0'
                                        }}>
                                            <input
                                                type="number"
                                                placeholder="Tutar (₺)"
                                                value={donationAmount[`need_${need.id}`] || ''}
                                                onChange={(e) => handleAmountChange(`need_${need.id}`, e.target.value)}
                                                disabled={donating[`need_${need.id}`]}
                                                style={{
                                                    width: '100%',
                                                    padding: '14px',
                                                    border: '2px solid #e0e0e0',
                                                    borderRadius: '12px',
                                                    fontSize: '15px',
                                                    outline: 'none',
                                                    transition: 'all 0.3s ease',
                                                    marginBottom: '12px',
                                                    boxSizing: 'border-box'
                                                }}
                                                onFocus={(e) => e.target.style.borderColor = '#e91e63'}
                                                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                            />
                                            <button 
                                                onClick={() => {
                                                    handleDonateToNeed(need.id, donationAmount[`need_${need.id}`]);
                                                    addNotification('Bağış Yapıldı', `₺${donationAmount[`need_${need.id}`]} bağış yapıldı.`, 'success', 'fa-heart');
                                                }}
                                                disabled={donating[`need_${need.id}`] || !donationAmount[`need_${need.id}`] || parseFloat(donationAmount[`need_${need.id}`]) <= 0}
                                                style={{
                                                    width: '100%',
                                                    padding: '14px 24px',
                                                    background: donating[`need_${need.id}`] 
                                                        ? '#ccc' 
                                                        : 'linear-gradient(135deg, #e91e63 0%, #c2185b 100%)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '12px',
                                                    cursor: donating[`need_${need.id}`] ? 'not-allowed' : 'pointer',
                                                    fontSize: '15px',
                                                    fontWeight: '600',
                                                    boxShadow: '0 4px 12px rgba(233, 30, 99, 0.3)',
                                                    transition: 'all 0.3s ease',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px'
                                                }}
                                            >
                                                {donating[`need_${need.id}`] ? (
                                                    <>
                                                        <i className="fas fa-spinner fa-spin"></i>
                                                        İşleniyor...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="fas fa-heart"></i>
                                                        Bağışla {donationAmount[`need_${need.id}`] ? `₺${donationAmount[`need_${need.id}`]}` : ''}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : activeTab === 'coupons' ? (
                            <>
                                {coupons.length === 0 ? (
                                    <p style={{ width: '100%', textAlign: 'center', color: '#999' }}>
                                        Şu anda bağış yapılabilecek kupon bulunmamaktadır.
                                    </p>
                                ) : (
                                    coupons
                                        .filter(c => {
                                            const searchLower = searchTerm.toLowerCase();
                                            return c.title.toLowerCase().includes(searchLower) ||
                                                   (c.company && c.company.toLowerCase().includes(searchLower)) ||
                                                   (c.studentName && c.studentName.toLowerCase().includes(searchLower)) ||
                                                   (c.category && c.category.toLowerCase().includes(searchLower));
                                        })
                                        .map(coupon => (
                                            <div key={coupon.id} className="product-card" style={{
                                                background: 'white',
                                                borderRadius: '16px',
                                                padding: '25px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                                transition: 'all 0.3s ease',
                                                border: '1px solid #f0f0f0'
                                            }}>
                                                <div style={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    marginBottom: '15px'
                                                }}>
                                                    <h4 style={{
                                                        margin: 0,
                                                        fontSize: '20px',
                                                        fontWeight: '700',
                                                        color: '#2c3e50'
                                                    }}>{coupon.title}</h4>
                                                    <span style={{
                                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                        color: 'white',
                                                        padding: '6px 12px',
                                                        borderRadius: '20px',
                                                        fontSize: '12px',
                                                        fontWeight: '600'
                                                    }}>{coupon.studentName}</span>
                                                </div>
                                                <p style={{ 
                                                    fontSize: '14px', 
                                                    color: '#666',
                                                    marginBottom: '15px'
                                                }}>{coupon.company} mağazasında geçerli.</p>

                                                <div style={{
                                                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                                                    padding: '12px',
                                                    borderRadius: '10px',
                                                    marginBottom: '15px',
                                                    fontSize: '14px',
                                                    fontWeight: '600',
                                                    color: '#333'
                                                }}>
                                                    <div style={{ marginBottom: '8px' }}>
                                                        Hedef: <span style={{ color: '#2c3e50' }}>₺{coupon.totalAmount}</span> |
                                                        Kalan: <span style={{ color: '#e91e63' }}>₺{Math.max(0, (coupon.totalAmount - coupon.collected)).toFixed(2)}</span>
                                                    </div>
                                                    
                                                    {/* Progress Bar */}
                                                    <div style={{ marginTop: '12px', marginBottom: '8px' }}>
                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            marginBottom: '6px',
                                                            fontSize: '12px',
                                                            color: '#666'
                                                        }}>
                                                            <span>İlerleme</span>
                                                            <span style={{ fontWeight: '700', color: '#e91e63' }}>
                                                                {Math.min(100, Math.round((coupon.collected / coupon.totalAmount) * 100))}%
                                                            </span>
                                                        </div>
                                                        <div style={{
                                                            height: '10px',
                                                            borderRadius: '10px',
                                                            overflow: 'hidden',
                                                            background: '#e0e0e0',
                                                            position: 'relative'
                                                        }}>
                                                            <div style={{
                                                                width: `${Math.min(100, (coupon.collected / coupon.totalAmount) * 100)}%`,
                                                                height: '100%',
                                                                background: coupon.is_completed 
                                                                    ? 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                                                                    : 'linear-gradient(90deg, #e91e63 0%, #c2185b 100%)',
                                                                transition: 'width 0.3s ease',
                                                                borderRadius: '10px'
                                                            }}></div>
                                                        </div>
                                                        <div style={{
                                                            fontSize: '11px',
                                                            color: '#999',
                                                            marginTop: '4px',
                                                            textAlign: 'center'
                                                        }}>
                                                            {coupon.is_completed 
                                                                ? '✅ Havuz tamamlandı!' 
                                                                : `₺${Math.max(0, (coupon.totalAmount - coupon.collected)).toFixed(2)} daha lazım`}
                                                        </div>
                                                    </div>
                                                    {/* Kupon sayısını her zaman göster - Daha belirgin */}
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        gap: '8px',
                                                        padding: '12px',
                                                        background: coupon.is_completed ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)' : 'linear-gradient(135deg, rgba(233, 30, 99, 0.15) 0%, rgba(194, 24, 91, 0.15) 100%)',
                                                        borderRadius: '10px',
                                                        marginTop: '8px',
                                                        border: `2px solid ${coupon.is_completed ? '#667eea' : '#e91e63'}`
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <i className={`fas ${coupon.is_completed ? 'fa-ticket-alt' : 'fa-hourglass-half'}`} style={{ 
                                                                color: coupon.is_completed ? '#667eea' : '#e91e63', 
                                                                fontSize: '20px' 
                                                            }}></i>
                                                            <span style={{ 
                                                                fontSize: '13px', 
                                                                color: coupon.is_completed ? '#667eea' : '#e91e63', 
                                                                fontWeight: '600' 
                                                            }}>
                                                                {coupon.is_completed ? (
                                                                    coupon.available_coupons > 0 ? `Mevcut Kupon: ${coupon.available_coupons} adet` : `Tüm kuponlar alındı (${coupon.coupon_count || 0} kupon oluşturuldu)`
                                                                ) : (
                                                                    `Havuz tamamlanınca kuponlar oluşturulacak (Potansiyel: ${coupon.potential_coupons || 0} kupon)`
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div style={{
                                                            background: coupon.is_completed ? '#667eea' : '#e91e63',
                                                            color: 'white',
                                                            padding: '6px 14px',
                                                            borderRadius: '20px',
                                                            fontSize: '16px',
                                                            fontWeight: '700',
                                                            minWidth: '60px',
                                                            textAlign: 'center',
                                                            boxShadow: `0 4px 12px ${coupon.is_completed ? 'rgba(102, 126, 234, 0.3)' : 'rgba(233, 30, 99, 0.3)'}`
                                                        }}>
                                                            {coupon.is_completed ? (
                                                                coupon.available_coupons > 0 ? (
                                                                    <><i className="fas fa-ticket-alt" style={{ marginRight: '5px' }}></i>{coupon.available_coupons}</>
                                                                ) : (
                                                                    <><i className="fas fa-check" style={{ marginRight: '5px' }}></i>{coupon.coupon_count || 0}</>
                                                                )
                                                            ) : (
                                                                <><i className="fas fa-hourglass-half" style={{ marginRight: '5px' }}></i>{coupon.potential_coupons || 0}</>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Bağış Input ve Buton - Aşağıda */}
                                                <div style={{
                                                    marginTop: '20px',
                                                    paddingTop: '20px',
                                                    borderTop: '2px solid #f0f0f0'
                                                }}>
                                                    <input
                                                        type="number"
                                                        placeholder="Tutar (₺)"
                                                        value={donationAmount[coupon.id] || ''}
                                                        onChange={(e) => handleAmountChange(coupon.id, e.target.value)}
                                                        disabled={donating[`coupon_${coupon.id}`]}
                                                        style={{
                                                            width: '100%',
                                                            padding: '14px',
                                                            border: '2px solid #e0e0e0',
                                                            borderRadius: '12px',
                                                            fontSize: '15px',
                                                            outline: 'none',
                                                            transition: 'all 0.3s ease',
                                                            marginBottom: '12px',
                                                            boxSizing: 'border-box'
                                                        }}
                                                        onFocus={(e) => e.target.style.borderColor = '#e91e63'}
                                                        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                    />
                                                    <button 
                                                        onClick={() => {
                                                            handleDonateToCoupon(coupon.id, donationAmount[coupon.id]);
                                                            addNotification('Bağış Yapıldı', `₺${donationAmount[coupon.id]} kupon bağışı yapıldı.`, 'success', 'fa-ticket-alt');
                                                        }}
                                                        disabled={donating[`coupon_${coupon.id}`] || !donationAmount[coupon.id] || parseFloat(donationAmount[coupon.id]) <= 0}
                                                        style={{
                                                            width: '100%',
                                                            padding: '14px 24px',
                                                            background: donating[`coupon_${coupon.id}`] 
                                                                ? '#ccc' 
                                                                : 'linear-gradient(135deg, #e91e63 0%, #c2185b 100%)',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '12px',
                                                            cursor: donating[`coupon_${coupon.id}`] ? 'not-allowed' : 'pointer',
                                                            fontSize: '15px',
                                                            fontWeight: '600',
                                                            boxShadow: '0 4px 12px rgba(233, 30, 99, 0.3)',
                                                            transition: 'all 0.3s ease',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '8px'
                                                        }}
                                                    >
                                                        {donating[`coupon_${coupon.id}`] ? (
                                                            <>
                                                                <i className="fas fa-spinner fa-spin"></i>
                                                                İşleniyor...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="fas fa-heart"></i>
                                                                Bağışla {donationAmount[coupon.id] ? `₺${donationAmount[coupon.id]}` : ''}
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                )}
                            </>
                        ) : activeTab === 'history' ? (
                            <div>
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
                                    Bağış Geçmişim
                                </h3>
                                {donationHistory.length === 0 ? (
                                    <div style={{ 
                                        textAlign: 'center', 
                                        padding: '60px 20px',
                                        background: 'white',
                                        borderRadius: '12px',
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                                    }}>
                                        <i className="fas fa-inbox" style={{ fontSize: '48px', color: '#ddd', marginBottom: '15px' }}></i>
                                        <p style={{ color: '#999', margin: 0, fontSize: '16px' }}>
                                            Henüz bağış yapmamışsınız.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="product-grid" style={{ gridTemplateColumns: '1fr' }}>
                                        {donationHistory.map((donation, index) => {
                                            const date = new Date(donation.created_at);
                                            const formattedDate = date.toLocaleDateString('tr-TR', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            });

                                            return (
                                                <div key={donation.id || index} className="product-card" style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '20px'
                                                }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                                                            {formattedDate}
                                                        </div>
                                                        <div style={{ fontSize: '14px', color: '#999' }}>
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
                                                            ) : donation.need_id ? (
                                                                <span style={{
                                                                    background: '#fff3cd',
                                                                    color: '#856404',
                                                                    padding: '4px 10px',
                                                                    borderRadius: '12px',
                                                                    fontSize: '11px',
                                                                    fontWeight: '600'
                                                                }}>
                                                                    İhtiyaç #{donation.need_id}
                                                                </span>
                                                            ) : (
                                                                <span style={{
                                                                    background: '#e8f4f8',
                                                                    color: '#2c3e50',
                                                                    padding: '4px 10px',
                                                                    borderRadius: '12px',
                                                                    fontSize: '11px',
                                                                    fontWeight: '600'
                                                                }}>
                                                                    Genel Bağış
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div style={{ 
                                                        fontSize: '24px', 
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
                        ) : null}
                    </div>
                )}
            </main>
        </div>
    );
};

export default DonorDashboard;