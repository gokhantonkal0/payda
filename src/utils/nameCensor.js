/**
 * İsim soyisim sansürleme fonksiyonu
 * Örnek: "Ahmet Yılmaz" -> "A*** Y****"
 * Örnek: "Mehmet" -> "M****"
 */
export const censorName = (fullName) => {
    if (!fullName || typeof fullName !== 'string') {
        return '***';
    }
    
    const names = fullName.trim().split(/\s+/);
    
    if (names.length === 0) {
        return '***';
    }
    
    // Her isim için ilk harfi göster, geri kalanını * ile değiştir
    const censored = names.map(name => {
        if (name.length === 0) return '';
        if (name.length === 1) return name;
        
        const firstLetter = name[0].toUpperCase();
        const rest = '*'.repeat(Math.min(name.length - 1, 3)); // Max 3 yıldız
        return firstLetter + rest;
    });
    
    return censored.join(' ');
};





