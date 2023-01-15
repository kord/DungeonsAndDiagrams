import React, {Component, CSSProperties} from 'react';
import classNames from "classnames";
import {Location} from "../boardgen/types";
import {gridLocations, loc2Str} from "../boardgen/graphUtils";
import {DDBoardSpec} from "../boardgen/ddBoardgen";
import '../css/playBoard.css';

export type PlayBoardProps = {
    spec: DDBoardSpec,
};
type PlayBoardState = {};

export class PlayBoard extends Component<PlayBoardProps, PlayBoardState> {
    canvasRef: React.RefObject<HTMLCanvasElement>;

    constructor(props: PlayBoardProps) {
        super(props);
        this.canvasRef = React.createRef();
        this.state = {};
    }

    blockSquareClassnames = (loc: Location) => {
        const {grid, deadends, treasure, throneCenters} = this.props.spec;
        const isFloor = grid.check(loc);
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
            // '--side-color': wrap.wrapX ? 'white' : 'black',
            // '--top-bottom-color': wrap.wrapY ? 'white' : 'black',
        } as CSSProperties;

        // --side-color: black;
        // --top-bottom-color: black;

        return (<>

                <div className={'play-board'} style={st}>
                    <div className={'play-board__grid'}>
                        {this.columnHints()}
                        {gridLocations(size).map((row, i) => {
                                const wallCounts = this.props.spec.wallCounts;
                                return <>
                                    <div className={this.counterClasses('row', wallCounts.rows[i], 0)} key={`rowhint${i}`}>
                                        {wallCounts.rows[i]}
                                        {/*<p className={'play-board__count__text'}> {wallCounts.rows[i]}</p>*/}
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
                <br/>
            </>
        );
    }

    counterClasses(orientation: string, required: number, current: number) {
        let fig: Record<string, boolean> = {};
        fig[`play-board__count`] = true;
        fig[`play-board__count--${orientation}`] = true;
        fig[`play-board__count--undersatisafied`] = current < required;
        fig[`play-board__count--satisafied`] = current == required;
        fig[`play-board__count--oversatisafied`] = current > required;
        return classNames(fig);
    }

    private columnHints() {
        return <>
            <div className={'play-board--topcorner'}/>
            {this.props.spec.wallCounts.cols.map((cnt, i) =>
                <div className={this.counterClasses('col', cnt, 0)} key={`colhint${i}`}>
                    {cnt}
                    {/*<p className={'play-board__count__text'}> {cnt}</p>*/}
                </div>)}

        </>
    }
}
