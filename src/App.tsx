import React from 'react';
import './App.css';
import {PuzzleGame} from "./components/puzzleGame";
import RulesPopup from './components/rulesPopup';

function App() {

    return (
        <div className="App">
            <header className="App-header">
                {/*<img src={logo} className="App-logo" alt="logo" />*/}
                <p>
                    Dungeons and Diagrams
                </p>

            </header>

            <div>
                <RulesPopup/>
                {/*<p>fff</p>*/}
                <PuzzleGame/>
            </div>

        </div>
    );
}

export default App;
