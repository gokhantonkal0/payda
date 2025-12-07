import { useState, useEffect } from 'react';
import './App.css';
import ErrorBoundary from './ErrorBoundary';

// Dosya yolları (User)
import UserLogin from "./pages/user/UserLogin.jsx";
import UserDashboard from "./pages/user/UserDashboard.jsx";
import RoleSelection from "./RoleSelection.jsx";

// Gönüllü (Donor)
import DonorLogin from "./pages/donor/DonorLogin.jsx";
import DonorDashboard from "./pages/donor/DonorDashboard.jsx";
import DonorApplication from "./pages/donor/DonorApplication.jsx";

// Şirket (Seller)
import SellerLogin from "./pages/seller/SellerLogin.jsx";
import SellerDashboard from "./pages/seller/SellerDashboard.jsx";

// Kayıt Sayfası
import RegisterPage from "./RegisterPage.jsx";

// Admin Gönüllü
import AdminVolunteerLogin from "./pages/admin/AdminVolunteerLogin.jsx";
import AdminPanel from "./components/AdminPanel.jsx";

function App() {
  const [currentScreen, setCurrentScreen] = useState('roleSelection');
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);

  // Sayfa yenilendiğinde localStorage'dan kullanıcı bilgisini yükle
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        
        // user.id kontrolü - eğer id yoksa localStorage'ı temizle
        if (!user || !user.id) {
          console.error('Kullanıcı ID bulunamadı:', user);
          localStorage.removeItem("user");
          return;
        }
        
        // Rolü frontend formatına çevir
        let role = 'user';
        if (user.role === 'merchant' || user.role === 'seller') {
          role = 'seller';
        } else if (user.role === 'donor') {
          role = 'donor';
        } else if (user.role === 'volunteer') {
          role = 'volunteer';
        } else if (user.role === 'user' || user.role === 'beneficiary' || user.role === 'admin') {
          role = 'user';
        }
        
        const userDataObj = { 
          name: user.username || user.name || 'Kullanıcı', 
          role: role, 
          id: user.id,
          balance: user.balance || 0
        };
        
        setUserData(userDataObj);
        setUserRole(role);
        setCurrentScreen('dashboard');
      } catch (err) {
        console.error('Kullanıcı bilgisi yüklenemedi:', err);
        localStorage.removeItem("user");
        setCurrentScreen('roleSelection');
      }
    }
  }, []);

  // 1. Rol Seçilince -> Login Ekranına Git (veya Gönüllü ise direkt kayıt)
  const handleRoleSelect = (role) => {
    setUserRole(role);
    if (role === 'volunteer') {
      // Gönüllü için direkt kayıt sayfasına git (e-devlet belgesi ile)
      setCurrentScreen('register');
    } else {
      setCurrentScreen('login');
    }
  };

  // 2. Login Başarılı Olunca -> Dashboard'a Git
  const handleLoginSuccess = (user) => {
    // user.id kontrolü yap
    if (!user || !user.id) {
      console.error('Kullanıcı bilgisi eksik:', user);
      return;
    }
    setUserData(user);
    setUserRole(user.role);
    setCurrentScreen('dashboard');
  };

  // 3. Geri Dönüşler (Çıkış Yapınca veya Kayıt sonrası rol seçimine döner)
  const goBackToRoles = () => {
    setCurrentScreen('roleSelection');
    setUserRole(null);
    setUserData(null);
    localStorage.removeItem("user"); // Çıkış yapınca localStorage'ı temizle
  };

  // --- YENİ EKLENEN: Kayıt Sayfasına Yönlendirme Fonksiyonu ---
  const handleGoToRegister = (role) => {
    setUserRole(role); // Hangi rolde kayıt olacağını App'e bildiriyoruz
    setCurrentScreen('register');
  };
  // -----------------------------------------------------------


  // --- EKRANLARI GÖSTERME MANTIĞI ---

  // A) ADMIN GÖNÜLLÜ GİRİŞ EKRANI
  if (currentScreen === 'adminVolunteerLogin') {
    return <ErrorBoundary><AdminVolunteerLogin
      onBack={goBackToRoles}
      onLoginSuccess={(user) => {
        setUserData(user);
        setUserRole('volunteer');
        setCurrentScreen('adminPanel'); // Direkt admin paneline yönlendir
      }}
    /></ErrorBoundary>;
  }

  // B) ADMIN PANEL EKRANI (Gönüllü adminler için)
  if (currentScreen === 'adminPanel' && userData && (userData.is_admin_volunteer || userData.role === 'volunteer')) {
    return <ErrorBoundary><AdminPanel
      user={userData}
      onBack={() => {
        setCurrentScreen('roleSelection');
        setUserData(null);
        setUserRole(null);
      }}
    /></ErrorBoundary>;
  }

  // C) GÖNÜLLÜ BAŞVURU EKRANI
  if (currentScreen === 'donorApplication') {
    return <ErrorBoundary><DonorApplication
      user={userData || { id: null, name: 'Başvuru Yapan' }}
      onBack={() => {
        setCurrentScreen('roleSelection');
        setUserData(null);
      }}
      onApplicationSuccess={() => {
        setCurrentScreen('roleSelection');
        setUserData(null);
      }}
    /></ErrorBoundary>;
  }

  // C) DASHBOARD (4 Rolün de Paneli Bağlı)
  if (currentScreen === 'dashboard') {
    // userData ve userRole kontrolü
    if (!userData || !userRole) {
      return (
        <ErrorBoundary>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            flexDirection: 'column',
            gap: '20px',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
          }}>
            <div className="spinner" style={{ 
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #2c3e50',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{ color: '#2c3e50', fontSize: '18px' }}>Yükleniyor...</p>
          </div>
        </ErrorBoundary>
      );
    }
    
    if (userRole === 'user') {
      return <ErrorBoundary><UserDashboard user={userData} onLogout={goBackToRoles} /></ErrorBoundary>;
    }
    if (userRole === 'donor') {
      return <ErrorBoundary><DonorDashboard user={userData} onLogout={goBackToRoles} /></ErrorBoundary>;
    }
    if (userRole === 'volunteer') {
      // Gönüllüler için de UserDashboard kullanılabilir veya ayrı bir dashboard oluşturulabilir
      return <ErrorBoundary><UserDashboard user={userData} onLogout={goBackToRoles} /></ErrorBoundary>;
    }
    if (userRole === 'seller') {
      return <ErrorBoundary><SellerDashboard user={userData} onLogout={goBackToRoles} /></ErrorBoundary>;
    }
    return <ErrorBoundary><div className="login-container"><h1>Yapım Aşamasında...</h1><button onClick={goBackToRoles}>Çıkış</button></div></ErrorBoundary>;
  }

  // D) LOGIN EKRANI (3 Rolün de Girişi Bağlı)
  if (currentScreen === 'login') {
    // LOGIN SAYFALARINA ARTIK KAYIT FONKSİYONUNU GEÇİRİYORUZ
    if (userRole === 'user') {
      return <ErrorBoundary><UserLogin
        onBack={goBackToRoles}
        onLoginSuccess={handleLoginSuccess}
        onGoToRegister={() => handleGoToRegister('user')} // 👈 YENİ
      /></ErrorBoundary>;
    }

    if (userRole === 'donor') {
      return <ErrorBoundary><DonorLogin
        onBack={goBackToRoles}
        onLoginSuccess={handleLoginSuccess}
        onGoToRegister={() => handleGoToRegister('donor')} // 👈 YENİ
      /></ErrorBoundary>;
    }

    if (userRole === 'seller') {
      return <ErrorBoundary><SellerLogin
        onBack={goBackToRoles}
        onLoginSuccess={handleLoginSuccess}
        onGoToRegister={() => handleGoToRegister('seller')} // 👈 YENİ
      /></ErrorBoundary>;
    }

    return <ErrorBoundary><div>Rol seçilmedi</div></ErrorBoundary>
  }

  // E) YENİ EKLENEN: KAYIT SAYFASI
  if (currentScreen === 'register') {
    // Kayıt başarılı olursa direkt Dashboard'a gitmek için onRegisterSuccess'i geçir
    return <ErrorBoundary><RegisterPage
      role={userRole}
      onBack={() => setCurrentScreen('login')} // Kayıttan sonra Login'e dön
      onRegisterSuccess={handleLoginSuccess}
    /></ErrorBoundary>;
  }

  // F) ROL SEÇİM EKRANI (Varsayılan)
  return (
    <ErrorBoundary>
      <div className="App">
        <RoleSelection 
          onSelectRole={handleRoleSelect}
          onAdminVolunteerLogin={() => setCurrentScreen('adminVolunteerLogin')}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;