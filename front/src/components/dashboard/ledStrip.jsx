import React from 'react';
import { ChromePicker } from 'react-color';
import {withAlert} from "react-alert";

export class LedStrip extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            red: LedStrip.convertTo8(this.props.red),
            green: LedStrip.convertTo8(this.props.green),
            blue: LedStrip.convertTo8(this.props.blue),
            warmWhite: LedStrip.convertTo8(this.props.warmWhite),
            lastCalled: Date.now()
        };
    }
    static mapPercent(color) {
        return color*255;
    }
    static convertTo8(color) {
        return color/16;
    }
    static convertTo12(color) {
        return color*16;
    }
    handleChange = (color, event) => {
        if (Date.now() > (this.state.lastCalled + 1)) {
            this.setState({lastCalled: Date.now()});
            const self = this;
            fetch(this.getUrl(color))
                .then(function (response) {
                    response.then(function(data) {

                    });
                })
                .catch(function (error) {

                });

            this.updateState(color);
        }
    };
    handleChangeComplete = (color, event) => {
        const self = this;
        this.props.alert.show('Coloring ' + this.props.name + " ...");
        fetch(this.getUrl(color))
            .then(function (response) {
                response.then(function(data) {
                    self.props.alert.success('Colored ' + self.props.name);
                });
            })
            .catch(function (error) {
                self.props.alert.error('Unable to color ' + self.props.name);
            });

        this.updateState(color);
    };
    updateState = (color) => {
        this.setState({
            red: color.rgb.r,
            green: color.rgb.g,
            blue: color.rgb.b,
            warmWhite: LedStrip.mapPercent(color.rgb.a)});
    };
    getUrl = (color) => {
        return "?route=ajax&action=setColor&id=" + this.props.id +
            "&r=" + LedStrip.convertTo12(color.rgb.r) + "&g=" + LedStrip.convertTo12(color.rgb.g) +
            "&b=" + LedStrip.convertTo12(color.rgb.b) + "&ww=" + LedStrip.convertTo12(LedStrip.mapPercent(color.rgb.a));
    };
    render() {
        return (
            <div>
                <ChromePicker color={{r: this.state.red,
                    g: this.state.green,
                    b: this.state.blue,
                    a: this.state.warmWhite}}
                    onChange={this.handleChange}
                    onChangeComplete={this.handleChangeComplete}/>
                <p>
                    <div className="container">
                        <div className="row">
                            <div className="col-sm">
                                {/*<Knob value={this.props.red} onChange={this.handleChange}/>*/}
                            </div>
                            <div className="col-sm">
                                {/*<Knob value={this.props.green} onChange={this.handleChange}/>*/}
                            </div>
                            <div className="col-sm">
                                {/*<Knob value={this.props.blue} onChange={this.handleChange}/>*/}
                            </div>
                            <div className="col-sm">
                                {/*<Knob value={this.props.warmWhite} onChange={this.handleChange}/>*/}
                            </div>
                        </div>
                    </div>
                </p>
                <hr />
            </div>
        );
    }
}

export default withAlert(LedStrip)