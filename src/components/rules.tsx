import React, { Component } from 'react';
import { Modal } from './modal';

import '../css/rulesModal.css';

const rulesList = [
    { icon: '🧱', text: 'Every spot in the labyrinth is either a floor or a wall.' },
    { icon: '🔢', text: 'Rows and columns list the number of walls they contain. Place all walls correctly to win.' },
    { icon: '🔗', text: 'All floor space in the labyrinth is connected.' },
    { icon: '👹', text: 'Every dead end has a monster in it — every monster is in a dead end.' },
    { icon: '💰', text: 'Treasure chests sit in a 3×3 room with only one exit. They can be in any of the room\'s 9 floor spaces.' },
    { icon: '🟫', text: 'Nowhere outside a treasure room is there a 2×2 floor area — the corridors are tight.' },
    { icon: '🖱️', text: 'Left-click to mark a wall, right-click for floor. Press Z to undo.' },
];

type RulesButtonState = {
    open: boolean;
};

export class RulesButton extends Component<{}, RulesButtonState> {
    constructor(props: {}) {
        super(props);
        this.state = { open: false };
    }

    open = () => this.setState({ open: true });
    close = () => this.setState({ open: false });

    render() {
        return (
            <>
                <button className={'btn'} onClick={this.open}>📜 Rules</button>
                {this.state.open && (
                    <Modal title="Rules" onClose={this.close}>
                        <ol className="rules__list">
                            {rulesList.map((r, i) => (
                                <li key={i} className="rules__item">
                                    <span className="rules__icon">{r.icon}</span>
                                    <span className="rules__text">{r.text}</span>
                                </li>
                            ))}
                        </ol>
                        <p className="rules__credit">
                            An original puzzle by{' '}
                            <a href="https://en.wikipedia.org/wiki/Zachtronics" target="_blank" rel="noreferrer">Zachtronics</a>
                            {' '}from{' '}
                            <a href="https://www.zachtronics.com/last-call-bbs/" target="_blank" rel="noreferrer">Last Call BBS</a>.
                        </p>
                    </Modal>
                )}
            </>
        );
    }
}
