import React from 'react';
import logoImg from '../../../assets/images/logo.png';

export function LoginBrandHeader() {
  return (
    <header 
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        marginBottom: '32px',
        width: '100%',
      }}
    >
      {/* Brand Identity Graphical Asset Instead of Text Heading Element */}
      <div 
        style={{ 
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
        aria-hidden="true"
      >
        <img 
          src={logoImg} 
          alt="" 
          style={{ 
            width: '160px', 
            height: 'auto', 
            display: 'block' 
          }}
        />
      </div>

      {/* Brand Typography Title Zone Block Element */}
      <p 
        style={{
          fontFamily: 'Montserrat',
          fontSize: '14px',
          fontWeight: 700,
          color: '#1C1C1C',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          margin: 0,
        }}
      >
        Enderas Asset Management
      </p>
    </header>
  );
}

export default LoginBrandHeader;