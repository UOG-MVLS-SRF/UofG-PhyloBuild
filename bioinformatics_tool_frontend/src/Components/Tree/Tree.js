import "./Tree.css";
import React from "react";
import Popup from 'reactjs-popup';
import FileList from "../FileList/FileList";
import { faEnvelopeCircleCheck } from "@fortawesome/free-solid-svg-icons";
import FileTransferIntro from "../FileTransferIntro/FileTransferIntro";
class Tree extends React.Component {

    constructor(props){
        super(props)

        this.state= {
            upload_genome_button:
            <button className="Button_orth" >
            Upload Genome </button>,
            //genome_database_button :
            //<button className="Button_orth" disabled={!!this.props.gene}>
            //Genome Database </button>,
            error_message_genome : "",
            error_message_gene : "",
            error_message_strain : "",
            is_open_upload_genome: false,
            is_open_genome_database: false,
            is_open_upload_reference: false,
            is_open_upload_orth: false,
            is_open_upload_refgenes: false
        }

        this.handleChange = this.handleChange.bind(this);
    }
    filePostfix = [".fasta", ".fa",".txt",".csv"];
    handleChange = value => e => {
        this.setState({[value] : e.target.value});
    }

    removeGeneFile = filename => {
        this.props.removeFile(filename, "gene_tree")
    }

    removeGeneInterestFile = filename => {
        this.props.removeFile(filename, "gene_interest")
    }

    removeGenomeFile = filename => {
        this.props.removeFile(filename, "genome_tree")
    }

    removeReferenceGenesFile = filename => {
        this.props.removeFile(filename, "reference_genes")
    }

    handleReferenceGenesSubmission = e => {
        let result = "success"

        for (const element of e.target.files) {
            if (!this.filePostfix.some(postfix => element.name.endsWith(postfix))) {
                this.setState({error_message_refgenes : "Please upload only .fasta/.fa/.txt/.csv files"})
                result = "failure"
                break;
            } else {
                this.setState({error_message_refgenes : ""})
            }
        }
        if(result !== "failure") {
            this.props.handleReferenceGenesSubmission(e)
        }

        this.setState({ is_open_upload_refgenes: false });
        this.forceUpdate();
    }

    handleSubmission = e => {
        let result = "success"

        for (const element of e.target.files) {

            if (!this.filePostfix.some(postfix => element.name.endsWith(postfix))) {
                this.setState({error_message_genome : "Please upload only .fasta/.fa/.txt/.csv files"})
                result = "failure"
                break;
            } else {
                this.setState({error_message_genome : ""})

            }
        }
        if(result !== "failure") {
            this.props.handleSubmission(e)
        }

        this.setState({ is_open_upload_genome: false });
        this.forceUpdate();
    }

    clearAll = input => {
        this.props.clearAll(input)
    }

    handleGeneSubmission = e => {
        let result = "success"

        for (const element of e.target.files) {

            if (!this.filePostfix.some(postfix => element.name.endsWith(postfix))) {
                this.setState({error_message_genome : "Please upload only .fasta/.fa/.txt/.csv files"})
                result = "failure"
                break;
            } else {
                this.setState({error_message_gene : ""})
            }
        }
        if(result !== "failure") {
            this.props.handleGeneSubmission(e)
        }

        this.setState({ is_open_upload_orth: false });
        this.forceUpdate();
    }

    handleGeneInterestSubmission = e => {
        this.props.handleGeneInterestSubmission(e)
        this.setState({ is_open_upload_reference: false });
        this.forceUpdate();
    }

    handleOpen = (triggerType, field_name) => e => {
        // orthologues and genomes of interest can both be uploaded - orthologues build the
        // tree, genomes of interest feed the standalone carriage heatmap
        this.setState({ [field_name]: true });
      }
      
    handleClose = fieldName => (e) => {
    if (e) e.preventDefault(); // Only call preventDefault if e is not undefined
    this.setState({ [fieldName]: false });
}



    handleGenomeDatabase = input => e => {
        this.props.handleGenomeDatabaseSubmission(input)
    }

