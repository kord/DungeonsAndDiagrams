import React, { Component } from 'react';
import { Modal } from './modal';
import '../css/rulesModal.css';

const rulesList = [
    'Every spot in the terrifying labyrinth is either a floor or a wall.',
    'Rows and columns list the number of walls they contain. Put all of the walls in the right place to win.',
    'All of the floor space in the labyrinth is connected.',
    'Every dead end has a monster in it, every monster is in a dead end.',
    `Treasure chests are in a 3x3 room with only one exit. They can be located in any of the room's 9 floor spaces`,
    'Nowhere outside a treasure room is there a 2x2 floor area, the corridors are tight.',
    `Mark walls with left click, floors with right click, and press Z to undo. Sorry if you're on a touch device.`,
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
                                <li key={i} className="rules__list-item">{r}</li>
                            ))}
                        </ol>
                        <p className="rules__credit">
                            This is an original puzzle by{' '}
                            <a href="https://en.wikipedia.org/wiki/Zachtronics">Zachtronics</a>
                            {' '}from{' '}
                            <a href="https://www.zachtronics.com/last-call-bbs/">Last Call BBS</a>.
                        </p>
                    </Modal>
                )}
            </>
        );
    }
}
