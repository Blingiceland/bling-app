import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import WhatsOn from './pages/WhatsOn';
import Whiskeys from './pages/Whiskeys';
import Merch from './pages/Merch';
import BookDillon from './pages/BookDillon';
import Footer from './components/Footer';
import './index.css';
import tabIcon from './assets/tab-icon.png';

// Hidden redirect component for /stefna
function StefnaRedirect() {
    useEffect(() => {
        window.location.href = 'https://dillonstefna.vercel.app/';
    }, []);
    return null;
}

// Hidden redirect component for /staff
function StaffRedirect() {
    useEffect(() => {
        window.location.href = 'https://dillon-beta.vercel.app/staff';
    }, []);
    return null;
}

function App() {
    useEffect(() => {
        // Dynamically set the favicon
        const link = document.querySelector("link[rel~='icon']");
        if (link) {
            link.href = tabIcon;
        } else {
            const newLink = document.createElement('link');
            newLink.rel = 'icon';
            newLink.href = tabIcon;
            document.head.appendChild(newLink);
        }

        // Set page title
        document.title = 'Dillon';
    }, []);

    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/stefna" element={<StefnaRedirect />} />
                    <Route path="/staff" element={<StaffRedirect />} />
                </Routes>
                <Navbar />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/events" element={<WhatsOn />} />
                    <Route path="/whiskeys" element={<Whiskeys />} />
                    <Route path="/merch" element={<Merch />} />
                    <Route path="/bookdillon" element={<BookDillon />} />
                </Routes>

                <Footer />
            </div>
        </Router>
    );
}

export default App;

