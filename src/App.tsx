import React from 'react';
import './App.css';
import {PuzzleGame} from "./components/puzzleGame";

function App() {

    return (
        <div className="App">
            <header className="App-header">
                {/*<img src={logo} className="App-logo" alt="logo" />*/}
                <p>
                    Things.
                </p>

            </header>

            <div>
            <p>fff</p>
                <PuzzleGame/>
            </div>

        </div>
    );
}

export default App;
