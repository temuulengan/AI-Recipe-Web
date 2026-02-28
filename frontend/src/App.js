import React from 'react'
import Navbar from './components/navbar/Navbar'
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import Community from './pages/Community';
import AIRecipe from './pages/AIRecipe';
import LoginPage from './pages/Login';
import SignUpPage from './pages/SignUpPage';
import Dashboard from './pages/Dashboard';
import Footer from './components/Footer';
import PostDetail from './pages/PostDetail';
import AdminDashboard from './pages/AdminDashboard';
import UserDetail from './pages/UserDetail';
import RequireAdmin from './components/RequireAdmin';
import About from './pages/About';
import Contact from './pages/Contact';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/community" element={<Community />} />
        <Route path="/airecipe" element={<AIRecipe />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signuppage" element={<SignUpPage />} />
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
        <Route path="/admin/users/:id" element={<RequireAdmin><UserDetail /></RequireAdmin>} />
        <Route path="/community" element={<Community />} />
        <Route path="/community/:id" element={<PostDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>

      <Footer />
    </BrowserRouter>



  );
}

export default App;
