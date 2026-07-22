import React, { Component } from 'react';
import { applyTheme, getDarkModePreference, setStoredBool } from '../utils/localStorage';
import '../css/darkModeToggle.css';

type DarkModeToggleState = {
    dark: boolean;
};

export class DarkModeToggle extends Component<{}, DarkModeToggleState> {
    constructor(props: {}) {
        super(props);
        this.state = { dark: getDarkModePreference() };
    }

    toggle = () => {
        const next = !this.state.dark;
        setStoredBool('darkMode', next);
        this.setState({ dark: next }, applyTheme);
    };

    render() {
        const label = this.state.dark ? '☀️' : '🌙';
        return (
            <button
                className="dark-mode-toggle"
                onClick={this.toggle}
                title={this.state.dark ? 'Switch to light mode' : 'Switch to dark mode'}
                aria-label={this.state.dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
                {label}
            </button>
        );
    }
}
