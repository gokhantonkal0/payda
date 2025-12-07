// src/data.js

export const coupons = [
    {
        id: 1,
        title: "KPSS Hazırlık Seti",
        category: "kirtasiye",
        company: "Dost Kitabevi",
        totalAmount: 1000,
        collected: 800,
        studentName: "Ahmet Y.",
        description: "Sınav hazırlığı için set gerekiyor."
    },
    {
        id: 2,
        title: "Öğrenci Menüsü (Haftalık)",
        category: "yemek",
        company: "Lezzet Dünyası",
        totalAmount: 500,
        collected: 0,
        studentName: "Ayşe K.",
        description: "Yurtta kalan öğrenci için yemek desteği."
    },
    {
        id: 3,
        title: "Kışlık Bot",
        category: "giyim",
        company: "Ayakkabı Dünyası",
        totalAmount: 1200,
        collected: 600,
        studentName: "Mehmet T.",
        description: "Kış gelmeden bot ihtiyacı."
    },
    {
        id: 4,
        title: "Fotokopi Desteği",
        category: "kirtasiye",
        company: "Kampüs Copy",
        totalAmount: 200,
        collected: 150,
        studentName: "Zeynep S.",
        description: "Ders notları için fotokopi bakiyesi."
    }
];

export const categories = [
    { id: 'all', label: 'Tümü', icon: 'fa-th-large' },
    { id: 'kirtasiye', label: 'Kırtasiye', icon: 'fa-pen' },
    { id: 'yemek', label: 'Yemek', icon: 'fa-utensils' },
    { id: 'giyim', label: 'Giyim', icon: 'fa-tshirt' },
    { id: 'elektronik', label: 'Elektronik', icon: 'fa-laptop' },
    { id: 'gida', label: 'Gıda', icon: 'fa-shopping-basket' }
];

// Alt kategoriler
export const subCategories = {
    giyim: [
        { id: 'ust-giyim', label: 'Üst Giyim', icon: 'fa-tshirt' },
        { id: 'alt-giyim', label: 'Alt Giyim', icon: 'fa-socks' },
        { id: 'ayakkabi', label: 'Ayakkabı', icon: 'fa-shoe-prints' },
        { id: 'dis-giyim', label: 'Dış Giyim', icon: 'fa-vest' },
        { id: 'aksesuar', label: 'Aksesuar', icon: 'fa-gem' },
        { id: 'ic-giyim', label: 'İç Giyim', icon: 'fa-tshirt' },
        { id: 'spor-giyim', label: 'Spor Giyim', icon: 'fa-running' },
        { id: 'okul-formasi', label: 'Okul Forması', icon: 'fa-graduation-cap' }
    ],
    elektronik: [
        { id: 'bilgisayar', label: 'Bilgisayar', icon: 'fa-laptop' },
        { id: 'telefon', label: 'Telefon', icon: 'fa-mobile-alt' },
        { id: 'tablet', label: 'Tablet', icon: 'fa-tablet-alt' },
        { id: 'kulaklik', label: 'Kulaklık', icon: 'fa-headphones' },
        { id: 'kamera', label: 'Kamera', icon: 'fa-camera' },
        { id: 'yazici', label: 'Yazıcı', icon: 'fa-print' },
        { id: 'monitor', label: 'Monitör', icon: 'fa-desktop' },
        { id: 'klavye-mouse', label: 'Klavye & Mouse', icon: 'fa-keyboard' }
    ],
    gida: [
        { id: 'temel-gida', label: 'Temel Gıda', icon: 'fa-bread-slice' },
        { id: 'sut-urunleri', label: 'Süt Ürünleri', icon: 'fa-cheese' },
        { id: 'et-balik', label: 'Et & Balık', icon: 'fa-drumstick-bite' },
        { id: 'meyve-sebze', label: 'Meyve & Sebze', icon: 'fa-apple-alt' },
        { id: 'bakliyat', label: 'Bakliyat', icon: 'fa-seedling' },
        { id: 'icecek', label: 'İçecek', icon: 'fa-glass-water' },
        { id: 'atistirmalik', label: 'Atıştırmalık', icon: 'fa-cookie' },
        { id: 'hazir-yemek', label: 'Hazır Yemek', icon: 'fa-utensils' }
    ]
};

// Örnek şirketler
export const companies = [
    'Şirket A', 'Şirket B', 'Şirket C', 'Şirket D', 'Şirket E',
    'Lezzet Dünyası', 'TeknoStore', 'Moda Evi', 'Dost Kitabevi',
    'Kampüs Copy', 'Ayakkabı Dünyası', 'Elektronik Market', 'Gıda Marketi'
];
// src/data.js dosyasının EN ALTINA ekle:

export const users = [
    { username: "ogrenci", password: "123", role: "student", name: "Ahmet Yılmaz" },
    { username: "gonullu", password: "123", role: "donor", name: "Zeynep Demir" },
    { username: "isletme", password: "123", role: "business", name: "Dost Kitabevi" }
];