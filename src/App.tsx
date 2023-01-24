import React from 'react';
import {PuzzleGame} from "./components/puzzleGame";
import './App.css';

function App() {

    return (
        <div className="App">
            <header className="App-header">
                <h1>
                    Dungeons and Diagrams
                </h1>

            </header>

            <div>
                <PuzzleGame/>
            </div>

        </div>
    );
}

export default App;
