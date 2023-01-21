import React from 'react';
import SkyLight from 'react-skylight';

class RulesPopup extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {

        var myBigGreenDialog = {
            backgroundColor: '#77C76E',
            color: '#ffffff',
            width: '70%',
            height: '80%',
            marginTop: '-35%',
            marginLeft: '-35%',
        };

        return (
          <>
              <button className={'button game-button__rules'} onClick={() => this.customDialog.show()}>Rules</button>
              <SkyLight dialogStyles={myBigGreenDialog} hideOnOverlayClicked ref={ref => this.customDialog = ref}
                        title="Kuromasu Rules">
                  <ul>
                      <li>
                          Every tile needs to be red or blue.
                      </li>
                      <li>
                          Numbers indicate how many blues a tile needs to be able to see.
                      </li>
                      <li>
                          A blue tile is said to "see" another blue tile if the (horizontal/vertical only) path to it
                          contains no red tiles.
                      </li>
                      <li>
                          The blue tiles are all connected. Moving between adjacent blue tiles, you can visit them all.
                          More technically, they form a single connected component.
                      </li>
                      <li>
                          Click around making tiles red and blue until you have a configuration that is consistent with
                          the provided information. I promise there is only 1 such configuration for a given initial
                          setup.
                      </li>
                      <br/>
                      Check out <a href='https://0hn0.com/'>0h n0</a> for a quick tutorial with nice animation.
                  </ul>
              </SkyLight>
          </>
        )
    }
}

export default RulesPopup;
