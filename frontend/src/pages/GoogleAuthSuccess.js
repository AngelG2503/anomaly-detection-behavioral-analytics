import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const GoogleAuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const name = searchParams.get('name');
    const email = searchParams.get('email');

    if (token && refreshToken) {
      // Store token (same as Login.js)
      localStorage.setItem('token', token);
      
      // Store user data (same as Login.js)
      const userData = {
        name: decodeURIComponent(name),
        email: decodeURIComponent(email),
        role: 'user'
      };
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Small delay to ensure storage is complete, then redirect
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } else {
      // If no token, redirect to login
      navigate('/login');
    }
  }, [searchParams, navigate]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f2f5',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        {/* Loading Spinner */}
        <div style={{
          width: '60px',
          height: '60px',
          border: '6px solid #e0e0e0',
          borderTop: '6px solid #4285f4',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        
        <h2 style={{ 
          color: '#333', 
          marginBottom: '10px',
          fontSize: '20px'
        }}>
          Signing you in...
        </h2>
        
        <p style={{ 
          color: '#666',
          fontSize: '14px'
        }}>
          Please wait while we complete your Google Sign-In
        </p>

        {/* CSS animation for spinner */}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default GoogleAuthSuccess;
