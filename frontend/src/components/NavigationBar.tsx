import React, { useState, useEffect } from 'react';
import { motion, useSpring, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavItem {
  label: string;
  id: string;
  path: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', id: 'dashboard', path: '/dashboard' },
  { label: 'Network', id: 'network', path: '/network' },
  { label: 'Email', id: 'email', path: '/email' },
  { label: 'Alerts', id: 'alerts', path: '/alerts' },
];

const NavigationBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveSection = (): string => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'dashboard';
    if (path.includes('/network')) return 'network';
    if (path.includes('/email')) return 'email';
    if (path.includes('/alerts')) return 'alerts';
    return 'dashboard';
  };

  const [activeSection, setActiveSection] = useState<string>(getActiveSection());
  const [expanded, setExpanded] = useState<boolean>(false);
  const [hovering, setHovering] = useState<boolean>(false);

  const pillWidth = useSpring(140, { stiffness: 220, damping: 25, mass: 1 });

  useEffect(() => {
    setActiveSection(getActiveSection());
  }, [location.pathname]);

  useEffect(() => {
    if (hovering) {
      setExpanded(true);
      pillWidth.set(580);
    } else {
      setExpanded(false);
      pillWidth.set(140);
    }
  }, [hovering, pillWidth]);

  const handleSectionClick = (item: NavItem) => {
    setActiveSection(item.id);
    navigate(item.path);
    setHovering(false);
  };

  return (
    <motion.nav
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        width: pillWidth,
        height: '56px',
        borderRadius: '28px',
        background: 'linear-gradient(135deg, #fcfcfd, #e2e3e6)',
        boxShadow: expanded
          ? `0 12px 24px rgba(0,0,0,0.14)`
          : '0 3px 6px rgba(0,0,0,0.12)',
        overflow: 'hidden',
        margin: '10px auto',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {!expanded ? (
        <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
          {navItems.find((item) => item.id === activeSection)?.label}
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSectionClick(item)}
              style={{
                background: 'none',
                border: 'none',
                color: item.id === activeSection ? '#1a1a1a' : '#656565',
                fontWeight: item.id === activeSection ? 'bold' : 'normal',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </motion.nav>
  );
};

export default NavigationBar;
