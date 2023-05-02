import React, {Component} from "react";
import {Options, OptionsProps} from "./options";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";

const MySwal = withReactContent(Swal);

export class OptionsButton extends Component<OptionsProps> {
    constructor(props: OptionsProps) {
        super(props);
    }

    showModal = (event: React.MouseEvent<HTMLButtonElement>) => {
        MySwal.fire({
            title: <h1>Options</h1>,
            // icon: 'question',
            // html: <p>hamburger</p>,
            html: <Options onChangeFn={this.props.onChangeFn}/>,
            width: '80%',
            showCloseButton: true,
            showConfirmButton: false,
        });
    }


    render() {
        return (
            <button className={'options-button'}
                    onClick={this.showModal}>Options</button>
        );
    }
}

