import React, { Component, CSSProperties } from 'react';
import classNames from "classnames";
import { Location } from "../utils/types";
import { gridLocations, loc2Str } from "../boardgen/graphUtils";
import { DDBoardSpec } from "../boardgen/ddBoardgen";
import '../css/solutionDisplayBoard.css';
import '../css/monsters.css';

export type SolutionDisplayBoardProps = {
    spec: DDBoardSpec,
    annotation?: string,
    scale?: number,
    monsterChoices?: Map<string, number>,
    /** When true, hides the wall/floor solution — only clues (treasures, dead-ends) are visible. */
    hideSolution?: boolean,
};
type SolutionDisplayBoardState = {
    copied: boolean;
};

export class SolutionDisplayBoard extends Component<SolutionDisplayBoardProps, SolutionDisplayBoardState> {
    canvasRef: React.RefObject<HTMLCanvasElement>;

    constructor(props: SolutionDisplayBoardProps) {
        super(props);
        this.canvasRef = React.createRef();
        this.state = { copied: false };
    }

    handleCopy = () => {
        navigator.clipboard.writeText(this.props.spec.url);
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2000);
    };

    blockSquareClassnames = (loc: Location) => {
        const { floors, deadends, treasure } = this.props.spec;
        const { monsterChoices, hideSolution } = this.props;
        const isLeaf = deadends.check(loc);
        const isTreasure = treasure.check(loc);
        const monsterId = monsterChoices?.get(loc2Str(loc));

        // When hiding the solution, all cells look neutral except clues.
        const isFloor = hideSolution ? false : floors.check(loc);

        return classNames({
            'block-square': true,
            'block-square--present': isFloor && !hideSolution,
            'block-square--absent': !isFloor || hideSolution,
            'block-square--1neighbour': isLeaf,
            'block-square--treasure': isTreasure,
            'block-square--deadend': isLeaf && monsterId !== undefined,
            [`block-square--monster${monsterId}`]: isLeaf && monsterId !== undefined,
        });
    }


    render() {
        const { size, throneSpec } = this.props.spec.rules;
        const st = {
            '--board-height': size.height,
            '--board-width': size.width,
            '--scale': this.props.scale || 1.0,
        } as CSSProperties;
        const baseClasses = classNames({
            'simple-grid-board': true,
            'simple-grid-board--solved': !this.props.hideSolution,
            'simple-grid-board--unsolved': this.props.hideSolution,
        });

        return (<>


            <div className={baseClasses} style={st} key={'simple-grid-board'}>
                <div className={'simple-grid-board__grid'} key={'simple-grid-board__grid'}>
                    {this.columnHints()}
                    {gridLocations(size).map((row, i) => {
                        const wallCounts = this.props.spec.wallCounts;
                        return <>
                            <div className={this.counterClasses('row', wallCounts.rows[i], 0)}
                                key={`rowhint${i}`}>
                                {wallCounts.rows[i]}
                            </div>
                            {row.map(loc =>
                                <div className={this.blockSquareClassnames(loc)} key={loc2Str(loc)}>
                                    { }
                                </div>
                            )}
                        </>;
                    }
                    )}
                </div>
            </div>
            {this.props.hideSolution ||
                <>
                    <br />

                    <button
                        className={`btn btn--copy ${this.state.copied ? 'btn--copy-done' : ''}`}
                        onClick={this.handleCopy}
                    >
                        {this.state.copied ? '✅ Copied!' : '📋 Copy puzzle URL'}
                    </button></>
            }
        </>
        );
    }

    counterClasses(orientation: string, required: number, current: number) {
        return classNames({
            'simple-grid-board__count': true,
            [`simple-grid-board__count--${orientation}`]: true,
            'simple-grid-board__count--undersatisfied': current < required,
            'simple-grid-board__count--satisfied': current == required,
            'simple-grid-board__count--oversatisfied': current > required
        });
    }

    private columnHints() {
        return <>
            <div className={'simple-grid-board--topcorner'} key={'topcorner'}>{this.props.annotation}</div>

            { }

            {this.props.spec.wallCounts.cols.map((cnt, i) =>
                <div className={this.counterClasses('col', cnt, 0)} key={`colhint${i}`}>
                    {cnt}
                    {/*<p className={'simple-grid-board__count__text'}> {cnt}</p>*/}
                </div>)}

        </>
    }
}
