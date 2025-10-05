import { auth, db, registerUser, loginUser, logoutUser, getUserData, addContact, removeContact, upgradeToPro, saveCheckIn } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const CONFIG = {
    emailjs: {
        publicKey: 'ChER9DcNgZNpoWa3e',
        serviceId: 'service_jcnx8sf',
        templateId: 'template_xz0tfut'
    },
    mapbox: {
        accessToken: 'pk.eyJ1IjoiMXNhZmVyZSIsImEiOiJjbWdkOHduNzQxbGhnMmlvY3dpczBzYXFwIn0.K7LYWTZy1mfvQAIVNPvpDg'
    }
};

emailjs.init(CONFIG.emailjs.publicKey);
mapboxgl.accessToken = CONFIG.mapbox.accessToken;

const app = {
    u: { plan: 'trial', name: '', email: '', contacts: [], loc: null, address: '', userId: null },
    ci: false, t: 1800, tmr: null, map: null, marker: null,
    
    notif(msg, type = 'success') {
        const n = document.createElement('div');
        n.className = 'notif';
        n.style.background = type === 'success' ? '#059669' : '#FF2B4E';
        n.textContent = msg;
        document.body.appendChild(n);
        setTimeout(() => n.remove(), 3000);
    },
    
    showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        if (id === 'contacts') this.updateContacts();
        if (id === 'home' && this.map) setTimeout(() => this.map.resize(), 100);
    },
    
    navTo(s, e) {
        this.showScreen(s);
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        e.target.closest('.nav-btn').classList.add('active');
    },
    
    selectPlan(p) { this.u.plan = p; this.showScreen('register'); },
    
    async register() {
        const n = document.getElementById('rn').value;
        const e = document.getElementById('re').value;
        const p = document.getElementById('rp').value;
        
        if (!n || !e || p.length < 6) { 
            this.notif('Fill all fields (password 6+ chars)', 'error'); 
            return; 
        }
        
        try {
            const user = await registerUser(n, e, p, this.u.plan);
            this.u.userId = user.uid;
            this.u.name = n;
            this.u.email = e;
            document.getElementById('un').textContent = n;
            if (this.u.plan === 'trial') document.getElementById('tb').style.display = 'inline-block';
            this.notif('Account created!');
            this.showScreen('home');
        } catch (error) {
            this.notif(error.message, 'error');
        }
    },
    
    async login() {
        const e = document.getElementById('le').value;
        const p = document.getElementById('lp').value;
        
        try {
            const user = await loginUser(e, p);
            const userData = await getUserData(user.uid);
            this.u = { ...userData, userId: user.uid, loc: null, address: '' };
            document.getElementById('un').textContent = userData.name;
            if (userData.plan === 'trial') document.getElementById('tb').style.display = 'inline-block';
            this.notif('Welcome back!');
            this.showScreen('home');
        } catch (error) {
            this.notif(error.message, 'error');
        }
    },
    
    async logout() {
        await logoutUser();
        this.u = { plan: 'trial', name: '', email: '', contacts: [], loc: null, address: '', userId: null };
        this.notif('Logged out');
        this.showScreen('pricing');
    },
    
    startCheckIn() {
        if (this.u.contacts.length === 0) { 
            this.notif('Add emergency contact first!', 'error'); 
            this.showScreen('contacts'); 
            return; 
        }
        this.ci = true; this.t = 1800;
        document.getElementById('stx').textContent = 'CHECKED IN';
        document.getElementById('st').classList.add('active');
        document.getElementById('dot').style.background = '#86efac';
        document.getElementById('tc').style.display = 'block';
        document.getElementById('cb').style.display = 'none';
        
        if (this.u.userId) {
            saveCheckIn(this.u.userId, this.u.loc, this.u.address);
        }
        
        this.notif('Check-in started - 30 min');
        this.tmr = setInterval(() => {
            this.t--; this.updateTimer();
            if (this.t <= 0) { 
                clearInterval(this.tmr); 
                confirm('Timer expired! Are you safe?') ? this.checkOut() : this.triggerSOS(); 
            }
        }, 1000);
    },
    
    updateTimer() {
        const m = Math.floor(this.t / 60), s = this.t % 60;
        document.getElementById('tm').textContent = m + ':' + s.toString().padStart(2, '0');
        document.getElementById('pg').style.strokeDashoffset = 351.86 - (this.t / 1800 * 351.86);
    },
    
    addTime() { this.t += 900; this.updateTimer(); this.notif('+15 min added'); },
    
    checkOut() {
        clearInterval(this.tmr); this.ci = false;
        document.getElementById('stx').textContent = 'NOT CHECKED IN';
        document.getElementById('st').classList.remove('active');
        document.getElementById('dot').style.background = '#6b7280';
        document.getElementById('tc').style.display = 'none';
        document.getElementById('cb').style.display = 'block';
        this.notif('Checked out safely!');
    },
    
    async saveContact() {
        const n = document.getElementById('cn').value, p = document.getElementById('cp').value, e = document.getElementById('ce').value;
        if (!n || !p) { this.notif('Name and phone required!', 'error'); return; }
        if (this.u.plan === 'trial' && this.u.contacts.length >= 1) {
            this.notif('Trial limited to 1 contact', 'error');
            document.getElementById('ub').style.display = 'block';
            return;
        }
        
        const contact = { name: n, phone: p, email: e };
        this.u.contacts.push(contact);
        
        if (this.u.userId) {
            await addContact(this.u.userId, contact);
        }
        
        document.getElementById('cn').value = ''; 
        document.getElementById('cp').value = ''; 
        document.getElementById('ce').value = '';
        this.notif('Contact added!'); 
        this.showScreen('contacts');
    },
    
    updateContacts() {
        const l = document.getElementById('cl');
        if (this.u.contacts.length === 0) {
            l.innerHTML = '<div style="text-align:center;padding:48px 0"><p style="color:#9ca3af">No contacts yet</p></div>';
        } else {
            l.innerHTML = this.u.contacts.map((c, i) => `<div class="contact-card"><div style="display:flex;align-items:center"><div style="width:48px;height:48px;background:#00B3FF;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-right:16px">👤</div><div><p style="font-weight:700">${c.name}</p><p style="font-size:14px;color:#9ca3af">${c.phone}</p></div></div><button style="background:none;border:none;color:#FF2B4E;cursor:pointer;font-size:20px" onclick="app.delContact(${i})">×</button></div>`).join('');
        }
        if (this.u.plan === 'trial' && this.u.contacts.length >= 1) {
            document.getElementById('ab').style.display = 'none'; 
            document.getElementById('ub').style.display = 'block';
        } else {
            document.getElementById('ab').style.display = 'block'; 
            document.getElementById('ub').style.display = 'none';
        }
        document.getElementById('pt').textContent = this.u.plan === 'trial' ? 'Trial: 1 contact max' : 'Pro: Unlimited';
    },
    
    async delContact(i) {
        if (confirm('Delete contact?')) { 
            const contact = this.u.contacts[i];
            this.u.contacts.splice(i, 1); 
            
            if (this.u.userId) {
                await removeContact(this.u.userId, contact);
            }
            
            this.notif('Contact deleted'); 
            this.updateContacts(); 
        }
    },
    
    async triggerSOS() {
        if (this.u.contacts.length === 0) { 
            this.notif('No contacts!', 'error'); 
            this.showScreen('contacts'); 
            return;
        }
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    await this.sendSOSAlerts(position.coords.latitude, position.coords.longitude);
                },
                async (error) => {
                    console.error('Location error on SOS:', error);
                    const lat = this.u.loc?.lat || 40.7128;
                    const lng = this.u.loc?.lng || -74.0060;
                    await this.sendSOSAlerts(lat, lng);
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            const lat = this.u.loc?.lat || 40.7128;
            const lng = this.u.loc?.lng || -74.0060;
            await this.sendSOSAlerts(lat, lng);
        }
    },

    async sendSOSAlerts(lat, lng) {
        const ts = new Date().toLocaleString();
        const ml = `https://maps.google.com/?q=${lat},${lng}`;
        
        let addr = '';
        try {
            const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${CONFIG.mapbox.accessToken}`);
            const data = await res.json();
            if (data.features && data.features[0]) {
                addr = data.features[0].place_name;
            }
        } catch (e) {
            console.error('Geocoding failed:', e);
        }
        
        if (!addr) {
            addr = `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
        
        console.log('Sending SOS with:', { address: addr, lat, lng });
        
        this.u.contacts.forEach(c => {
            if (c.email) {
                emailjs.send(CONFIG.emailjs.serviceId, CONFIG.emailjs.templateId, {
                    to_email: c.email, 
                    to_name: c.name, 
                    user_name: this.u.name,
                    latitude: lat.toFixed(6), 
                    longitude: lng.toFixed(6), 
                    address: addr,
                    time: ts, 
                    maps_link: ml
                }).then(
                    () => console.log('Email sent to:', c.email),
                    (error) => console.error('Email failed:', error)
                );
            }
            
            const msg = encodeURIComponent(`🚨 EMERGENCY from ${this.u.name}\n\nAddress: ${addr}\n\nCoordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}\n\nGoogle Maps: ${ml}\n\nTime: ${ts}\n\nCheck on me immediately!`);
            setTimeout(() => window.open(`sms:${c.phone}?&body=${msg}`, '_blank'), 100);
        });
        
        document.getElementById('sl').innerHTML = this.u.contacts.map(c => `<p style="margin-bottom:8px">✓ ${c.name} - ${c.email || c.phone}</p>`).join('');
        document.getElementById('sa').innerHTML = `<strong>${addr}</strong><br><small>${lat.toFixed(6)}, ${lng.toFixed(6)}</small>`;
        this.showScreen('sos');
    },
    
    async upgrade() {
        if (confirm('Upgrade to Pro for $3/month?\n\n(Demo - no charge)')) {
            this.u.plan = 'pro'; 
            document.getElementById('tb').style.display = 'none';
            
            if (this.u.userId) {
                await upgradeToPro(this.u.userId);
            }
            
            this.notif('Upgraded to Pro!'); 
            this.updateContacts();
        }
    },
    
    initMap(lat, lng) {
        if (!this.map) {
            this.map = new mapboxgl.Map({ container: 'map', style: 'mapbox://styles/mapbox/dark-v11', center: [lng, lat], zoom: 15, attributionControl: false });
            this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        }
        if (this.marker) this.marker.remove();
        const el = document.createElement('div');
        el.style.width = '32px'; el.style.height = '32px'; el.style.borderRadius = '50%';
        el.style.background = 'linear-gradient(135deg, #00B3FF, #0099DD)';
        el.style.border = '3px solid #fff'; el.style.boxShadow = '0 0 20px rgba(0, 179, 255, 0.8)';
        this.marker = new mapboxgl.Marker({ element: el }).setLngLat([lng, lat]).addTo(this.map);
        this.map.flyTo({ center: [lng, lat], zoom: 15 }); this.reverseGeocode(lat, lng);
    },
    
    async reverseGeocode(lat, lng) {
        try {
            const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${CONFIG.mapbox.accessToken}`);
            const data = await res.json();
            if (data.features && data.features[0]) {
                this.u.address = data.features[0].place_name;
                document.getElementById('addr').textContent = '📍 ' + this.u.address;
            }
        } catch (e) { document.getElementById('addr').textContent = `📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}`; }
    }
};

onAuthStateChanged(auth, async (user) => {
    if (user && !app.u.userId) {
        const userData = await getUserData(user.uid);
        app.u = { ...userData, userId: user.uid, loc: null, address: '' };
        document.getElementById('un').textContent = userData.name;
        if (userData.plan === 'trial') document.getElementById('tb').style.display = 'inline-block';
        app.showScreen('home');
    } else if (!user) {
        app.showScreen('splash');
    }
});

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        p => { app.u.loc = { lat: p.coords.latitude, lng: p.coords.longitude }; app.initMap(app.u.loc.lat, app.u.loc.lng); },
        () => { const f = { lat: 40.7128, lng: -74.0060 }; app.u.loc = f; app.initMap(f.lat, f.lng); document.getElementById('addr').textContent = '📍 Location unavailable'; }
    );
}

window.app = app;
