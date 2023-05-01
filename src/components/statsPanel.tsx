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
                    <p className={'stat-name'}>Treasure Rooms</p>
                    <p className={'stat-value'}>{stats.treasureRoomCount}</p>
                    <p className={'stat-name'}>Dead Ends</p>
                    <p className={'stat-value'}>{stats.deadEndCount}</p>
                    <p className={'stat-name'}>Walls</p>
                    <p className={'stat-value'}>{stats.wallCount}</p>
                    <p className={'stat-name'}>Wall Density</p>
                    <p className={'stat-value'}>{`${Math.floor(stats.wallDensity * 1000) / 10}%`}</p>
                    <p className={'stat-name'}>Graph Diameter</p>
                    <p className={'stat-value'}>{stats.diameter}</p>
                </div>
            </div>
        );
    }
}

type PuzzleStats = {
    treasureRoomCount: number,
    deadEndCount: number,
    wallCount: number,
    wallDensity: number,
    diameter: number,
}

function generateStats(board: DDBoardSpec): PuzzleStats {
    const diameter = board.floors.calculateDiameter();
    const wallCount = board.walls.trueLocs().length;
    const totalLocs = board.rules.size.height * board.rules.size.width;
    return {
        treasureRoomCount: board.throneCount,
        deadEndCount: board.deadends.trueLocs().length,
        wallCount: wallCount,
        wallDensity: wallCount / totalLocs,
        diameter: diameter ? diameter.distance : -1,
    }
}

export default StatsPanel;