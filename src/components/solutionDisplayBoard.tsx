import React, {Component, CSSProperties} from 'react';
import classNames from "classnames";
import {Location} from "../boardgen/types";
import {gridLocations, loc2Str} from "../boardgen/graphUtils";
import {DDBoardSpec} from "../boardgen/ddBoardgen";
import '../css/solutionDisplayBoard.css';

export type SolutionDisplayBoardProps = {
    spec: DDBoardSpec,
    annotation?: string,
    scale?: number,
};
type SolutionDisplayBoardState = {};

export class SolutionDisplayBoard extends Component<SolutionDisplayBoardProps, SolutionDisplayBoardState> {
    canvasRef: React.RefObject<HTMLCanvasElement>;

    constructor(props: SolutionDisplayBoardProps) {
        super(props);
        this.canvasRef = React.createRef();
        this.state = {};
    }

    blockSquareClassnames = (loc: Location) => {
        const {floors, deadends, treasure, throneCenters} = this.props.spec;
        const isFloor = floors.check(loc);
        const isLeaf = deadends.check(loc);
        const isTreasure = treasure.check(loc);
        const isCenter = throneCenters.check(loc);

        return classNames({
            'block-square': true,
            'block-square--present': isFloor,
            'block-square--absent': !isFloor,
            'block-square--1neighbour': isLeaf,
            'block-square--treasure': isTreasure,
            // 'block-square--center': isCenter,
        });
    }


    render() {
        const {size, throneSpec} = this.props.spec.rules;
        const st = {
            '--board-height': size.height,
            '--board-width': size.width,
            '--scale': this.props.scale || 1.0,
            // '--side-color': wrap.wrapX ? 'white' : 'black',
            // '--top-bottom-color': wrap.wrapY ? 'white' : 'black',
        } as CSSProperties;

        // --side-color: black;
        // --top-bottom-color: black;

        return (<>

                <div className={'simple-grid-board'} style={st} key={'simple-grid-board'}>
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
                                        {}
                                    </div>
                                )}
                            </>;
                            }
                        )}
                    </div>
                </div>
                {/*<br/>*/}
            </>
        );
    }

    counterClasses(orientation: string, required: number, current: number) {
        let fig: Record<string, boolean> = {};
        fig[`simple-grid-board__count`] = true;
        fig[`simple-grid-board__count--${orientation}`] = true;
        fig[`simple-grid-board__count--undersatisfied`] = current < required;
        fig[`simple-grid-board__count--satisfied`] = current == required;
        fig[`simple-grid-board__count--oversatisfied`] = current > required;
        return classNames(fig);
    }

    private columnHints() {
        return <>
            <div className={'simple-grid-board--topcorner'} key={'topcorner'}>{this.props.annotation}</div>
            {this.props.spec.wallCounts.cols.map((cnt, i) =>
                <div className={this.counterClasses('col', cnt, 0)} key={`colhint${i}`}>
                    {cnt}
                    {/*<p className={'simple-grid-board__count__text'}> {cnt}</p>*/}
                </div>)}

        </>
    }
}
