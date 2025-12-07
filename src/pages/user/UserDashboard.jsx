import React, { useState, useEffect, useMemo, useRef } from 'react';
// coupons'u sildik çünkü artık backend'den gelecek. categories data.js'den gelmeye devam edebilir.
import { categories } from '../../data';
import '../../App.css';
import NeedCreate from './NeedCreate';
import NeedDetail from './NeedDetail';
import UserProfile from './UserProfile';
import UserSettings from './UserSettings';
import NotificationSystem from '../../components/NotificationSystem';
import DatabasePanel from '../../components/DatabasePanel';
import ThemeSwitcher, { themes } from '../../components/ThemeSwitcher';
import PaydaLogo from '../../components/PaydaLogo';
import AdminPanel from '../../components/AdminPanel';

const UserDashboard = ({ user, onLogout }) => {
    const [showNeedCreate, setShowNeedCreate] = useState(false);
    const [selectedNeedId, setSelectedNeedId] = useState(null);
    const [showProfile, setShowProfile] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    // --- STATE TANIMLARI ---
    const [coupons, setCoupons] = useState([]); // Vitrin verileri (pools)
    const [availableCoupons, setAvailableCoupons] = useState([]); // Mevcut kuponlar
    const [myCoupons, setMyCoupons] = useState([]); // Kullanıcının kuponları
    const [needs, setNeeds] = useState([]); // İhtiyaçlar
    const [loading, setLoading] = useState(true); // Yükleniyor durumu
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [activeTab, setActiveTab] = useState('coupons'); // 'coupons', 'items' veya 'needs'
    const [notifications, setNotifications] = useState([]); // Bildirimler
    const [toastNotifications, setToastNotifications] = useState([]); // Toast bildirimleri
    const [showDatabasePanel, setShowDatabasePanel] = useState(false); // Veritabanı paneli
    const [showAdminPanel, setShowAdminPanel] = useState(false); // Admin paneli
    const [couponDonations, setCouponDonations] = useState([]); // Kupon bağışları
    const [userRole, setUserRole] = useState(null); // Kullanıcı rolü (admin kontrolü için)
    const [currentTheme, setCurrentTheme] = useState(() => {
        const saved = localStorage.getItem('appTheme') || 'default';
        return themes[saved] || themes.default;
    });

    // --- VERİLERİ BACKEND'DEN ÇEKME FONKSİYONU ---
        const fetchData = async () => {
            try {
            setLoading(true);
                // Backend'deki vitrin endpointine istek atıyoruz
            const itemsResponse = await fetch('http://localhost:8080/items');
            const needsResponse = await fetch('http://localhost:8080/needs?status=active');
            const couponsResponse = await fetch('http://localhost:8080/coupons?status=created'); // Atanmamış kuponlar
            const myCouponsResponse = user?.id ? await fetch(`http://localhost:8080/coupons?beneficiary_id=${user.id}`) : null;
            // Kupon bağışlarını çek (coupon_type_id olan bağışlar)
            const donationsResponse = await fetch('http://localhost:8080/donations');

            if (itemsResponse.ok) {
                const itemsData = await itemsResponse.json();
                setCoupons(itemsData);
                // items endpoint'inden gelen verileri availableCoupons olarak da kullan
                // Çünkü burada available_coupons bilgisi var
                // TÜM kupon tiplerini göster (tamamlanmış olsun ya da olmasın)
                // Böylece gönüllü bağış yaptığında kullanıcı hemen görebilir
                setAvailableCoupons(itemsData);
            } else {
                console.error("Vitrin verileri çekilemedi");
            }

            if (needsResponse.ok) {
                const needsData = await needsResponse.json();
                setNeeds(needsData);
                } else {
                console.error("İhtiyaçlar çekilemedi");
            }

            // couponsResponse artık sadece kullanıcının kendi kuponları için kullanılıyor
            // availableCoupons için /items endpoint'i kullanılıyor

            if (myCouponsResponse && myCouponsResponse.ok) {
                const myCouponsData = await myCouponsResponse.json();
                setMyCoupons(myCouponsData);
            }
            
            // Kullanıcının aldığı kupon tiplerini kontrol et (aynı kupon tipinden sadece 1 tane alınabilir)

            // Kupon bağışlarını filtrele ve kaydet
            if (donationsResponse.ok) {
                const donationsData = await donationsResponse.json();
                // Sadece coupon_type_id olan bağışları al (kupon bağışları)
                const couponDonationsData = donationsData.filter(donation => donation.coupon_type_id !== null);
                // En yeni önce sırala
                couponDonationsData.sort((a, b) => {
                    const dateA = new Date(a.created_at || 0);
                    const dateB = new Date(b.created_at || 0);
                    return dateB - dateA;
                });
                setCouponDonations(couponDonationsData);
                }
            } catch (error) {
                console.error("Bağlantı hatası:", error);
            } finally {
            setLoading(false);
        }
    };

    // Kullanıcının aldığı kupon tiplerini kontrol et (aynı kupon tipinden sadece 1 tane alınabilir)
    const hasCouponType = useMemo(() => {
        const couponTypeIds = new Set();
        myCoupons.forEach(coupon => {
            if (coupon.coupon_type_id) {
                couponTypeIds.add(coupon.coupon_type_id);
            }
        });
        return couponTypeIds;
    }, [myCoupons]);

    // Kupon alma fonksiyonu
    const handleClaimCoupon = async (couponTypeId) => {
        if (!user || !user.id) {
            alert('Kullanıcı bilgisi bulunamadı');
            return;
        }

        // Kullanıcının bu kupon tipinden zaten kuponu var mı kontrol et
        if (hasCouponType.has(couponTypeId)) {
            alert('Bu kupon tipinden zaten bir kuponunuz var. Aynı kupon tipinden sadece 1 tane alabilirsiniz.');
            return;
        }

        try {
            // Önce bu coupon_type_id için mevcut bir kupon bul (status=created)
            const availableCouponsResponse = await fetch(`http://localhost:8080/coupons?status=created`);
            let couponId = null;
            
            if (availableCouponsResponse.ok) {
                const availableCouponsData = await availableCouponsResponse.json();
                // İlk mevcut kuponu al (bu coupon_type_id için)
                const availableCoupon = availableCouponsData.find(c => c.coupon_type_id === couponTypeId);
                if (availableCoupon) {
                    couponId = availableCoupon.id;
                }
            }

            if (!couponId) {
                alert('Bu kupon tipi için mevcut kupon bulunamadı. Lütfen daha sonra tekrar deneyin.');
                return;
            }

            const response = await fetch('http://localhost:8080/coupons/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    coupon_id: couponId,
                    beneficiary_id: user.id
                })
            });

            const data = await response.json();

            if (response.ok) {
                addNotification('Kupon Alındı', 'Kupon başarıyla alındı!', 'success', 'fa-check-circle');
                // Kısa bir gecikme ile verileri yenile (backend'in işlemi tamamlaması için)
                setTimeout(() => {
                    fetchData();
                }, 500);
            } else {
                alert(data.detail || 'Kupon alınamadı');
            }
        } catch (error) {
            console.error('Kupon alma hatası:', error);
            alert('Kupon alınırken bir hata oluştu');
        }
    };

    // Bildirim ekleme fonksiyonu
    // Bildirim ID'lerini takip et (aynı bildirimin iki kere gönderilmesini önle)
    const notificationIdsRef = useRef(new Set());
    
    const addNotification = (title, message, type = 'info', icon = 'fa-info-circle') => {
        // Bildirim için unique key oluştur (title + message - timestamp olmadan)
        // Böylece aynı bildirim kısa süre içinde tekrar gönderilmez
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
        
        // Toast bildirimi ekle
        const toastId = notificationId;
        setToastNotifications(prev => [...prev, { id: toastId, ...newNotif }]);
        setTimeout(() => {
            setToastNotifications(prev => prev.filter(t => t.id !== toastId));
        }, 5000);
    };

    // Bildirimi okundu olarak işaretle
    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    // Tüm bildirimleri temizle
    const clearAllNotifications = () => {
        setNotifications([]);
    };

    // --- VERİLERİ BACKEND'DEN ÇEKME (useEffect) ---
    useEffect(() => {
        // Sayfa açılınca bu kod çalışır
        fetchData();
        
        // Örnek bildirimler ekle (sadece bir kere - React StrictMode için)
        let welcomeTimer;
        if (user && user.id) {
            welcomeTimer = setTimeout(() => {
                addNotification('Hoş Geldiniz!', 'PAYDA platformuna hoş geldiniz. Kuponlarınızı ve ihtiyaçlarınızı yönetebilirsiniz.', 'success', 'fa-check-circle');
            }, 100);
        }
        
        // Kupon sayılarını otomatik güncelle (her 3 saniyede bir)
        let previousAvailableCoupons = {}; // coupon_type_id -> available_coupons mapping
        let previousCollected = {}; // coupon_type_id -> collected amount mapping
        const interval = setInterval(async () => {
            // Mevcut kupon tiplerini ve sayılarını kontrol et
            const itemsResponse = await fetch('http://localhost:8080/items');
            if (itemsResponse.ok) {
                const itemsData = await itemsResponse.json();
                // TÜM kupon tiplerini kontrol et (tamamlanmış olsun ya da olmasın)
                
                // Her kupon tipi için mevcut kupon sayısını ve toplanan tutarı kontrol et
                itemsData.forEach(item => {
                    const typeId = item.coupon_type_id;
                    const currentAvailable = item.available_coupons || 0;
                    const previousAvailable = previousAvailableCoupons[typeId] || 0;
                    const currentCollected = item.collected || 0;
                    const previousCollectedAmount = previousCollected[typeId] || 0;
                    
                    // Yeni kupon oluşturuldu mu kontrol et
                    if (previousAvailable > 0 && currentAvailable > previousAvailable) {
                        const newCoupons = currentAvailable - previousAvailable;
                        addNotification(
                            'Yeni Kupon Oluşturuldu!', 
                            `${item.title} için ${newCoupons} yeni kupon oluşturuldu! ${item.company} tarafından sağlanan destek.`, 
                            'success', 
                            'fa-ticket-alt'
                        );
                    }
                    
                    // İlk kez görüyorsak ve kupon varsa bildirim gönder
                    if (previousAvailable === 0 && currentAvailable > 0) {
                        addNotification(
                            'Kupon Hazır!', 
                            `${item.title} için ${currentAvailable} kupon mevcut! ${item.company} tarafından sağlanan destek.`, 
                            'info', 
                            'fa-gift'
                        );
                    }
                    
                    // Yeni bağış yapıldı mı kontrol et (toplanan tutar arttı mı?)
                    if (currentCollected > previousCollectedAmount && previousCollectedAmount > 0) {
                        const newDonation = currentCollected - previousCollectedAmount;
                        addNotification(
                            'Yeni Bağış!', 
                            `${item.title} için ₺${newDonation.toFixed(2)} yeni bağış yapıldı!`, 
                            'info', 
                            'fa-heart'
                        );
                    }
                    
                    previousAvailableCoupons[typeId] = currentAvailable;
                    previousCollected[typeId] = currentCollected;
                });
            }

        fetchData();
        }, 3000);
        
        return () => {
            if (welcomeTimer) clearTimeout(welcomeTimer);
            clearInterval(interval);
        };
    }, [user]); // user değiştiğinde çalıştır

    // --- ARAMA VE FİLTRELEME MANTIĞI ---
    // Hooks'lar early return'lerden ÖNCE olmalı!
    const filteredCoupons = coupons.filter(coupon => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
            (coupon.title && coupon.title.toLowerCase().includes(searchLower)) ||
            (coupon.company && coupon.company.toLowerCase().includes(searchLower)) ||
            (coupon.studentName && coupon.studentName.toLowerCase().includes(searchLower)) ||
            (coupon.category && coupon.category.toLowerCase().includes(searchLower)) ||
            (coupon.description && coupon.description.toLowerCase().includes(searchLower));

        const matchesCategory = selectedCategory === 'all' || coupon.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    const filteredNeeds = needs.filter(need => {
        const matchesSearch =
            need.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (need.user_name && need.user_name.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCategory = selectedCategory === 'all' || need.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    // Kupon tiplerini grupla ve sayılarını hesapla
    const groupedAvailableCoupons = useMemo(() => {
        const couponTypeGroups = {};
        availableCoupons.forEach(coupon => {
            const key = coupon.coupon_type_id;
            // available_coupons bilgisini backend'den al, yoksa 0 kabul et
            const availableCount = coupon.available_coupons !== undefined ? coupon.available_coupons : 0;
            
            if (!couponTypeGroups[key]) {
                couponTypeGroups[key] = {
                    coupon_type: coupon,
                    count: availableCount, // Mevcut kupon sayısı
                    available_coupons: availableCount, // Kalan kupon sayısı (aynı şey)
                    coupon_count: coupon.coupon_count || 0 // Toplam oluşturulan kupon sayısı
                };
            } else {
                // Eğer aynı coupon_type_id için birden fazla item varsa, available_coupons'u topla
                couponTypeGroups[key].count += availableCount;
                couponTypeGroups[key].available_coupons += availableCount;
                couponTypeGroups[key].coupon_count = Math.max(
                    couponTypeGroups[key].coupon_count || 0,
                    coupon.coupon_count || 0
                );
            }
        });
        
        // Grupları listeye çevir ve filtrele
        return Object.values(couponTypeGroups).filter(group => {
            const coupon = group.coupon_type;
            const matchesSearch = 
                (coupon.title && coupon.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (coupon.company && coupon.company.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesCategory = selectedCategory === 'all' || coupon.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [availableCoupons, searchTerm, selectedCategory]);

    // İhtiyaç detay sayfasını göster
    if (selectedNeedId) {
        return (
            <NeedDetail
                needId={selectedNeedId}
                onBack={() => setSelectedNeedId(null)}
            />
        );
    }

    // Profil sayfasını göster
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

    // Ayarlar sayfasını göster
    if (showSettings) {
        return (
            <UserSettings
                user={user}
                onBack={() => setShowSettings(false)}
            />
        );
    }

    // Admin paneli göster
    if (showAdminPanel && userRole === 'admin') {
        return (
            <AdminPanel
                user={user}
                onBack={() => setShowAdminPanel(false)}
            />
        );
    }

    // İhtiyaç oluştur sayfasını göster
    if (showNeedCreate) {
        return (
            <NeedCreate
                user={user}
                onBack={() => setShowNeedCreate(false)}
                onSuccess={(need) => {
                    setShowNeedCreate(false);
                    addNotification('İhtiyaç Oluşturuldu', `${need.title} başarıyla oluşturuldu.`, 'success', 'fa-check-circle');
                    // İhtiyaç oluşturulduktan sonra verileri yeniden yükle
                    fetchData();
                }}
            />
        );
    }

    return (
        <div className="dashboard-layout" style={{ background: currentTheme.secondary, minHeight: '100vh' }}>

            {/* --- SOL MENÜ (SIDEBAR) --- */}
            <nav className="sidebar" style={{
                background: currentTheme.sidebar,
                boxShadow: '4px 0 20px rgba(0,0,0,0.1)'
            }}>
                <div className="brand" style={{
                    background: 'rgba(255,255,255,0.1)',
                    padding: '20px',
                    borderRadius: '12px',
                    marginBottom: '30px',
                    backdropFilter: 'blur(10px)'
                }}>
                    <PaydaLogo size={40} showText={true} onClick={onLogout} darkBackground={true} />
                </div>

                <div className="menu-items">
                    <div 
                        className={`menu-item ${activeTab !== 'needs' && !showNeedCreate ? 'active' : ''}`} 
                        onClick={() => { setShowNeedCreate(false); setActiveTab('coupons'); }}
                        style={{
                            background: activeTab !== 'needs' && !showNeedCreate ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' : 'transparent',
                            borderRadius: '12px',
                            marginBottom: '8px',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <i className="fas fa-ticket-alt"></i>
                        <span>Kuponlarım</span>
                    </div>
                    <div 
                        className={`menu-item ${activeTab === 'items' ? 'active' : ''}`} 
                        onClick={() => { setShowNeedCreate(false); setActiveTab('items'); }}
                        style={{
                            background: activeTab === 'items' ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' : 'transparent',
                            borderRadius: '12px',
                            marginBottom: '8px',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <i className="fas fa-store"></i>
                        <span>Vitrin</span>
                    </div>
                    <div 
                        className={`menu-item ${activeTab === 'needs' ? 'active' : ''}`} 
                        onClick={() => { setShowNeedCreate(false); setActiveTab('needs'); }}
                        style={{
                            background: activeTab === 'needs' ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' : 'transparent',
                            borderRadius: '12px',
                            marginBottom: '8px',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <i className="fas fa-bullhorn"></i>
                        <span>İhtiyaçlar</span>
                    </div>
                    <div className="menu-item" onClick={() => setShowNeedCreate(true)} style={{
                        borderRadius: '12px',
                        marginBottom: '8px',
                        transition: 'all 0.3s ease',
                        background: showNeedCreate ? 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' : 'transparent'
                    }}>
                        <i className="fas fa-plus-circle"></i>
                        <span>İhtiyaç Oluştur</span>
                    </div>
                    <div className="menu-item" onClick={() => setShowProfile(true)} style={{
                        borderRadius: '12px',
                        marginBottom: '8px',
                        transition: 'all 0.3s ease'
                    }}>
                        <i className="fas fa-user-circle"></i>
                        <span>Profil</span>
                    </div>
                    <div className="menu-item" onClick={() => setShowSettings(true)} style={{
                        borderRadius: '12px',
                        marginBottom: '8px',
                        transition: 'all 0.3s ease'
                    }}>
                        <i className="fas fa-cog"></i>
                        <span>Ayarlar</span>
                    </div>
                    
                    {/* Admin Paneli Butonu - Sadece admin kullanıcılar için */}
                    {userRole === 'admin' && (
                        <div className="menu-item" onClick={() => setShowAdminPanel(true)} style={{
                            borderRadius: '12px',
                            marginBottom: '8px',
                            transition: 'all 0.3s ease',
                            background: showAdminPanel ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)' : 'transparent'
                        }}>
                            <i className="fas fa-user-shield"></i>
                            <span>Admin Paneli</span>
                        </div>
                    )}

                    {/* Çıkış Yap Butonu */}
                    <div className="menu-item logout-btn" onClick={onLogout} style={{
                        borderRadius: '12px',
                        marginTop: 'auto',
                        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                        transition: 'all 0.3s ease'
                    }}>
                        <i className="fas fa-sign-out-alt"></i>
                        <span>Çıkış Yap</span>
                    </div>
                </div>
            </nav>

            {/* --- SAĞ İÇERİK (MAIN CONTENT) --- */}
            <main className="main-content" style={{ 
                background: 'transparent',
                padding: '30px'
            }}>

                {/* Üst Başlık */}
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
                            Merhaba, {user?.name || 'Kullanıcı'} 👋
                        </h2>
                        <p style={{ 
                            margin: '8px 0 0 0', 
                            fontSize: '14px', 
                            opacity: 0.9,
                            color: 'white'
                        }}>
                            Hoş geldiniz! Kuponlarınızı ve ihtiyaçlarınızı yönetin.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        {/* Tema Değiştirici */}
                        <ThemeSwitcher onThemeChange={setCurrentTheme} />
                        
                        {/* Veritabanı Paneli Butonu */}
                        <button
                            onClick={() => setShowDatabasePanel(!showDatabasePanel)}
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                backdropFilter: 'blur(10px)',
                                border: '2px solid rgba(255,255,255,0.3)',
                                padding: '10px 15px',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                color: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                fontWeight: '600'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                            }}
                        >
                            <i className="fas fa-database" style={{ marginRight: '8px' }}></i>
                            Veritabanı
                        </button>
                        
                        {/* Bildirim Sistemi */}
                        <NotificationSystem
                            notifications={notifications}
                            onMarkAsRead={markAsRead}
                            onClearAll={clearAllNotifications}
                        />
                        
                        {/* Profil Menüsü */}
                        <div style={{ position: 'relative' }}>
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
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                                    e.currentTarget.style.transform = 'scale(1.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                            >
                                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </button>
                        </div>
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
                                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                        onClick={() => setActiveTab('coupons')}
                        style={{
                            flex: 1,
                            padding: '12px 20px',
                            border: 'none',
                            background: activeTab === 'coupons' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                            color: activeTab === 'coupons' ? 'white' : '#666',
                            cursor: 'pointer',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: '14px',
                            transition: 'all 0.3s ease',
                            boxShadow: activeTab === 'coupons' ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
                        }}
                    >
                        <i className="fas fa-ticket-alt"></i> Kuponlarım ({myCoupons.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('items')}
                        style={{
                            flex: 1,
                            padding: '12px 20px',
                            border: 'none',
                            background: activeTab === 'items' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                            color: activeTab === 'items' ? 'white' : '#666',
                            cursor: 'pointer',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: '14px',
                            transition: 'all 0.3s ease',
                            boxShadow: activeTab === 'items' ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
                        }}
                    >
                        <i className="fas fa-store"></i> Vitrin
                    </button>
                    <button
                        onClick={() => setActiveTab('needs')}
                        style={{
                            flex: 1,
                            padding: '12px 20px',
                            border: 'none',
                            background: activeTab === 'needs' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                            color: activeTab === 'needs' ? 'white' : '#666',
                            cursor: 'pointer',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: '14px',
                            transition: 'all 0.3s ease',
                            boxShadow: activeTab === 'needs' ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
                        }}
                    >
                        <i className="fas fa-bullhorn"></i> İhtiyaçlar ({needs.length})
                    </button>
                </div>

                {/* Filtreleme ve Arama Alanı */}
                <section className="filter-section" style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '16px',
                    marginBottom: '25px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}>
                    <div className="search-box" style={{
                        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                        borderRadius: '12px',
                        padding: '12px 20px',
                        marginBottom: '15px',
                        border: '2px solid transparent',
                        transition: 'all 0.3s ease'
                    }}>
                        <i className="fas fa-search" style={{ 
                            color: '#667eea',
                            fontSize: '18px',
                            marginRight: '12px'
                        }}></i>
                        <input
                            type="text"
                            placeholder={
                                activeTab === 'coupons' ? "Kupon ara..." :
                                activeTab === 'items' ? "Kupon veya işletme ara..." :
                                "İhtiyaç ara..."
                            }
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                outline: 'none',
                                fontSize: '15px',
                                width: '100%',
                                color: '#333'
                            }}
                        />
                    </div>

                    <div className="category-buttons" style={{
                        display: 'flex',
                        gap: '10px',
                        flexWrap: 'wrap'
                    }}>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                style={{
                                    padding: '10px 18px',
                                    border: 'none',
                                    borderRadius: '25px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    transition: 'all 0.3s ease',
                                    background: selectedCategory === cat.id 
                                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                                        : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                                    color: selectedCategory === cat.id ? 'white' : '#666',
                                    boxShadow: selectedCategory === cat.id 
                                        ? '0 4px 12px rgba(102, 126, 234, 0.3)' 
                                        : '0 2px 6px rgba(0,0,0,0.05)',
                                    transform: selectedCategory === cat.id ? 'translateY(-2px)' : 'none'
                                }}
                            >
                                <i className={`fas ${cat.icon}`} style={{ marginRight: '6px' }}></i> {cat.label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* İçerik */}
                {loading ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        background: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    }}>
                        <i className="fas fa-spinner fa-spin" style={{ 
                            fontSize: '48px', 
                            color: '#667eea',
                            marginBottom: '20px'
                        }}></i>
                        <p style={{ 
                            fontSize: '18px', 
                            color: '#666',
                            margin: 0,
                            fontWeight: '600'
                        }}>
                            Yükleniyor, lütfen bekleyin...
                        </p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'coupons' ? (
                    <div className="product-grid">
                                {myCoupons.length === 0 ? (
                                    <div style={{
                                        width: '100%',
                                        textAlign: 'center',
                                        padding: '60px 20px',
                                        background: 'white',
                                        borderRadius: '16px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                                    }}>
                                        <i className="fas fa-ticket-alt" style={{
                                            fontSize: '64px',
                                            color: '#c3cfe2',
                                            marginBottom: '20px'
                                        }}></i>
                                        <p style={{
                                            color: '#666',
                                            fontSize: '16px',
                                            margin: 0,
                                            fontWeight: '600'
                                        }}>
                                            Henüz kuponunuz bulunmamaktadır.
                                        </p>
                                        <p style={{
                                            color: '#999',
                                            fontSize: '14px',
                                            margin: '8px 0 0 0'
                                        }}>
                                            Bağışlanan kuponları almak için "Vitrin" sekmesine bakın.
                                        </p>
                                    </div>
                                ) : myCoupons.map(coupon => {
                                    const isUsed = coupon.status === 'used';
                                    const isAssigned = coupon.status === 'assigned';

                            return (
                                        <div key={coupon.id} className="product-card" style={{
                                            background: 'white',
                                            borderRadius: '16px',
                                            padding: '25px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                            transition: 'all 0.3s ease',
                                            border: '1px solid #f0f0f0'
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
                                                    <i className="fas fa-store"></i> {coupon.merchant_name || 'İşletme'}
                                                </span>
                                                <span className="category-tag" style={{
                                                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                                                    color: '#667eea',
                                                    padding: '6px 12px',
                                                    borderRadius: '12px',
                                                    fontSize: '11px',
                                                    fontWeight: '600',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {coupon.coupon_type_category ? coupon.coupon_type_category.toUpperCase() : 'GENEL'}
                                                </span>
                                            </div>
                                            <h4 style={{
                                                margin: '0 0 12px 0',
                                                color: '#2c3e50',
                                                fontSize: '20px',
                                                fontWeight: '700'
                                            }}>{coupon.coupon_type_name || 'Kupon'}</h4>
                                            <p style={{ 
                                                fontSize: '14px', 
                                                color: '#666', 
                                                margin: '10px 0',
                                                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                                                padding: '12px',
                                                borderRadius: '10px',
                                                textAlign: 'center'
                                            }}>
                                                Değer: <strong style={{ 
                                                    color: '#28a745', 
                                                    fontSize: '20px',
                                                    fontWeight: '700'
                                                }}>₺{coupon.coupon_type_amount || 0}</strong>
                                            </p>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginTop: '15px',
                                                paddingTop: '15px',
                                                borderTop: '2px solid #f0f0f0'
                                            }}>
                                                <span style={{
                                                    background: isUsed 
                                                        ? 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)' 
                                                        : isAssigned 
                                                        ? 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)' 
                                                        : 'linear-gradient(135deg, #e8f4f8 0%, #d4e6f1 100%)',
                                                    color: isUsed ? '#155724' : isAssigned ? '#856404' : '#2c3e50',
                                                    padding: '8px 16px',
                                                    borderRadius: '20px',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                                                }}>
                                                    {isUsed ? '✓ Kullanıldı' : isAssigned ? '⏳ Atandı' : '📋 Oluşturuldu'}
                                                </span>
                                                {isAssigned && (
                                                    <button 
                                                        className="card-btn"
                                                        onClick={() => {
                                                            if (window.confirm('Bu kuponu kullanmak istediğinize emin misiniz?')) {
                                                                // Kupon kullanma işlemi
                                                                fetch(`http://localhost:8080/coupons/use`, {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ coupon_id: coupon.id })
                                                                })
                                                                .then(res => res.json())
                                                                .then(data => {
                                                                    if (data.status === 'success') {
                                                                        addNotification('Kupon Kullanıldı', 'Kupon başarıyla kullanıldı!', 'success', 'fa-check-circle');
                                                                        // Kısa bir gecikme ile verileri yenile
                                                                        setTimeout(() => {
                                                                            fetchData();
                                                                        }, 500);
                                                                    } else {
                                                                        alert(data.message || 'Kupon kullanılamadı');
                                                                    }
                                                                })
                                                                .catch(err => {
                                                                    console.error('Kupon kullanma hatası:', err);
                                                                    alert('Kupon kullanılırken bir hata oluştu');
                                                                });
                                                            }
                                                        }}
                                                        style={{
                                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '10px 20px',
                                                            borderRadius: '25px',
                                                            cursor: 'pointer',
                                                            fontSize: '13px',
                                                            fontWeight: '600',
                                                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                                                            transition: 'all 0.3s ease'
                                                        }}
                                                    >
                                                        Kullan
                                                    </button>
                                                )}
                                            </div>
                                            {coupon.used_at && (
                                                <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                                                    <i className="fas fa-calendar"></i> Kullanım: {new Date(coupon.used_at).toLocaleDateString('tr-TR')}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : activeTab === 'items' ? (
                            <div className="product-grid">
                                {availableCoupons.length === 0 ? (
                                    <div style={{
                                        width: '100%',
                                        textAlign: 'center',
                                        padding: '60px 20px',
                                        background: 'white',
                                        borderRadius: '16px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                                    }}>
                                        <i className="fas fa-store" style={{
                                            fontSize: '64px',
                                            color: '#c3cfe2',
                                            marginBottom: '20px'
                                        }}></i>
                                        <p style={{
                                            color: '#666',
                                            fontSize: '16px',
                                            margin: 0,
                                            fontWeight: '600'
                                        }}>
                                            Şu anda alınabilecek kupon bulunmamaktadır.
                                        </p>
                                        <p style={{
                                            color: '#999',
                                            fontSize: '14px',
                                            margin: '8px 0 0 0'
                                        }}>
                                            Gönüllüler bağış yaptıkça yeni kuponlar hazır olacak.
                                        </p>
                                    </div>
                                ) : groupedAvailableCoupons.map((group, index) => {
                                            const coupon = group.coupon_type;
                                            // Pool bilgilerini coupon'dan al veya items verisinden oluştur
                                            const pool = coupon.pool || {
                                                target_amount: coupon.totalAmount || 0,
                                                current_balance: coupon.collected || 0
                                            };
                                            const canClaim = coupon.is_completed || (pool && pool.current_balance >= pool.target_amount);
                                            const progress = pool && pool.target_amount > 0 ? Math.min((pool.current_balance / pool.target_amount * 100), 100) : 100;

                                            return (
                                                <div key={coupon.id || index} className="product-card" style={{
                                                    border: canClaim ? '2px solid #28a745' : '1px solid #e8e8e8',
                                                    boxShadow: canClaim ? '0 4px 12px rgba(40, 167, 69, 0.2)' : '0 2px 8px rgba(0,0,0,0.05)'
                                                }}>
                                    <div className="card-header">
                                                        <span className="company-badge" style={{
                                                            background: canClaim ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                            color: 'white'
                                                        }}>
                                                            <i className="fas fa-store"></i> {coupon.company || coupon.merchant_name || 'İşletme'}
                                        </span>
                                        <span className="category-tag">
                                                            {coupon.category || coupon.coupon_type_category ? (coupon.category || coupon.coupon_type_category).toUpperCase() : 'GENEL'}
                                        </span>
                                    </div>
                                                    <h4>{coupon.title || coupon.coupon_type_name || 'Kupon'}</h4>
                                                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                                                        {coupon.company || coupon.merchant_name ? `${coupon.company || coupon.merchant_name} tarafından sağlanan destek.` : 'Kupon açıklaması'}
                                                    </p>
                                                    
                                                    {/* Kupon Sayısı ve Kalan Kupon */}
                                                    <div style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: '1fr 1fr',
                                                        gap: '10px',
                                                        marginBottom: '15px'
                                                    }}>
                                                        <div style={{
                                                            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                                                            padding: '12px',
                                                            borderRadius: '10px',
                                                            textAlign: 'center',
                                                            border: '2px solid #667eea'
                                                        }}>
                                                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                                                                Mevcut Kupon
                                                            </div>
                                                            <div style={{ 
                                                                fontSize: '28px', 
                                                                fontWeight: '700', 
                                                                color: '#667eea',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '8px'
                                                            }}>
                                                                <i className="fas fa-ticket-alt" style={{ fontSize: '24px' }}></i>
                                                                <span>{group.available_coupons !== undefined ? group.available_coupons : (coupon.available_coupons || 0)}</span>
                                                            </div>
                                                        </div>
                                                        <div style={{
                                                            background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                                                            padding: '12px',
                                                            borderRadius: '10px',
                                                            textAlign: 'center',
                                                            border: '2px solid #28a745'
                                                        }}>
                                                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                                                                Toplam Oluşturulan
                                                            </div>
                                                            <div style={{ 
                                                                fontSize: '28px', 
                                                                fontWeight: '700', 
                                                                color: '#28a745',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '8px'
                                                            }}>
                                                                <i className="fas fa-gift" style={{ fontSize: '24px' }}></i>
                                                                <span>{group.coupon_count !== undefined ? group.coupon_count : (coupon.coupon_count || 0)}</span>
                                        </div>
                                        </div>
                                    </div>

                                                    {pool && (
                                                        <div className="progress-area" style={{ marginBottom: '15px' }}>
                                                            <div style={{ 
                                                                display: 'flex', 
                                                                justifyContent: 'space-between', 
                                                                marginBottom: '8px',
                                                                fontSize: '12px',
                                                                color: '#666'
                                                            }}>
                                                                <span>Bağış İlerlemesi</span>
                                                                <span style={{ fontWeight: '600', color: canClaim ? '#28a745' : '#666' }}>
                                                                    {Math.round(progress)}%
                                                                </span>
                                                            </div>
                                                            <div className="progress-bar-bg">
                                                                <div className="progress-fill" style={{ 
                                                                    width: `${progress}%`,
                                                                    background: canClaim ? 'linear-gradient(90deg, #28a745 0%, #20c997 100%)' : 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                                                                }}></div>
                                                            </div>
                                                            <div className="price-info" style={{ marginTop: '8px' }}>
                                                                <span className="collected">Toplanan: ₺{(pool.current_balance || coupon.collected || 0).toFixed(2)}</span>
                                                                <span className="remaining">Hedef: ₺{(pool.target_amount || coupon.totalAmount || 0).toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #f0f0f0' }}>
                                                        <div style={{ 
                                                            fontSize: '18px', 
                                                            fontWeight: '700', 
                                                            color: '#28a745',
                                                            marginBottom: '12px',
                                                            textAlign: 'center'
                                                        }}>
                                                            💰 Kupon Değeri: ₺{coupon.coupon_type_amount || coupon.totalAmount || 0}
                                                        </div>
                                                        {canClaim ? (
                                                            <div style={{
                                                                background: '#d4edda',
                                                                border: '1px solid #c3e6cb',
                                                                borderRadius: '8px',
                                                                padding: '10px',
                                                                marginBottom: '10px',
                                                                textAlign: 'center',
                                                                fontSize: '13px',
                                                                color: '#155724'
                                                            }}>
                                                                ✅ Bağış tamamlandı! Kuponu alabilirsiniz.
                                                            </div>
                                                        ) : null}
                                                        <button 
                                                            className="card-btn"
                                                            onClick={() => handleClaimCoupon(coupon.coupon_type_id || coupon.id)}
                                                            disabled={
                                                                !canClaim || 
                                                                (group.available_coupons !== undefined && group.available_coupons <= 0) ||
                                                                hasCouponType.has(coupon.coupon_type_id || coupon.id)
                                                            }
                                                            style={{
                                                                opacity: (canClaim && !hasCouponType.has(coupon.coupon_type_id || coupon.id) && (group.available_coupons === undefined || group.available_coupons > 0)) ? 1 : 0.5,
                                                                cursor: (canClaim && !hasCouponType.has(coupon.coupon_type_id || coupon.id) && (group.available_coupons === undefined || group.available_coupons > 0)) ? 'pointer' : 'not-allowed',
                                                                width: '100%',
                                                                background: (canClaim && !hasCouponType.has(coupon.coupon_type_id || coupon.id) && (group.available_coupons === undefined || group.available_coupons > 0)) ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' : '#ccc',
                                                                color: 'white',
                                                                fontWeight: '600',
                                                                fontSize: '15px',
                                                                padding: '12px'
                                                            }}
                                                        >
                                                            {hasCouponType.has(coupon.coupon_type_id || coupon.id) 
                                                                ? '✓ Zaten Aldınız' 
                                                                : canClaim 
                                                                    ? '🎫 Kuponu Al' 
                                                                    : '⏳ Henüz Hazır Değil'}
                                                        </button>
                                                    </div>

                                                    {/* Kupon Bağışları Listesi */}
                                                    {couponDonations.filter(donation => 
                                                        donation.coupon_type_id === coupon.coupon_type_id
                                                    ).length > 0 && (
                                                        <div style={{
                                                            marginTop: '20px',
                                                            paddingTop: '20px',
                                                            borderTop: '2px solid #f0f0f0'
                                                        }}>
                                                            <div style={{
                                                                fontSize: '14px',
                                                                fontWeight: '700',
                                                                color: '#333',
                                                                marginBottom: '12px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px'
                                                            }}>
                                                                <i className="fas fa-heart" style={{ color: '#e91e63' }}></i>
                                                                Yapılan Bağışlar
                                                            </div>
                                                            <div style={{
                                                                maxHeight: '150px',
                                                                overflowY: 'auto',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                gap: '8px'
                                                            }}>
                                                                {couponDonations
                                                                    .filter(donation => donation.coupon_type_id === (coupon.coupon_type_id || coupon.id))
                                                                    .slice(0, 5)
                                                                    .map((donation, idx) => {
                                                                        const donor = donation.user_name || donation.donor_name || 'Anonim';
                                                                        return (
                                                                            <div key={idx} style={{
                                                                                background: 'linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%)',
                                                                                padding: '10px 12px',
                                                                                borderRadius: '8px',
                                                                                display: 'flex',
                                                                                justifyContent: 'space-between',
                                                                                alignItems: 'center',
                                                                                fontSize: '13px'
                                                                            }}>
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                                    <i className="fas fa-user-circle" style={{ color: '#667eea' }}></i>
                                                                                    <span style={{ color: '#666' }}>
                                                                                        {donor.length > 15 ? `${donor.substring(0, 15)}...` : donor}
                                                                                    </span>
                                                                                </div>
                                                                                <div style={{
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    gap: '8px',
                                                                                    fontWeight: '700',
                                                                                    color: '#28a745'
                                                                                }}>
                                                                                    <i className="fas fa-lira-sign"></i>
                                                                                    {donation.amount?.toFixed(2) || '0.00'}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                            </div>
                                                            {couponDonations.filter(donation => 
                                                                donation.coupon_type_id === (coupon.coupon_type_id || coupon.id)
                                                            ).length > 5 && (
                                                                <div style={{
                                                                    fontSize: '12px',
                                                                    color: '#999',
                                                                    textAlign: 'center',
                                                                    marginTop: '8px'
                                                                }}>
                                                                    +{couponDonations.filter(donation => 
                                                                        donation.coupon_type_id === (coupon.coupon_type_id || coupon.id)
                                                                    ).length - 5} bağış daha
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                            </div>
                        ) : activeTab === 'needs' ? (
                            <div className="product-grid">
                                {filteredNeeds.length === 0 ? (
                                    <div style={{
                                        width: '100%',
                                        textAlign: 'center',
                                        padding: '60px 20px',
                                        background: 'white',
                                        borderRadius: '16px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                                    }}>
                                        <i className="fas fa-bullhorn" style={{
                                            fontSize: '64px',
                                            color: '#c3cfe2',
                                            marginBottom: '20px'
                                        }}></i>
                                        <p style={{
                                            color: '#666',
                                            fontSize: '16px',
                                            margin: 0,
                                            fontWeight: '600'
                                        }}>
                                            Aradığınız kriterde ihtiyaç bulunamadı.
                                        </p>
                                    </div>
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
                                            <div className="card-header" style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '15px'
                                            }}>
                                                <span className="company-badge" style={{
                                                    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
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
                                                    color: '#667eea',
                                                    padding: '6px 12px',
                                                    borderRadius: '12px',
                                                    fontSize: '11px',
                                                    fontWeight: '600',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {need.category ? need.category.toUpperCase() : 'GENEL'}
                                                </span>
                                            </div>
                                            <h4 style={{
                                                margin: '0 0 12px 0',
                                                color: '#2c3e50',
                                                fontSize: '20px',
                                                fontWeight: '700'
                                            }}>{need.title}</h4>
                                            <p style={{
                                                color: '#666',
                                                fontSize: '14px',
                                                marginBottom: '15px',
                                                lineHeight: '1.6'
                                            }}>{need.description || 'Açıklama yok'}</p>
                                            <div className="progress-area" style={{
                                                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                                                padding: '15px',
                                                borderRadius: '12px',
                                                marginBottom: '15px'
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
                                                    <span style={{ color: '#667eea' }}>{Math.round(progress)}%</span>
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
                                                        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                                                        transition: 'width 0.3s ease'
                                                    }}></div>
                                                </div>
                                                <div className="price-info" style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    marginTop: '12px',
                                                    fontSize: '14px'
                                                }}>
                                                    <span className="collected" style={{
                                                        color: '#28a745',
                                                        fontWeight: '700'
                                                    }}>Toplanan: ₺{need.current_amount.toFixed(2)}</span>
                                                    <span className="remaining" style={{
                                                        color: '#dc3545',
                                                        fontWeight: '700'
                                                    }}>Kalan: ₺{remaining.toFixed(2)}</span>
                                                </div>
                                            </div>
                                            <button 
                                                className="card-btn"
                                                onClick={() => setSelectedNeedId(need.id)}
                                                style={{
                                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '12px 24px',
                                                    borderRadius: '25px',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                    fontWeight: '600',
                                                    width: '100%',
                                                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                                                    transition: 'all 0.3s ease'
                                                }}
                                            >
                                                <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
                                                Detayları Gör
                                            </button>
                                </div>
                            )
                        })}
                    </div>
                        ) : null}
                    </>
                )}
            </main>

            {/* Veritabanı Paneli */}
            <DatabasePanel 
                isOpen={showDatabasePanel} 
                onClose={() => setShowDatabasePanel(false)} 
            />
        </div>
    );
};

export default UserDashboard;