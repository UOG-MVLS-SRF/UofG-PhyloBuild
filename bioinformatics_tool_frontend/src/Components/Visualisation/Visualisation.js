import React from "react";
import './Visualisation.css';
import ApiService from "../../service";
import CsvTable from "./CsvTable/CsvTable";
import Tree from "../Tree/Tree";


class Visualisation extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            reactSession: JSON.parse(localStorage.getItem("__react_session__")),
            label: [],
            color: [],
            group: [],
            csvData: [],
            isRFileSelected: false,
            offsetValue: 15, // Add this line
        }
        this.treeFileInputRef = React.createRef(); // Reference for tree file input
        this.sampleSheetFileInputRef = React.createRef(); // Reference for sample sheet file input
        this.RFileInputRef = React.createRef();
    }


    handleUploadClick = () => {
        this.treeFileInputRef.current.click();
    };
    handleUploadClickGeneral = (field) => {
        if (field === this.RFileInputRef) {
            this.setState({isRFileSelected: true})
        }
        field.current.click();
    };


    // Function to handle file input change event
    handleFileChange = async (event) => {
        const file = event.target.files[0];

        const sessionId = this.state.reactSession ? this.state.reactSession.session_id : null;

        try {
            const text = await file.text(); // Wait for the file's text to be read
            // Now that you have the text, you can proceed with the API call
            await ApiService.uploadData(sessionId, file.name, text, "data_tree");
        } catch (error) {
            console.error("Error reading file:", error);
            // Handle any errors that occur during the read process
        }
    };

    handleLoadClick = () => {
        this.sampleSheetFileInputRef.current.click();
    };

    parseCsvText = (text) => {
        // Split the text into rows at the newline character
        const rows = text.split('\n');

        // Skip the first row (header) and then map the rest of the rows
        return rows.slice(1).map(row => {
            // First, split by comma
            const initialSplit = row.split(',');

            // Then further split each element by backslash and flatten the result
            return initialSplit.flatMap(column => column.split('\t'));
        });
    }


    loadSampleSheet = async (event) => {
        const file = event.target.files[0];

        try {
            const text = await file.text();
            this.setState({csvData: this.parseCsvText(text)}); // Update state with parsed data

        } catch (error) {
            console.error("Error reading file:", error);
        }
    }

    handleDataChangeInCsv = (newValue, rowIndex, colIndex) => {
        // Create a deep copy of the csvData array
        const updatedCsvData = [...this.state.csvData];
        updatedCsvData[rowIndex] = [...updatedCsvData[rowIndex]];
        updatedCsvData[rowIndex][colIndex] = newValue;

        // Update the state with the new csvData
        this.setState({csvData: updatedCsvData});
    };
    // Method to handle bulk updates
    onBulkDataChange = (newData) => {
        this.setState({data: newData});
    };

    handleOffsetSubmit = async () => {
        const sessionId = this.state.reactSession ? this.state.reactSession.session_id : null;
        const offsetValue = this.state.offsetValue; // Get the current offset value from state
        if (sessionId && offsetValue !== 15) { // Check if both are available
            try {
                await ApiService.submitOffset(sessionId, offsetValue);
                alert("Offset update successful"); // Notify the user of success
            } catch (error) {
                console.error("Error submitting offset:", error);
                alert("Failed to update offset"); // Notify the user of failure
            }
        } else {
            alert("Offset is missing"); // Notify the user if something is missing
        }
    }


    handleSubmitCsv = async () => {
        const sessionId = this.state.reactSession ? this.state.reactSession.session_id : null;
        if (this.state.csvData.length !== 0) {
            const stringCsv = this.state.csvData.toString()
            await ApiService.uploadSampleSheet(sessionId, stringCsv);
        }
    }


    render() {
        let button_upload_tree
        if (this.props.tree) {
            button_upload_tree = <div className="wrapper">
                <button className="Button_vis" disabled>Upload Tree</button>
            </div>
        } else {
            button_upload_tree = <div className="wrapper">
                {/* Hidden file input */}
                <input
                    type="file"
                    style={{display: 'none'}}
                    ref={this.treeFileInputRef}
                    onChange={this.handleFileChange}
                />
                {/* Visible button that triggers file input */}
                <button className="Button_vis" onClick={this.handleUploadClick}>Upload Tree</button>
            </div>
        }

        let OffsetSection = <>
            <button className="Button_vis" onClick={this.handleOffsetSubmit}>Offset</button>
            <input
                className="Input_vis"
                type="number"
                value={this.state.offsetValue}
                onChange={(e) => this.setState({offsetValue: e.target.value})}
            />
        </>


        return (
            <>

                <div id="box_wrapper_vis">
                    <div className="row">
                        {button_upload_tree}
                        <input
                            type="file"
                            style={{display: 'none'}}
                            ref={this.RFileInputRef}
                            onChange={this.handleFileChange}
                        />
                        {this.state.isRFileSelected && (OffsetSection)}

                        <button className="Button_vis"
                                onClick={() => this.handleUploadClickGeneral(this.RFileInputRef)}>Upload R Script
                        </button>


                    </div>
                    <div className="row" id="sample_sheet">
                        <input
                            type="file"
                            style={{display: 'none'}}
                            ref={this.sampleSheetFileInputRef}
                            onChange={this.loadSampleSheet}
                        />
                        <button className="Button_vis" onClick={this.handleLoadClick}>Upload Sample Sheet</button>
                    </div>
                    <CsvTable data={this.state.csvData} onDataChange={this.handleDataChangeInCsv}
                              onBulkDataChange={this.onBulkDataChange}/>
                    {this.state.csvData.length > 0 && (
                        <button className="Button_vis" onClick={this.handleSubmitCsv}>Submit Sheet</button>
                    )}


                    <div className="row">

                    </div>
                </div>
            </>
        )
    }
}

export default Visualisation