    render() {
        const upload_orthologue_button=<button className="Button_orth" onClick={this.handleOpen("gene_tree", "is_open_upload_orth")}>
                                                Upload Orthologues
                                                </button>
        const reference_strain_button=<button className="Button_orth"onClick={this.handleOpen("gene_interest", "is_open_upload_reference")}>
                                                Upload Genomes of Interest
                                                </button>
        const reference_genes_button=<button className="Button_orth" onClick={this.handleOpen("reference_genes", "is_open_upload_refgenes")}>
                                                Upload Reference Gene Set
                                                </button>
        const upload_genome_button= <button className="Button_orth" >Upload Genome </button>


        return(
            <>
            <div id="box_wrapper_tree">
                <div className="step_heading_tree">
                    Step 1.1 - Upload Genomes
                </div>
                <div className="blockBox">
                    <div className="row">
                        <div className="block">
                            {/*<Popup
                            className="treepopup" 
                            trigger={this.state.genome_database_button}
                            on='click'
                            open={this.state.is_open_genome_database}
                            onOpen={this.handleOpen("is_open_genome_database")}
                            modal>
                                <div className="row">
                                    <div className="block">
                                        <div className="genome_database_labels" id="checkbox_input" align="left">
                                            <input type="checkbox" onChange={this.handleGenomeDatabase("E Coli")}/>
                                            <label id="label_main_options">
                                                E. Coli
                                            </label>
                                        </div>
                                        
                                        <div className="genome_database_labels" id="checkbox_input" align="left">
                                            <input type="checkbox" onChange={this.handleGenomeDatabase("Lentivirus")}/>
                                            <label id="label_main_options">
                                                Lentivirus
                                            </label>
                                        </div>
                                        <button className="upload-button" onClick={this.handleClose("is_open_genome_database")}>Cancel</button>
                                    </div>
                                </div>
                                
                            </Popup> */}
                            <Popup 
                            className="treepopup" 
                            trigger={upload_genome_button}
                            on='click'
                            open={this.state.is_open_upload_genome}
                            onOpen={this.handleOpen(undefined,"is_open_upload_genome")}
                            modal>
                            Upload the genomes in .fasta/.fa/.txt/.csv file format. To find out more, check the FAQ.
                                <form id="form-file-upload">
                                    <input type="file" id="input-file-upload" multiple={true} onChange={this.handleSubmission}/>
                                    <label id="label-file-upload" htmlFor="input-file-upload">
                                        <div>
                                        <p className="upload-button">Upload files</p>
                                        <button className="upload-button" onClick={this.handleClose("is_open_upload_genome")}>Cancel</button>
                                        </div>
                                    </label>
                                </form>
                            </Popup>
                            <FileTransferIntro />
                        </div>
                        <div className="block">
                            <div className="lists">
                                <div className="error">{this.state.error_message_genome}</div>
                                <FileList list={this.props.genome_file} size="large" removeFile={this.removeGenomeFile}/>
                            </div>
                            <div className="row">
                                <button className="Button_extra" onClick={() => this.clearAll("genome_tree")}>Clear All</button>
                            </div>
                        </div>

                    </div>

                </div>

            <div className="step_heading_tree">
                Step 1.2 - Upload Orthologues (or a Reference Gene Set) and/or Genomes of Interest
            </div>
            <div className="row">
                <div className="blockBox">
                    <div className="block">
                        {upload_orthologue_button}
                        <Popup 
                            className="treepopup"
                            open={this.state.is_open_upload_orth}
                            onClose={this.handleClose("is_open_upload_orth")}
                            modal>
                            Upload the orthologues in .fasta/.fa/.txt/.csv file format. To know more check the FAQ.
                            <form id="form-file-upload">
                                <input type="file" id="input-file-upload" multiple={true} onChange={this.handleGeneSubmission}/>
                                <label id="label-file-upload" htmlFor="input-file-upload">
                                    <div>
                                    <p className="upload-button">Upload files</p>
                                    <button className="upload-button" onClick={this.handleClose("is_open_upload_orth")}>Cancel</button>
                                    </div> 
                                </label>
                            </form>
                        </Popup>
                    </div>

                    <div className="block">
                        <div className="lists">
                            <div className="error">{this.state.error_message_gene}</div>
                            <FileList list={this.props.gene_tree} size="medium" removeFile={this.removeGeneFile}/>
                        </div>
                        <div className="row">
                            <button className="Button_extra" onClick={() => this.clearAll("gene_tree")}>Clear All</button>
                        </div>
                    </div>
                </div>
                <div className="blockBox">
                    <div className="block">
                        {reference_strain_button}
                        <Popup 
                        className="treepopup"
                        onClose={this.handleClose("is_open_upload_reference")}
                        open={this.state.is_open_upload_reference}
                        modal>
                        Upload genomes of interest in .fasta/.fa file format - these drive the standalone carriage heatmap (heatmap_carriage.PDF). They are screened for the carriage genes but are NOT added to the tree (the tree is built only from the genomes in Step 1.1). To know more check the FAQ.
                        <form id="form-file-upload">
                            <input type="file" id="input-file-upload" multiple={true} onChange={this.handleGeneInterestSubmission}/>
                            <label id="label-file-upload" htmlFor="input-file-upload">
                                <div>                                    
                                <p className="upload-button">Upload file</p>
                                <button className="upload-button" onClick={this.handleClose("is_open_upload_reference")}>Cancel</button>
                                </div> 
                            </label>
                        </form>
                        </Popup>
                    </div>
                    <div className="block">
                        <div className="lists">
                            <div className="error">{this.state.error_message_strain}</div>
                            <FileList list={this.props.gene_interest} size="small" removeFile={this.removeGeneInterestFile}/>
                        </div>
                        <div className="row">
                            <button className="Button_extra" onClick={() => this.clearAll("gene_interest")}>Clear</button>
                        </div>
                    </div>
                </div>
                <div className="blockBox">
                    <div className="block">
                        {reference_genes_button}
                        <Popup
                        className="treepopup"
                        onClose={this.handleClose("is_open_upload_refgenes")}
                        open={this.state.is_open_upload_refgenes}
                        modal>
                        Optional - only if you do NOT have your own orthologues. Upload the full gene set of a reference strain (nucleotide FASTA of all its genes, e.g. from NCBI: Send to &rarr; Gene Features &rarr; FASTA Nucleotide). PhyloGenes will BLAST it against your genomes, keep the genes shared by all of them, and use those as the tree orthologues. If you uploaded orthologues above, they take precedence and this is ignored.
                        <form id="form-file-upload">
                            <input type="file" id="input-file-upload" onChange={this.handleReferenceGenesSubmission}/>
                            <label id="label-file-upload" htmlFor="input-file-upload">
                                <div>
                                <p className="upload-button">Upload file</p>
                                <button className="upload-button" onClick={this.handleClose("is_open_upload_refgenes")}>Cancel</button>
                                </div>
                            </label>
                        </form>
                        </Popup>
                    </div>
                    <div className="block">
                        <div className="lists">
                            <div className="error">{this.state.error_message_refgenes}</div>
                            <FileList list={this.props.reference_genes} size="small" removeFile={this.removeReferenceGenesFile}/>
                        </div>
                        <div className="row">
                            <button className="Button_extra" onClick={() => this.clearAll("reference_genes")}>Clear</button>
                        </div>
                    </div>
                </div>
            </div>
            </div>
            </>
        )
    } 
}

export default Tree
