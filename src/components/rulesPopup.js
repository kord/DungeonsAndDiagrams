import React from 'react';
import SkyLight from 'react-skylight';

class RulesPopup extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const myBigGreenDialog = {
      backgroundColor: '#77C76E',
      color: '#ffffff',
      width: '70%',
      height: '70%',
      marginTop: '-18%',
      marginLeft: '-35%',
    };

    const rulesList = [
      'Every spot in our terrifying labyrinth is either a floor or a wall.',
      'All of the floor space in the labyrinth is connected.',
      'Every dead end has a monster in it, every monster is in a dead end.',
      'Treasure chests are in a 3x3 room with only one exit.',
      'Nowhere outside a treasure room is there a 2x2 floor area, the corridors are tight.',
      'Put all of the walls in the right place to win.',
      'Mark walls with left click, floors with right click, and press ctrl-z to undo.',
    ];
    return (
      <>
        <button className={'button game-button__rules'} onClick={() => this.customDialog.show()}>Rules</button>
        <SkyLight dialogStyles={myBigGreenDialog} hideOnOverlayClicked ref={ref => this.customDialog = ref}
                  title="Dungeons and Diagrams Rules">
          <ul>
            {rulesList.map((r, i) => <li key={i}>{r}</li>)}
            <br/>
            This is an original puzzle by <a href={'https://en.wikipedia.org/wiki/Zachtronics'}>
            Zachtronics</a> from the game <a href={'https://www.zachtronics.com/last-call-bbs/'}>
            Last Call BBS</a>.
          </ul>
        </SkyLight>
      </>
    )
  }
}

export default RulesPopup;
