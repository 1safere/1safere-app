// Configuration - UPDATE THESE WITH YOUR API KEYS
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

// Initialize EmailJS
emailjs.init(CONFIG.emailjs.publicKey);

// Initialize Mapbox
mapboxgl.accessToken = CONFIG.mapbox.accessToken;

// Main App Object
const app = {
    // User data
    u: {
        plan: 'trial',
        name: '',
        email: '',
        contacts: [],
        loc: null,
        address: ''
    },
    
    // State variables
    ci: false,
    t: 1800,
    tmr: null,
    map: null,
    marker: null,
    
    // Show notification
    notif(msg, type = 'success') {
        const n = document.createElement('div');
        n.className = 'notif';
        n.style.background = type === 'success' ? '#059669' : '#FF2B4E';
        n.textContent = msg;
        document.body.appendChild(n);
        setTimeout(() => n.remove(), 3000);
    },
    
    // Show screen
    showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        if (id === 'contacts') this.updateContacts();
        if (id === 'home' && this.map) setTimeout(() => this.map.resize(), 100);
    },
    
    // Navigation
    navTo(s, e) {
        this.showScreen(s);
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        e.target.closest('.nav-btn').classList.add('active');
    },
    
    // Select plan
    selectPlan(p) {
        this.u.plan = p;
        this.showScreen('register');
    },
    
    // Register
    register() {
        const n = document.getElementById('rn').value;
        const e = document.getElementById('re').value;
        const p = document.getElementById('rp').value;
        
        if (!n || !e || p.length < 6) {
            this.notif('Fill all fields (password 6+ chars)', 'error');
            return;
        }
        
        this.u.name = n;
        this.u.email = e;
        document.getElementById('un').textContent = n;
        
        if (this.u.plan === 'trial') {
            document.getElementById('tb').style.display = 'inline-block';
        }
        
        this.notif('Account created!');
        this.showScreen('home');
    },
    
    // Login
    login() {
        this.u.name = 'Demo User';
        this.u.email = 'demo@1safere.com';
        document.getElementById('un').textContent = this.u.name;
        this.notif('Welcome back!');
        this.showScreen('home');
    },
    
    // Start check-in
    startCheckIn() {
        if (this.u.contacts.length === 0) {
            this.notif('Add emergency contact first!', 'error');
            this.showScreen('contacts');
            return;
        }
        
        this.ci = true;
        this.t = 1800;
        document.getElementById('stx').textContent = 'CHECKED IN';
        document.getElementById('st').classList.add('active');
        document.getElementById('dot').style.background = '#86efac';
        document.getElementById('tc').style.display = 'block';
        document.getElementById('cb').style.display = 'none';
        
        this.notif('Check-in started - 30 min');
        
        this.tmr = setInterval(() => {
            this.t--;
            this.updateTimer();
            if (this.t <= 0) {
                clearInterval(this.tmr);
                confirm('Timer expired! Are you safe?') ? this.checkOut() : this.triggerSOS();
            }
        }, 1000);
    },
    
    // Update timer display
    updateTimer() {
        const m = Math.floor(this.t / 60);
        const s = this.t % 60;
        document.getElementById('tm').textContent = m + ':' + s.toString().padStart(2, '0');
        document.getElementById('pg').style.strokeDashoffset = 351.86 - (this.t / 1800 * 351.86);
    },
    
    // Add time
    addTime() {
        this.t += 900;
        this.updateTimer();
        this.notif('+15 min added');
    },
    
    // Check out
    checkOut() {
        clearInterval(this.tmr);
        this.ci = false;
        document.getElementById('stx').textContent = 'NOT CHECKED IN';
        document.getElementById('st').classList.remove('active');
        document.getElementById('dot').style.background = '#6b7280';
        document.getElementById('tc').style.display = 'none';
        document.getElementById('cb').style.display = 'block';
        this.notif('Checked out safely!');
    },
    
    // Save contact
    saveContact() {
        const n = document.getElementById('cn').value;
        const p = document.getElementById('cp').value;
        const e = document.getElementById('ce').value;
        
        if (!n || !p) {
            this.notif('Name and phone required!', 'error');
            return;
        }
        
        if (this.u.plan === 'trial' && this.u.contacts.length >= 1) {
            this.notif('Trial limited to 1 contact', 'error');
            document.getElementById('ub').style.display = 'block';
            return;
        }
        
        this.u.contacts.push({ name: n, phone: p, email: e });
        document.getElementById('cn').value = '';
        document.getElementById('
