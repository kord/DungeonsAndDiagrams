import React, {Component, CSSProperties} from 'react';
import './blockBoardVis.css';
import {BlockBoard, loc2Str, Location, locations} from "../boardgen/boardgen";
import classNames from "classnames";

export type BlockGraphProps = {
    spec: BlockBoard,
};
type BlockGraphState = {};

export class BlockBoardVis extends Component<BlockGraphProps, BlockGraphState> {
    constructor(props: BlockGraphProps) {
        super(props);
        this.state = {};
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
        const {size} = this.props.spec;
        const st = {
            '--board-height': size.height,
            '--board-width': size.width,
        } as CSSProperties;

        return (
            <div className={'block-board-vis'} style={st}>
                {locations(size).map(loc =>
                    <div className={this.classNames1(loc)} key={loc2Str(loc)}>
                        {/*{this.props.spec.graph.hasNode(loc2Str(loc)) ? this.props.spec.graph.degree(loc2Str(loc)) : ''}*/}
                    </div>
                )}
            </div>
        );
    }
}
