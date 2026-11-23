import React from "react";
import './CarriageGene.css';
import Popup from 'reactjs-popup';
import FileList from "../FileList/FileList";
import FileTransferIntro from "../FileTransferIntro/FileTransferIntro";

class CarriageGene extends React.Component {
    constructor(props){
        super(props)

        this.handleChange = this.handleChange.bind(this);
        this.state = {
                is_open_upload_genome: false,
                is_open_upload_carriage_gene: false
                //genome_database_button :
                //<button class="Button_gene" disabled={!!this.props.tree}>
                //Genome Database </button>,
                //is_open_genome_database: false,
            }
    }

    handleChange = value => e => {
        this.setState({[value] : e.target.value});
    }

    removeFile = filename => {
        this.props.removeFile(filename)
    }

    handleSubmission = e => {
        this.props.handleSubmission(e)
        this.setState({ is_open_upload_genome: false })
    }

    clearAll = input => {
        this.props.clearAll(input, "carriage_gene")
    }

    removeCarriageGeneFile = filename => {
        this.props.removeFile(filename, "carriage_gene")
    }

    removeGenomeFile = filename => {
        this.props.removeFile(filename, "genome_tree")
    }

    handleCarriageGeneSubmission = e => {
        this.props.handleCarriageGeneSubmission(e)
        this.setState({ is_open_upload_carriage_gene: false })
    }

    handleOpen = field_name => e => {
        this.setState({ [field_name]: true });
      }
      
    handleClose = field_name => e => {
        e.preventDefault();
        this.setState({ [field_name]: false });
    }

    handleGenomeDatabase = input => e => {
        this.props.handleGenomeDatabaseSubmission(input)
    }
    
    render(){
        const uploadGenomeButton = (
            <button
                className="Button_gene"
                disabled={!!this.props.tree}
                onClick={this.handleOpen("is_open_upload_genome")}
            >
                Upload Genome
            </button>
        );
        let uploadButtons;

        uploadButtons = <div id="block">
                            {/* <Popup
                            className="genepopup"
                            trigger={this.state.genome_database_button}
                            on='click'
                            open={this.state.is_open_genome_database}
                            onOpen={this.handleOpen("is_open_genome_database")}
                            modal>
                                <div className="row">
                                    <div className="block">
                                        <div className="genome_database_labels_gene" id="checkbox_input" align="left">
                                            <input type="checkbox" onChange={this.handleGenomeDatabase("E Coli")}/>
                                            <label id="label_main_options">
                                                E. Coli
                                            </label>
                                        </div>

                                        <div className="genome_database_labels_gene" id="checkbox_input" align="left">
                                            <input type="checkbox" onChange={this.handleGenomeDatabase("Lentivirus")}/>
                                            <label id="label_main_options">
                                                Lentivirus
                                            </label>
                                        </div>
                                        <button className="gene_upload_button" onClick={this.handleClose("is_open_genome_database")}>Cancel</button>
                                    </div>
                                </div>
                            </Popup> */}
                            <Popup
                            className="genepopup" 
                            trigger={uploadGenomeButton}
                            on='click'
                            open={this.state.is_open_upload_genome}
                            onOpen={this.handleOpen("is_open_upload_genome")}
                            modal>
                                Upload the genomes in .fasta/.fa/.txt/.csv file format. To know more check the FAQ.
                                <form id="form-file-upload">
                                <input type="file" id="input-file-upload" multiple={true} onChange={this.handleSubmission}/>
                                <label id="label-file-upload" htmlFor="input-file-upload">
                                    <div>
                                    <p className="gene_upload_button">Upload files</p>
                                    <button className="gene_upload_button" onClick={this.handleClose("is_open_upload_genome")}>Cancel</button>
                                    </div> 
                                </label>
                                </form>
                            </Popup>
                            <FileTransferIntro />
                        </div>


        return(
            <>
            <div id="box_wrapper_gene">
                <div className="step_heading_gene">
                    Step 1.1 - Upload Genomes
                </div>
                <div className="blockBoxGene">
                    <div className="row">
                        <div className="block">
                            {uploadButtons}
                        </div>
                        <div className="block">
                            <div className="lists">
                                <FileList list={this.props.genome_file} size="large" removeFile={this.removeGenomeFile}/>
                            </div>
                            <div className="row">
                                <button class="Button_extra_gene" onClick={() => this.clearAll("genome_tree")}>Clear All</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="step_heading_gene">
                    Step 1.2 - Upload Carriage Genes
                </div>
                <div className="blockBoxGene">
                    <div className="row">
                        <div className="block">
                            <Popup 
                            className="genepopup" 
                            trigger={<button class="Button_gene">Upload Carriage Gene(s)/Loci</button>} 
                            on='click'
                            open={this.state.is_open_upload_carriage_gene}
                            onOpen={this.handleOpen("is_open_upload_carriage_gene")}
                            modal>
                                Upload the carriage gene in .txt file format. To know more check the FAQ.
                                <form id="form-file-upload">
                                    <input type="file" id="input-file-upload" multiple={true} onChange={this.handleCarriageGeneSubmission}/>
                                    <label id="label-file-upload" htmlFor="input-file-upload">
                                        <div>
                                        <p className="gene_upload_button">Upload a file</p>
                                        <button className="gene_upload_button" onClick={this.handleClose("is_open_upload_carriage_gene")}>Cancel</button>
                                        </div> 
                                    </label>
                                </form>
                            </Popup>
                        </div>

                        <div className="block">
                            <div className="lists">
                                <FileList list={this.props.carriage_gene} size="medium" removeFile={this.removeCarriageGeneFile}/>
                            </div>
                            <div className="row">
                                <button class="Button_extra_gene" onClick={() => this.clearAll("carriage_gene")}>Clear All</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </>
        )
    }
}

export default CarriageGene