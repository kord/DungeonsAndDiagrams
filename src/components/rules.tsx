import React, {Component} from 'react';
import Swal from 'sweetalert2';
import '../css/rulesModal.css';

const rulesList = [
    'Every spot in the terrifying labyrinth is either a floor or a wall.',
    'Rows and columns list the number of walls they contain. Put all of the walls in the right place to win.',
    'All of the floor space in the labyrinth is connected.',
    'Every dead end has a monster in it, every monster is in a dead end.',
    `Treasure chests are in a 3x3 room with only one exit. They can be located in any of the room's 9 floor spaces`,
    'Nowhere outside a treasure room is there a 2x2 floor area, the corridors are tight.',
    `Mark walls with left click, floors with right click, and press ctrl-z to undo. Sorry if you're on a touch device.`,
];


let liClasses = 'rules__list-item';
const rli = rulesList.map((r, i) => `<li key=${i} class="${liClasses}">${r}</li>`).join('\n')

function showModal(p1: React.MouseEvent<HTMLButtonElement>) {
    Swal.fire({
        title: '<strong>Rules</strong>',
        icon: 'question',
        html:
            '<ol>' +
            rli +
            '</ol>' +
            '<br/>' +
            `This is an original puzzle by <a href='https://en.wikipedia.org/wiki/Zachtronics'>` +
            `Zachtronics</a> from <a href='https://www.zachtronics.com/last-call-bbs/'>` +
            `Last Call BBS</a>.`,

        width: '80%',
        showCloseButton: false,
        showConfirmButton: false,
    });
}

export class RulesButton extends Component {
    render() {
        return (
            <button onClick={showModal}>Rules</button>
        );
    }
}

