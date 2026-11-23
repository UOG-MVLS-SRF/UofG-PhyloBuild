import React from "react";
import './Updates.css';
import Header from "../HomePage/Header";
import Footer from "../HomePage/Footer";

class Updates extends React.Component {

constructor(props) {
        super(props);

        this.state = {
            updates: []
        };
    }

    componentDidMount() {

        //Get the list of update files
        fetch("/updates.json")

        // Checks that the response is recieved correctly
            .then(response => {

                if (!response.ok) {
                    throw new Error(
                        `Could not load updates.json: ${response.status} ${response.statusText}`
                    );
                }

                return response.json();
            })

            .then(files => {

                // Get the contents of every update file
                return Promise.all(
                    files.map(file =>
                        fetch(`/UpdateText/${file}`)
                            .then(response => response.text())
                    )
                );

            })

            .then(textFiles => {

                // Convert each text file into an update object
                const updates = textFiles.map(text => {

                    const lines = text
                        .split(/\r?\n/)
                        .filter(line => line.trim() !== "");

                    return {
                        title: lines[0],
                        points: lines.slice(1)
                    };

                });

                this.setState({
                    updates: updates
                });

            });
    }

    render(){

        return(
        <>
        <Header/>
        <div className="container_updates">
            <h1 className="update_heading">Updates</h1>

            {this.state.updates.map((update, index) => (

                <details className="update_container" key={index}>

                    <summary className="update_title">
                        {update.title}
                    </summary>

                    <ul className="update_contents">
                        {update.points.map((point, pointIndex) => (
                            <li key={pointIndex}>
                                {point}
                            </li>
                        ))}
                    </ul>

                </details>

                ))}
        </div>
        <Footer/>
        </>
        )
    }
}

export default Updates