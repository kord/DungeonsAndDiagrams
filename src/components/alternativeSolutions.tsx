import React, { Component } from 'react';
import { DDBoardSpec, monsterChoices } from "../boardgen/ddBoardgen";
import { ddSolve } from "../boardgen/ddSolver";
import { MutableGrid } from "../utils/mutableGrid";
import { SolutionDisplayBoard } from "./solutionDisplayBoard";
import { hashString, loc2Str } from "../boardgen/graphUtils";
// @ts-ignore
import '../css/alternativeSolutions.css';

export type AlternativeSolutionsProps = {
    spec: DDBoardSpec;
};

type SolverSolution = {
    wallGrid: MutableGrid;
    thrones: { x: number; y: number }[];
};

type AlternativeSolutionsState = {
    solutions: SolverSolution[];
    computed: boolean;
};

/**
 * Runs the SAT solver on a puzzle and displays all valid (connected-floorplan)
 * solutions as mini boards, so the user can compare them side-by-side.
 */
export class AlternativeSolutionsPanel extends Component<AlternativeSolutionsProps, AlternativeSolutionsState> {
    constructor(props: AlternativeSolutionsProps) {
        super(props);
        this.state = { solutions: [], computed: false };
    }

    componentDidMount() {
        this.computeSolutions();
    }

    componentDidUpdate(prevProps: AlternativeSolutionsProps) {
        if (prevProps.spec !== this.props.spec) {
            this.computeSolutions();
        }
    }

    computeSolutions() {
        const raw = ddSolve(this.props.spec, 20);
        this.setState({ solutions: raw, computed: true });
    }

    /** Build a minimal DDBoardSpec from a solver solution for display. */
    buildDisplaySpec(soln: SolverSolution, index: number): { spec: DDBoardSpec; monsters: Map<string, number> } {
        const { spec } = this.props;
        const size = spec.rules.size;
        const walls = soln.wallGrid;
        const floors = walls.inverted();

        // Deterministic monster assignment, same as the original puzzle.
        const seed = hashString(
            walls.stringEncoding() + '|' +
            soln.thrones.map(loc2Str).sort().join(',')
        );
        const monsters = monsterChoices(floors, seed);

        return {
            spec: {
                rules: { size, throneSpec: { attemptFirst: 1, attemptSubsequent: 1 } },
                walls,
                floors,
                deadends: floors.leafGrid(),
                treasure: MutableGrid.fromLocs(size, soln.thrones),
                wallCounts: walls.profile(true),
                floorCounts: floors.profile(true),
                throneCount: soln.thrones.length,
                monsterChoices: monsters,
                url: '',
            } as DDBoardSpec,
            monsters,
        };
    }

    render() {
        const { solutions, computed } = this.state;

        if (!computed) {
            return (
                <div className={'alt-solutions'}>
                    <div className={'alt-solutions__header'}>
                        <h3 className={'alt-solutions__title'}>Alternative Solutions</h3>
                    </div>
                    <p className={'alt-solutions__loading'}>Computing…</p>
                </div>
            );
        }

        if (solutions.length === 0) {
            return (
                <div className={'alt-solutions'}>
                    <div className={'alt-solutions__header'}>
                        <h3 className={'alt-solutions__title'}>Alternative Solutions</h3>
                    </div>
                    <p className={'alt-solutions__empty'}>No solutions found.</p>
                </div>
            );
        }

        const uniqueLabel = solutions.length === 1
            ? '✅ Unique solution'
            : `⚠️ ${solutions.length} valid solutions found`;

        return (
            <div className={'alt-solutions'}>
                <div className={'alt-solutions__header'}>
                    <h3 className={'alt-solutions__title'}>Alternative Solutions</h3>
                    <span className={`alt-solutions__badge ${solutions.length > 1 ? 'alt-solutions__badge--multi' : ''}`}>
                        {uniqueLabel}
                    </span>
                </div>
                <div className={'alt-solutions__grid'}>
                    {solutions.map((soln, i) => {
                        const { spec: displaySpec, monsters } = this.buildDisplaySpec(soln, i);
                        return (
                            <div className={'alt-solutions__item'} key={i}>
                                <div className={'alt-solutions__label'}>Solution {i + 1}</div>
                                <SolutionDisplayBoard
                                    spec={displaySpec}
                                    monsterChoices={monsters}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
}
