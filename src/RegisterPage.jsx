// src/RegisterPage.jsx
import React, { useState } from 'react';
import './App.css';
import PaydaLogo from './components/PaydaLogo';

const RegisterPage = ({ role, onBack, onRegisterSuccess }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [taxId, setTaxId] = useState('');
    const [phone, setPhone] = useState('');
    const [edevletDocument, setEdevletDocument] = useState(null);
    const [edevletDocumentPreview, setEdevletDocumentPreview] = useState(null);
    const [edevletQrData, setEdevletQrData] = useState('');
    const [sgkDocument, setSgkDocument] = useState(null); // SGK döküm evrağı
    const [sgkDocumentPreview, setSgkDocumentPreview] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const isSeller = role === 'seller';
    const isVolunteer = role === 'volunteer'; // Gönüllü kaydı için e-devlet belgesi gerekli
    const isUser = role === 'user'; // İhtiyaç sahibi kaydı için SGK döküm evrağı gerekli

    // Başlıkları rollere göre ayarlıyoruz
    const getTitle = () => {
        if (role === 'user') return "İhtiyaç Sahibi Kaydı";
        if (role === 'donor') return "Bağışçı Kaydı";
        if (role === 'volunteer') return "Gönüllü Kaydı (E-Devlet Onaylı)";
        if (role === 'seller') return "Şirket Kaydı";
        return "Kayıt Ol";
    };

    // Backend'e gönderilecek rol ismi
    const roleForBackend = role === 'user' ? 'beneficiary' : (role === 'seller' ? 'merchant' : role);

    // E-devlet belgesi yükleme
    const handleDocumentUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Dosya boyutu kontrolü (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('Dosya boyutu 5MB\'dan küçük olmalıdır.');
                return;
            }
            
            // Dosya tipi kontrolü (PDF, JPG, PNG)
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(file.type)) {
                setError('Sadece PDF, JPG veya PNG dosyaları yüklenebilir.');
                return;
            }

            setEdevletDocument(file);
            
            // Önizleme oluştur
            const reader = new FileReader();
            reader.onloadend = () => {
                setEdevletDocumentPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // SGK döküm evrağı yükleme
    const handleSgkDocumentUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Dosya boyutu kontrolü (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('Dosya boyutu 5MB\'dan küçük olmalıdır.');
                return;
            }
            
            // Dosya tipi kontrolü (PDF, JPG, PNG)
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(file.type)) {
                setError('Sadece PDF, JPG veya PNG dosyaları yüklenebilir.');
                return;
            }

            setSgkDocument(file);
            
            // Önizleme oluştur
            const reader = new FileReader();
            reader.onloadend = () => {
                setSgkDocumentPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // İhtiyaç sahibi kaydı için beneficiary registration oluştur (SGK döküm evrağı ile)
        if (isUser) {
            try {
                // SGK belgesi kontrolü
                if (!sgkDocument) {
                    setError('SGK döküm evrağı gereklidir.');
                    setLoading(false);
                    return;
                }

                // Belge dosyasını base64'e çevir
                let documentFileBase64 = null;
                if (sgkDocument) {
                    const reader = new FileReader();
                    documentFileBase64 = await new Promise((resolve, reject) => {
                        reader.onloadend = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(sgkDocument);
                    });
                }

                // Beneficiary registration oluştur
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 saniye (dosya yükleme için daha uzun)

                const registrationRes = await fetch('http://localhost:8080/beneficiary-registrations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: name,
                        email: email,
                        password: password,
                        sgk_document_file: documentFileBase64,
                        sgk_document_url: null
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!registrationRes.ok) {
                    let errorData;
                    try {
                        errorData = await registrationRes.json();
                    } catch {
                        errorData = { detail: `Sunucu hatası: ${registrationRes.status} ${registrationRes.statusText}` };
                    }
                    setError(errorData.detail || 'Kayıt başarısız oldu.');
                    setLoading(false);
                    return;
                }

                const registrationData = await registrationRes.json();

                alert('Kayıt başvurunuz alındı! SGK döküm evrağınız admin tarafından incelenecek. Onaylandıktan sonra giriş yapabileceksiniz.');
                onBack();
                return;
            } catch (err) {
                console.error('Kayıt hatası:', err);
                if (err.name === 'AbortError') {
                    setError('İstek zaman aşımına uğradı. Backend çalışıyor mu?');
                } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
                    setError('Backend\'e bağlanılamadı. Backend\'in http://localhost:8080 adresinde çalıştığından emin olun.');
                } else {
                    setError(`Kayıt gönderilirken bir hata oluştu: ${err.message || 'Bilinmeyen hata'}`);
                }
                setLoading(false);
                return;
            }
        }

        // Gönüllü kaydı için e-devlet belgesi kontrolü
        if (isVolunteer && !edevletDocument && !edevletQrData.trim()) {
            setError('Gönüllü kaydı için e-devlet belgesi veya QR kod verisi gereklidir.');
            setLoading(false);
            return;
        }

        // Gönüllü kaydı için volunteer application oluştur
        if (isVolunteer) {
            try {
                // Belge dosyasını base64'e çevir
                let documentFileBase64 = null;
                if (edevletDocument) {
                    const reader = new FileReader();
                    documentFileBase64 = await new Promise((resolve, reject) => {
                        reader.onloadend = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(edevletDocument);
                    });
                }

                // Volunteer application oluştur
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 saniye (dosya yükleme için daha uzun)

                const volunteerRes = await fetch('http://localhost:8080/volunteer-applications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: name,
                        email: email,
                        phone: phone || null,
                        edevlet_document_url: null,
                        edevlet_qr_data: edevletQrData.trim() || null,
                        document_file: documentFileBase64
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!volunteerRes.ok) {
                    let errorData;
                    try {
                        errorData = await volunteerRes.json();
                    } catch {
                        errorData = { detail: `Sunucu hatası: ${volunteerRes.status} ${volunteerRes.statusText}` };
                    }
                    setError(errorData.detail || 'Gönüllü başvurusu oluşturulamadı.');
                    setLoading(false);
                    return;
                }

                const volunteerData = await volunteerRes.json();

                alert('Gönüllü başvurunuz alındı! E-devlet belgeniz admin tarafından incelenecek. Onaylandıktan sonra giriş yapabileceksiniz.');
                onBack();
                return;
            } catch (err) {
                console.error('Gönüllü başvuru hatası:', err);
                if (err.name === 'AbortError') {
                    setError('İstek zaman aşımına uğradı. Backend çalışıyor mu?');
                } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
                    setError('Backend\'e bağlanılamadı. Backend\'in http://localhost:8080 adresinde çalıştığından emin olun.');
                } else {
                    setError(`Gönüllü başvurusu gönderilirken bir hata oluştu: ${err.message || 'Bilinmeyen hata'}`);
                }
                setLoading(false);
                return;
            }
        }

        // Normal kayıt (gönüllü değilse)
        // Backend'in beklediği Request Body'yi oluştur
        const body = {
            name: isSeller ? taxId : name, // Seller için vergi numarası name olarak kullanılacak (login için)
            email: email,
            password: password, // Şifreyi backend'e gönder
            role: roleForBackend,
        };

        // Şirket için ekstra bilgi: şirket adı
        if (isSeller) {
            body.company_name = name; // Şirket adını ayrı bir alan olarak gönder
        }

        try {
            // Timeout ile fetch işlemi (15 saniye)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            // Backend'deki /users (POST) endpoint'i yeni kullanıcı oluşturur
            const res = await fetch('http://localhost:8080/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!res.ok) {
                let errorData;
                try {
                    errorData = await res.json();
                } catch {
                    errorData = { detail: `Sunucu hatası: ${res.status} ${res.statusText}` };
                }
                setError(errorData.detail || errorData.message || 'Kayıt başarısız oldu.');
                setLoading(false);
                return;
            }

            let data;
            try {
                data = await res.json();
            } catch (jsonErr) {
                setError('Sunucudan geçersiz yanıt alındı. Backend çalışıyor mu?');
                setLoading(false);
                return;
            }

            alert(`Kayıt Başarılı! Hoş Geldin, ${data.name || name}. Şimdi giriş yapabilirsin.`);
            // Kayıt başarılı olunca Login ekranına geri dön
            onBack();

        } catch (err) {
            console.error('Kayıt hatası:', err);
            if (err.name === 'AbortError') {
                setError('İstek zaman aşımına uğradı. Backend çalışıyor mu?');
            } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
                setError('Backend\'e bağlanılamadı. Backend\'in http://localhost:8080 adresinde çalıştığından emin olun.');
            } else {
                setError(`Hata: ${err.message || 'Bilinmeyen bir hata oluştu'}`);
            }
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card" style={{ maxWidth: isSeller ? '500px' : '400px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                    <PaydaLogo size={60} showText={true} onClick={onBack} darkBackground={false} />
                </div>
                <p className="subtitle">{getTitle()}</p>

                <form onSubmit={handleRegister}>
                    {/* Seller için özel alanlar */}
                    {isSeller ? (
                        <>
                            <div className="input-group">
                                <label>Şirket Adı</label>
                                <input type="text" placeholder="Şirket Adı" value={name} onChange={(e) => setName(e.target.value)} className="input-field" required />
                            </div>
                            <div className="input-group">
                                <label>Vergi Numarası (VKN)</label>
                                <input type="text" placeholder="Vergi Numarası (Giriş için kullanılacak)" value={taxId} onChange={(e) => setTaxId(e.target.value)} className="input-field" required />
                            </div>
                            <div className="input-group">
                                <label>E-posta</label>
                                <input type="email" placeholder="E-posta Adresiniz" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" required />
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Diğer roller için ortak alanlar */}
                            <div className="input-group">
                                <label>Ad Soyad</label>
                                <input type="text" placeholder="Adınız ve Soyadınız" value={name} onChange={(e) => setName(e.target.value)} className="input-field" required />
                            </div>
                            <div className="input-group">
                                <label>E-posta</label>
                                <input type="email" placeholder="E-posta Adresiniz" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" required />
                            </div>
                            {isVolunteer && (
                                <div className="input-group">
                                    <label>Telefon (Opsiyonel)</label>
                                    <input type="tel" placeholder="Telefon Numaranız" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" />
                                </div>
                            )}
                        </>
                    )}

                    {/* İhtiyaç Sahibi kaydı için SGK Döküm Evrağı */}
                    {isUser && (
                        <>
                            <div className="input-group">
                                <label>
                                    <i className="fas fa-file-medical" style={{ marginRight: '8px' }}></i>
                                    SGK Döküm Evrağı (PDF, JPG, PNG) *
                                </label>
                                <input 
                                    type="file" 
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={handleSgkDocumentUpload}
                                    className="input-field"
                                    style={{ padding: '8px' }}
                                    required
                                />
                                {sgkDocumentPreview && (
                                    <div style={{ marginTop: '10px' }}>
                                        <img 
                                            src={sgkDocumentPreview} 
                                            alt="SGK belgesi önizleme" 
                                            style={{ 
                                                maxWidth: '100%', 
                                                maxHeight: '200px', 
                                                border: '1px solid #ddd',
                                                borderRadius: '5px',
                                                marginTop: '5px'
                                            }} 
                                        />
                                        <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                                            Yüklenen dosya: {sgkDocument.name}
                                        </p>
                                    </div>
                                )}
                                <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                                    SGK döküm evrağınızı yükleyin (Maksimum 5MB)
                                </small>
                            </div>
                            <div style={{
                                background: '#fff3cd',
                                border: '1px solid #ffc107',
                                borderRadius: '8px',
                                padding: '12px',
                                marginBottom: '15px',
                                fontSize: '14px',
                                color: '#856404'
                            }}>
                                <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
                                <strong>Önemli:</strong> SGK döküm evrağınız admin gönüllüler tarafından incelenecek ve onaylandıktan sonra giriş yapabileceksiniz.
                            </div>
                        </>
                    )}

                    {/* Gönüllü kaydı için E-Devlet Belgesi */}
                    {isVolunteer && (
                        <>
                            <div className="input-group">
                                <label>
                                    <i className="fas fa-file-pdf" style={{ marginRight: '8px' }}></i>
                                    E-Devlet Belgesi (PDF, JPG, PNG) *
                                </label>
                                <input 
                                    type="file" 
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={handleDocumentUpload}
                                    className="input-field"
                                    style={{ padding: '8px' }}
                                />
                                {edevletDocumentPreview && (
                                    <div style={{ marginTop: '10px' }}>
                                        <img 
                                            src={edevletDocumentPreview} 
                                            alt="Belge önizleme" 
                                            style={{ 
                                                maxWidth: '100%', 
                                                maxHeight: '200px', 
                                                border: '1px solid #ddd',
                                                borderRadius: '5px',
                                                marginTop: '5px'
                                            }} 
                                        />
                                        <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                                            Yüklenen dosya: {edevletDocument.name}
                                        </p>
                                    </div>
                                )}
                                <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                                    E-devlet belgenizi yükleyin (Maksimum 5MB)
                                </small>
                            </div>
                            <div className="input-group">
                                <label>
                                    <i className="fas fa-qrcode" style={{ marginRight: '8px' }}></i>
                                    E-Devlet QR Kod Verisi (Opsiyonel)
                                </label>
                                <input 
                                    type="text" 
                                    placeholder="QR kod verisini buraya yapıştırın" 
                                    value={edevletQrData} 
                                    onChange={(e) => setEdevletQrData(e.target.value)} 
                                    className="input-field" 
                                />
                                <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                                    Eğer belge yükleyemiyorsanız, QR kod verisini girebilirsiniz
                                </small>
                            </div>
                            <div style={{
                                background: '#fff3cd',
                                border: '1px solid #ffc107',
                                borderRadius: '8px',
                                padding: '12px',
                                marginBottom: '15px',
                                fontSize: '14px',
                                color: '#856404'
                            }}>
                                <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
                                <strong>Önemli:</strong> E-devlet belgeniz admin tarafından incelenecek ve onaylandıktan sonra giriş yapabileceksiniz.
                            </div>
                        </>
                    )}

                    {/* Şifre Alanı */}
                    <div className="input-group">
                        <label>Şifre Oluştur</label>
                        <input type="password" placeholder="Şifreniz (Giriş için kullanılacak)" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" required />
                    </div>

                    {error && (<div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>)}

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? "Kayıt Oluşturuluyor..." : "Kayıt Ol"}
                    </button>
                </form>

                <button 
                    onClick={(e) => {
                        e.preventDefault();
                        if (onBack) {
                            onBack();
                        }
                    }} 
                    className="back-btn" 
                    style={{ 
                        marginTop: '20px',
                        background: 'transparent',
                        border: 'none',
                        color: '#666',
                        fontSize: '14px',
                        cursor: 'pointer',
                        padding: '10px',
                        width: '100%',
                        textAlign: 'center',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.color = '#333';
                        e.target.style.textDecoration = 'underline';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.color = '#666';
                        e.target.style.textDecoration = 'none';
                    }}
                >
                    <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i>
                    Giriş Ekranına Geri Dön
                </button>
            </div>
        </div>
    );
};

export default RegisterPage;