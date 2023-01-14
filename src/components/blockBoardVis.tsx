import React, {Component, CSSProperties} from 'react';
import {BoardSpecOld} from "../boardgen/boardgen";
import classNames from "classnames";
import {render} from 'graphology-canvas';
import forceLayout from "graphology-layout-force";
import {Location} from "../boardgen/types";
import {gridLocations, loc2Str} from "../boardgen/graphUtils";
import './blockBoardVis.css';

export type BlockGraphProps = {
    spec: BoardSpecOld,
};
type BlockGraphState = {};

export class BlockBoardVis extends Component<BlockGraphProps, BlockGraphState> {
    canvasRef: React.RefObject<HTMLCanvasElement>;

    constructor(props: BlockGraphProps) {
        super(props);
        this.canvasRef = React.createRef();
        this.state = {};
    }

    // TODO: Sort this out
    // https://codesandbox.io/s/eloquent-albattani-1ymeyj?file=/src/index.ts
    //
    drawCanvas = () => {
        const graph = this.props.spec.graph;

        forceLayout.assign(graph, 50);
        //
        // {
        //     const sensibleSettings = forceAtlas2.inferSettings(graph);
        //     forceAtlas2.assign(graph, {
        //         iterations: 5000,
        //         settings: sensibleSettings
        //     });
        // }

        const context = this.canvasRef.current?.getContext('2d')

        if (context) {
            // context.strokeStyle = 'black'
            // context.strokeText('hi', 50, 50,)
            render(graph, context, {batchSize: 500, width: 300})

            // render(graph, context, {width: 300});
        }
    }

    classNames1 = (loc: Location) => {
        const nodeName = loc2Str(loc);
        const {graph, maxDistancePairs} = this.props.spec;
        const present = graph.hasNode(nodeName);

        return classNames({
            'block-square': true,
            'block-square--present': present,
            'block-square--absent': !present,
            'block-square--1neighbour': present && graph.degree(nodeName) === 1,
            'block-square--2neighbour': present && graph.degree(nodeName) === 2,
            'block-square--3neighbour': present && graph.degree(nodeName) === 3,
            'block-square--4neighbour': present && graph.degree(nodeName) === 4,
            'block-square--with-longest-path': maxDistancePairs.some(p => p.some(node => node === nodeName)),
        });
    }


    render() {
        const {size, wrap} = this.props.spec.rules;
        const st = {
            '--board-height': size.height,
            '--board-width': size.width,
            '--side-color': wrap.wrapX ? 'white' : 'black',
            '--top-bottom-color': wrap.wrapY ? 'white' : 'black',
        } as CSSProperties;

        // --side-color: black;
        // --top-bottom-color: black;

        return (<>

                <div className={'block-board-vis'} style={st}>
                    <div className={'block-board-vis__grid'}>
                        {gridLocations(size).flat().map(loc =>
                            <div className={this.classNames1(loc)} key={loc2Str(loc)}>
                                {/*{this.props.spec.graph.hasNode(loc2Str(loc)) ? this.props.spec.graph.degree(loc2Str(loc)) : ''}*/}
                            </div>
                        )}
                    </div>
                </div>
                <br/>
                <canvas height={300} width={300} ref={this.canvasRef}/>
                <button onClick={this.drawCanvas}>Draw</button>
            </>
        );
    }
}
