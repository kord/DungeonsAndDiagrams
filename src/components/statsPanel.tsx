import React, {Component} from 'react';
import {DDBoardSpec} from "../boardgen/ddBoardgen";
import '../css/statsPanel.css';

type StatsPanelProps = {
    puzzle: DDBoardSpec,
}

type StatsPanelState = {
    puzzleStats: PuzzleStats,
}

class StatsPanel extends Component<StatsPanelProps, StatsPanelState> {
    constructor(props: StatsPanelProps) {
        super(props);
        this.state = {
            puzzleStats: generateStats(this.props.puzzle),
        }
    }

    update() {
        this.setState({puzzleStats: generateStats(this.props.puzzle)});
    }

    render() {
        const stats = this.state.puzzleStats;
        return (
            <div className={'stats-panel'}>
                <h2>Stats</h2>
                <div className={'stats-panel--interior'}>
                    <p>Treasure Rooms</p> <p>{stats.treasureRoomCount}</p>
                    <p>Dead Ends</p> <p>{stats.deadEndCount}</p>
                    <p>Diameter</p> <p>{stats.diameter}</p>
                </div>
            </div>
        );
    }
}

type PuzzleStats = {
    treasureRoomCount: number,
    deadEndCount: number,
    diameter: number,
}

function generateStats(board: DDBoardSpec): PuzzleStats {
    const diameter = board.floors.calculateDiameter();
    return {
        treasureRoomCount: board.throneCount,
        deadEndCount: board.deadends.trueLocs().length,
        diameter: diameter ? diameter.distance : -1,
    }
}

export default StatsPanel;