import React, { Component } from "react";
import { Options, OptionsProps } from "./options";
import { Modal } from "./modal";

export class OptionsButton extends Component<OptionsProps> {
    state = { open: false };

    open = () => this.setState({ open: true });
    close = () => this.setState({ open: false });

    render() {
        return (
            <>
                <button className="options-button" onClick={this.open}>
                    Options
                </button>
                {this.state.open && (
                    <Modal title="Options" onClose={this.close}>
                        <Options onChangeFn={this.props.onChangeFn} />
                    </Modal>
                )}
            </>
        );
    }
}

