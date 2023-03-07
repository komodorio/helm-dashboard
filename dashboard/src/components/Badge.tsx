import React from 'react';
import './App.css';

function Badge({children}: {children: React.ReactNode}) {
    return <span className="badge">{children}</span>
}