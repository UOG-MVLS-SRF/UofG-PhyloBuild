import React from "react";
import './HomePage.css';
import Tree from '../Tree/Tree';
import CarriageGene from "../CarriageGene/CarriageGene";
import Visualisation from "../Visualisation/Visualisation";
import ApiService from "../../service";
import { Link } from "react-router-dom";
import { ReactSession } from 'react-client-session';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import { faTrashCan } from '@fortawesome/free-regular-svg-icons';
import {faCircleQuestion} from '@fortawesome/free-regular-svg-icons';
import Popup from 'reactjs-popup';
import LinearProgress from '@mui/material/LinearProgress';
import Header from "./Header";
import Footer from "./Footer";
import service from "../../service";
import HelpIcon from "../General/HelpIcon";
import GenomeBrowser from "../GenomeBrowser/GenomeBrowser";

class HomePage extends React.Component {
  constructor(props) {
    super(props)
    this.state = this.getDefaultState();

    const d = new Date();
    ReactSession.setStoreType("localStorage");
    ReactSession.set("session_id", d.getTime());
    this.handleChange = this.handleChange.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
  }

  getDefaultState = () => ({
    build_tree : false,
    gene : false,
    visualisation : false,
    genome_tree: [],
    gene_tree:[],
    carriage_gene: [],
    gene_interest: [],
    reference_genes: [],
    email: "",
    virulence: false,
    confirmation: false,
    is_open_email: false,
    activeTab: "phylotree", //contriols which homepage tab is active
    display_names: {
      genome_tree: {},
      gene_tree: {},
      reference_genes: {},
      database_genomes: {},
      reference_genomes: {},
      outgroup_genomes: {},
	    database_ref_genome: {},
	    database_outgroup_genome: {}
    }, //Stores user-defined names for their uploaded files
    upload_status: {},
    database_genomes: [],
    database_ref_genome: [],
    database_outgroup_genome: [],
    ref_gene_flag:false, //Flag for whether reference genes have been uploaded
    validation_error: null, //Keeps track of errors in submission
  });

  onCheckboxChange = input => event => {
    if(input === "Build Tree" & event.checked === true){
      this.setState({'build_tree' : true});
    } else if(input === "Carriage Gene"  & event.checked === true) {
      this.setState({'gene' : true});
    } else if (input === "Visualisation"  & event.checked === true) {
      this.setState({'visualisation' : true});
    }
    this.forceUpdate();
  };

  handleChange = value => event => {
    if(value === "Build Tree") {
      if (event.target.checked === true){
      this.setState({'build_tree' : true});
      } else {
        this.setState({'build_tree' : false});
      }
    } else if(value === "Carriage Gene" ) {
      if (event.target.checked === true){
        this.setState({'gene' : true});
        } else {
          this.setState({'gene' : false});
        }
    } else if (value === "Visualisation") {
      if (event.target.checked === true){
        this.setState({'visualisation' : true});
        } else {
          this.setState({'visualisation' : false});
        }
    } else if (value === "Virulence") {
      this.setState({'virulence' : event.target.checked === true});
    } else if (value === "Plasmids") {
      this.setState({'plasmids' : event.target.checked === true});
    }
    this.forceUpdate();
  }

  //Generic function to capture upload progress of files
  uploadFile = async (id, name, text, tag) => {

    this.setState(prevState => ({
      upload_status: {
        ...prevState.upload_status,
        [name]: {
          status: "uploading",
          progress: 0
        }
      }
    }));

    try {

      await ApiService.uploadData(
        id,
        name,
        text,
        tag
      );

      // Issue #2: if the file was removed/cleared while it was still uploading, it will no
      // longer be in its field's state array by the time the upload finishes. In that case
      // delete it from the backend so an in-flight upload can't sneak back into the run, and
      // don't mark it complete.
      if (!Array.isArray(this.state[tag]) || !this.state[tag].includes(name)) {
        ApiService.deleteFile(id, tag, name).catch(() => {});
        this.setState(prevState => {
          const updated = { ...prevState.upload_status };
          delete updated[name];
          return { upload_status: updated };
        });
        return;
      }

      this.setState(prevState => ({
        upload_status: {
          ...prevState.upload_status,
          [name]: {
            status: "complete",
            progress: 100
          }
        }
      }));

    } catch (error) {

      this.setState(prevState => ({
        upload_status: {
          ...prevState.upload_status,
          [name]: {
            status: "error",
            message: this.getUploadErrorMessage(error)
          }
        }
      }));

    }

  };

  removeFile = (filename, input) => {
      const id = ReactSession.get("session_id");

      ApiService.deleteFile(id, input, filename)
          .then(response => {

              this.setState(prevState => {

                  // Remove the file from its relevant state array
                  const updatedFiles =
                      prevState[input].filter(file => file !== filename);

                  // Remove the display name associated with that file
                  const updatedDisplayNames = {
                      ...prevState.display_names[input]
                  };

                  delete updatedDisplayNames[filename];

                  const updatedState = {
                      ...prevState,

                      [input]: updatedFiles,

                      display_names: {
                          ...prevState.display_names,
                          [input]: updatedDisplayNames
                      }
                  };
                  
                  //turns off build_tree if last genome is removed
                  if (input === "genome_tree" && updatedFiles.length === 0 ) {
                      updatedState.build_tree = false;
                  }
                  
                  //turns off gene if last gene list is removed
                  if ( input === "gene_tree" && updatedFiles.length === 0) {
                      updatedState.gene = false;
                  }

                  return updatedState;
              });

          })
          .catch(error => {
              console.log(error);
          });
  }

    handleSubmission = async e => {
        const id = ReactSession.get("session_id");

        for (const element of e.target.files) {

            let file = new Blob([element], {type: element.type});
            let text = await file.text();
            let name = element.name;

            this.setState(prevState => ({
                genome_tree: [...prevState.genome_tree, name],

                display_names: {
                    ...prevState.display_names,

                    genome_tree: {
                        ...prevState.display_names.genome_tree,
                        [name]: name.replace(/\.[^/.]+$/, "")
                    }
                },

                build_tree: true
            }));

            this.uploadFile(id,name,text,"genome_tree");
        }
    }

    handleGeneSubmission = async e => {
        const id = ReactSession.get("session_id");

        for (const element of e.target.files) {

            let file = new Blob([element], {type: element.type});
            let text = await file.text();
            let name = element.name;

            this.setState(prevState => ({
                gene_tree: [...prevState.gene_tree, name],
                
                display_names: {
                  ...prevState.display_names,

                  gene_tree: {
                      ...prevState.display_names.gene_tree,
                      [name]: name.replace(/\.[^/.]+$/, "")
                  }
                },

                gene: true
            }));

            this.uploadFile(id,name,text,"gene_tree");
        }
    };

    handleGeneSelectionSubmission = filename => {
      this.setState(prevState => ({
        gene_tree: [...prevState.gene_tree, filename]
      }));

      this.forceUpdate();
    };

    handleGenomeDatabaseSubmission = tag => {
      const id = ReactSession.get("session_id");

      ApiService.uploadFromDatabase(id, tag).then(response => {
        const files = response['data']['files']
          this.setState({genome_tree: files
          })
      })
      this.forceUpdate();
    };

    handleGeneInterestSubmission = async e => {
      const id = ReactSession.get("session_id");

      for (const element of e.target.files) {

        let file = new Blob([element], {type: element.type});
        let text = await file.text();
        let name = element.name

        this.setState(prevState => ({
          gene_interest: [...prevState.gene_interest, name]

        }));

        this.uploadFile(id,name,text,"gene_interest");
      }
      this.forceUpdate();
    };

    handleReferenceGenesSubmission = async e => {
      // Reference strain gene set -> PhyloGenes derives the tree orthologues from it.
      const id = ReactSession.get("session_id");

      for (const element of e.target.files) {

        let file = new Blob([element], {type: element.type});
        let text = await file.text();
        let name = element.name

        this.setState(prevState => ({
          reference_genes: [...prevState.reference_genes, name],

            display_names: {
              ...prevState.display_names,

              reference_genes: {
                  ...prevState.display_names.reference_genes,
                  [name]: name.replace(/\.[^/.]+$/, "")
              }
            },
          ref_gene_flag: true
        }));

        this.uploadFile(id,name,text,"reference_genes");
      }
      this.forceUpdate();
    }

    handleCarriageGeneSubmission = async e => {
      const id = ReactSession.get("session_id");

      for (const element of e.target.files) {

        let file = new Blob([element], {type: element.type});
        let text = await file.text();
        let name = element.name

        this.setState(prevState => ({
          carriage_gene: [...prevState.carriage_gene, name]
        }));

        this.uploadFile(id, name, text, "carriage_gene")
      }
      this.forceUpdate();
    }

    clearAll = input => {
      const id = ReactSession.get("session_id");
      ApiService.clearAll(id, input).then(response =>{
        this.setState({[input]:[]})
        }).catch(error => {console.log(error)})
    }

    handleInputChange = input => {
      this.setState({email : input.target.value});
    }

    //Now checks what tab is active when the run is submitted
    //This runs the appropriate backend process
    handleExecSubmit = (id) => {
      ApiService.submitExec(
        id,
        this.state.virulence,
        this.state.plasmids,
        this.state.activeTab,
        this.state.database_genomes.map(genome => genome.id),
        this.state.database_ref_genome.map(genome => genome.id),
        this.state.database_outgroup_genome.map(genome => genome.id),
        this.state.display_names,
        this.state.species
      );
    }

    submitEmail = () => {
      const id = JSON.parse(localStorage.getItem("__react_session__")).session_id;
      let email = this.state.email

      ApiService.uploadEmail(id, email).then(()=>this.handleExecSubmit(id))
      this.setState({confirmation: true})
    }

    handleOpen = field_name => e => {
      this.setState({ [field_name]: true });
    }

  handleClose = field_name => e => {
      e.preventDefault();
      	this.setState({
          [field_name]: false,
          validation_error: null
        });
  }

  //Deals with switching between tabs for run types
  //Currently we host: PhyloTree, Discover Orthologues
  handleTabChange = async tab => {
    const id = ReactSession.get("session_id");

    await Promise.all([
      ApiService.clearAll(id, "genome_tree"),
      ApiService.clearAll(id, "gene_tree"),
      ApiService.clearAll(id, "reference_genes"),
      ApiService.clearAll(id, "gene_interest"),
      ApiService.clearAll(id, "carriage_gene")
    ]);

    this.setState({
      ...this.getDefaultState(),
      activeTab: tab
    });
  };

  clearTabContent= async ()=> {
    const id = ReactSession.get("session_id");

    await Promise.all([
      ApiService.clearAll(id, "genome_tree"),
      ApiService.clearAll(id, "gene_tree"),
      ApiService.clearAll(id, "reference_genes"),
      ApiService.clearAll(id, "gene_interest"),
      ApiService.clearAll(id, "carriage_gene")
    ]);

    this.setState({
      ...this.getDefaultState()
    });
  };

  //Deals with renaming files from the upload table
  handleDisplayNameChange = (inputType, filename) => event => {
      const newName = event.target.value;

      this.setState(prevState => ({
          display_names: {
              ...prevState.display_names,

              [inputType]: {
                  ...prevState.display_names[inputType],
                  [filename]: newName
              }
          }
      }));
  }

  //Gets the upload status of a given file
  renderUploadStatus = filename => {
    const upload = this.state.upload_status[filename];

    if (!upload) {
      return "Pending";
    }

    if (upload.status === "uploading") {
      return `${upload.progress}%`;
    }

    if (upload.status === "complete") {
      return "Complete";
    }

    if (upload.status === "error") {
      return upload.message || "Upload failed";
    }

    return "Pending";
  }

  //Error handling for upload status
  getUploadErrorMessage = error => {
    if (error.response) {
      switch (error.response.status) {
        case 400:
          return error.response.data?.message ||
            error.response.data?.error ||
            "Invalid upload request";

        case 413:
          return "File is too large";

        case 500:
          return error.response.data?.message ||
            error.response.data?.error ||
            "Server error while processing upload";

        case 502:
          return "Upload service is unavailable";

        case 503:
          return "Upload service is temporarily unavailable";

        default:
          return error.response.data?.message ||
            error.response.data?.error ||
            `Server returned ${error.response.status}`;
      }
    }

    if (error.request) {
      return "No response from upload service";
    }

    return error.message || "Upload failed";
  };

  //allows selection of database genomes
  handleDatabaseGenomeSelection = async (
    genomes,
    category = "database_genomes"
  ) => {
    const id = ReactSession.get("session_id");

    const selectedGenomes =
      category === "database_ref_genome" ||
      category === "database_outgroup_genome"
        ? genomes.slice(-1)
        : genomes;

    this.setState(prevState => {
      const genomeNames = {
        ...(prevState.display_names[category] || {})
      };

      selectedGenomes.forEach(genome => {
        if (!genomeNames[genome.id]) {
          genomeNames[genome.id] = genome.name;
        }
      });

      const updatedState = {
        [category]: selectedGenomes,

        display_names: {
          ...prevState.display_names,
          [category]: genomeNames
        }
      };

      return updatedState;
    });
  };

  //Removes a preloaded genome from the run
  removeDatabaseGenome = (
    genomeId,
    category = "database_genomes"
  ) => {
    this.setState(prevState => {
      const updatedNames = {
        ...(prevState.display_names[category] || {})
      };

      delete updatedNames[genomeId];

      return {
        [category]: prevState[category].filter(
          genome => genome.id !== genomeId
        ),

        display_names: {
          ...prevState.display_names,
          [category]: updatedNames
        }
      };
    });
  };

  //Handles checking for the presence of appropriate files before run submission.
  checkFlags = () => {
    // Issue #3: don't let a run start while any file is still uploading.
    const uploadsInProgress = Object.values(this.state.upload_status || {})
      .some(u => u && u.status === "uploading");

    const hasGenomes =
      this.state.genome_tree.length +
      this.state.database_genomes.length > 1;

    let error = null;

    if (uploadsInProgress) {
      error = "Some files are still uploading - please wait for all uploads to finish before starting the run.";
    } else switch (this.state.activeTab) {
      case "phylotree":
        if (!hasGenomes) {
          error = "Please provide more than one genome before starting the run.";
        } else if (
          this.state.gene_tree.length === 0
        ) {
          error = "Please provide a file containing orthologues to use for the tree";
        }
        break;

      case "orthologues":
        if (!hasGenomes) {
          error = "Please provide more than one genome before discovering orthologues.";
        } else if (
          this.state.reference_genes.length === 0
        ) {
          error = "Please provide a file containing reference genes for orthologue finding.";
        }
        break;

      default:
        error = "Unknown run type.";
    }

    this.setState({
      validation_error: error,
      is_open_email: true
    });

    return error === null;
  };

  //Deals with gathering and displaying announcements
  componentDidMount() {
    //Get the current announcement
    fetch("/current_announcement.txt")
  
    // Checks that the response is recieved correctly
      .then(response => {
  
          if (!response.ok) {
              throw new Error(
                  `Could not load announcement: ${response.status} ${response.statusText}`
              );
          }
  
        return response.text();
      })
      .then(announcement => {

        this.setState({
          announcement: announcement
        });

      });

  };

    render() {
      let build_tree_box;
      let gene_box;
      let visualisation_box;
      let run_button
      if (this.state.build_tree) {
        build_tree_box = <Tree
        gene={this.state.gene}
        genome_file={this.state.genome_tree}
        handleSubmission={this.handleSubmission}
        clearAll={this.clearAll}
        removeFile={this.removeFile}
        gene_tree={this.state.gene_tree}
        gene_interest={this.state.gene_interest}
        reference_genes={this.state.reference_genes}
        handleReferenceGenesSubmission={this.handleReferenceGenesSubmission}
        handleGeneSubmission={this.handleGeneSubmission}
        handleGeneSelectionSubmission={this.handleGeneSelectionSubmission}
        handleGeneInterestSubmission={this.handleGeneInterestSubmission}
        handleGenomeDatabaseSubmission={this.handleGenomeDatabaseSubmission}
        />;
      }
      if (this.state.gene) {
        gene_box = <CarriageGene
        tree={this.state.build_tree}
        genome_file={this.state.genome_tree}
        removeFile={this.removeFile}
        handleSubmission={this.handleSubmission}
        clearAll={this.clearAll}
        carriage_gene={this.state.carriage_gene}
        handleCarriageGeneSubmission={this.handleCarriageGeneSubmission}
        handleGenomeDatabaseSubmission={this.handleGenomeDatabaseSubmission}/>;
      }
      if (this.state.visualisation) {
        visualisation_box = <Visualisation
        gene={this.state.gene}
        tree={this.state.build_tree}
        genome_file={this.state.genome_tree}
        gene_tree={this.state.gene_tree}/>
      }
      run_button = <button className="run_button">Run</button>

      const uploadedFilesTable = (

          <div className="upload_status_section">

            <div className="section_heading upload_table_heading">
              Uploaded Files

              <button
                type="button"
                className="clear_table_button"
                onClick={this.clearTabContent}
              >
                Clear All
              </button>
            </div>

            <div className="upload_table_wrapper">
              {(
                this.state.genome_tree.length === 0 &&
                this.state.gene_tree.length === 0 &&
                this.state.reference_genes.length === 0 &&
                this.state.database_genomes.length === 0 &&
                this.state.database_ref_genome.length === 0 &&
                this.state.database_outgroup_genome.length === 0
              ) ? (
                <p >No files uploaded.</p>
              ) : (
                <table className="upload_status_table">

                  <thead>
                    <tr>
                      <th>Filename</th>
                      <th>
                        Name for Tree (Editable)
                        <HelpIcon 
                        text="Freely enter text to alter how this file appears on the final tree."
                        />
                        </th>
                      <th>Type</th>
                      <th>Upload Status</th>
                      <th>Remove?</th>
                    </tr>
                  </thead>

                  <tbody>

                    {this.state.genome_tree.map((filename, index) => (
                      <tr key={`genome-${index}`}>

                        <td>
                          {filename}
                        </td>

                        <td>
                          <input
                            type="text"
                            value={
                              this.state.display_names
                                .genome_tree[filename] || ""
                            }
                            onChange={
                              this.handleDisplayNameChange(
                                "genome_tree",
                                filename
                              )
                            }
                          />
                        </td>
                        <td>
                          Genome
                        </td>
                        <td>
                          {this.renderUploadStatus(filename)}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="remove_file_button"
                            aria-label={`Remove ${filename}`}
                            title={`Remove ${filename}`}
                            onClick={() =>
                              this.removeFile(
                                filename,
                                "genome_tree"
                              )
                            }
                          >
                            <FontAwesomeIcon icon={faTrashCan} />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {this.state.gene_tree.map((filename, index) => (
                      <tr key={`orthologue-${index}`}>

                        <td>
                          {filename}
                        </td>

                        <td>
                          <input
                            type="text"
                            value={
                              this.state.display_names
                                .gene_tree[filename] || ""
                            }
                            onChange={
                              this.handleDisplayNameChange(
                                "gene_tree",
                                filename
                              )
                            }
                          />
                        </td>

                        <td>
                          Gene List
                        </td>
                        
                        <td>
                          {this.renderUploadStatus(filename)}
                        </td>

                        <td>
                          <button
                            type="button"
                            className="remove_file_button"
                            aria-label={`Remove ${filename}`}
                            title={`Remove ${filename}`}
                            onClick={() =>
                              this.removeFile(
                                filename,
                                "genome_tree"
                              )
                            }
                          >
                            <FontAwesomeIcon icon={faTrashCan} />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {this.state.reference_genes.map((filename, index) => (
                      <tr key={`reference-${index}`}>

                        <td>
                          {filename}
                        </td>

                        <td>
                          <input
                            type="text"
                            value={
                              this.state.display_names
                                .reference_genes[filename] || ""
                            }
                            onChange={
                              this.handleDisplayNameChange(
                                "reference_genes",
                                filename
                              )
                            }
                          />
                        </td>

                        <td>
                          Reference Gene Set
                        </td>
                        
                        <td>
                          {this.renderUploadStatus(filename)}
                        </td>

                        <td>
                          <button
                            type="button"
                            className="remove_file_button"
                            aria-label={`Remove ${filename}`}
                            title={`Remove ${filename}`}
                            onClick={() =>
                              this.removeFile(
                                filename,
                                "genome_tree"
                              )
                            }
                          >
                            <FontAwesomeIcon icon={faTrashCan} />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {this.state.database_genomes.map(genome => (
                      <tr key={`database-genome-${genome.id}`}>
                        <td>
                          {genome.file_path.split("/").pop()}
                        </td>

                        <td>
                          <input
                            type="text"
                            value={
                              this.state.display_names.database_genomes[genome.id] ||
                              genome.name
                            }
                            onChange={
                              this.handleDisplayNameChange(
                                "database_genomes",
                                genome.id
                              )
                            }
                          />
                        </td>

                        <td>
                          Preloaded Genome
                        </td>

                        <td>
                          N/A
                        </td>

                        <td>
                          <button
                            type="button"
                            className="remove_file_button"
                            aria-label={`Remove ${genome.name}`}
                            title={`Remove ${genome.name}`}
                            onClick={() => this.removeDatabaseGenome(genome.id)}
                          >
                            <FontAwesomeIcon icon={faTrashCan} />
                          </button>
                        </td>
                      </tr>
                    ))}

                  </tbody>
                </table>
              )}
            </div>
          </div>
      );

      const startRunButton = (
        <div className="start_run_container">
          <button
            className="run_button"
            onClick={this.checkFlags}
          >
            Start Run
          </button>

          <Popup
            className="homepagepopup"
            open={this.state.is_open_email}
            closeOnDocumentClick
            onClose={() => {
              this.setState({
                is_open_email: false,
                validation_error: null
              });
            }}
            modal
          >

          {this.state.validation_error ? (
              <>
                <h3>Unable to Start Run</h3>

                <p>
                  {this.state.validation_error}
                </p>

                <button
                  id="popup_button"
                  onClick={this.handleClose("is_open_email")}
                >
                  Close
                </button>
              </>
            ) : (
              <>
                {!this.state.confirmation && (
                  <>
                    <LinearProgress />

                    We will need some time to process your request,
                    and will notify you via email once your request
                    is ready.

                    <br />

                    <input
                      className="email_input"
                      type="text"
                      placeholder="Please enter your email"
                      onChange={this.handleInputChange}
                    />

                    <div className="row">
                      <button
                        id="popup_button"
                        onClick={this.submitEmail}
                      >
                        Submit
                      </button>

                      <button
                        id="popup_button"
                        onClick={this.handleClose("is_open_email")}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}

                {this.state.confirmation && (
                  <>
                    <LinearProgress />

                    Thank you, we have received your request and are
                    processing it. We have emailed you a confirmation
                    regarding your request. You can now close this
                    window and we will notify you once your request
                    has been processed.
                  </>
                )}
              </>
            )}
          </Popup>

        </div>
      );

      const genomeOptions = (
        <div className="genomeOptions">
        <details className="option_accordion" 
          name="left-column"
          open
          >
        <summary className="option_heading">
          Choose Genomes of Interest


        </summary>

        <div className="option_content">

          <p>Upload Genomes 
            <HelpIcon 
            text="Upload genomes of interest in FASTA format for phylogenetic analysis"
            />
          </p>
          <input
            type="file"
            multiple
            onChange={this.handleSubmission}
          />

          <br/>

          <p>Choose Database Genomes
            <HelpIcon 
            text="Browse our collection of pre-defined genomes and add them to your run."
            />
          </p>
          <GenomeBrowser
            sessionId={
              JSON.parse(
                localStorage.getItem("__react_session__")
              ).session_id
            }
            selectedGenomeIds={
              this.state.database_genomes.map(genome => genome.id)
            }
            onSelectionChange={
              genomes => this.handleDatabaseGenomeSelection(genomes,"database_genomes")
            }
          />

          <span>
            {this.state.database_genomes.length} selected
          </span>
          </div>
        </details>
        </div>
      );

      const tabLayout = (leftContent, middleContent, rightContent) => (
        <div className="run_layout">

          <div className="run_left">
            {genomeOptions}

            {leftContent}
          </div>

          <div className="run_middle">
            {middleContent}
          </div>

          <div className="run_right">
            {rightContent}

            {startRunButton}
          </div>

        </div>
      );

      return (
        <body>
        <Header/>
        <div id="main-content">
          <div className="Announcement">
            <p className="announcement_text">
              {this.state.announcement}
            </p>
          </div>
        <div className="tab_header">
          <div className="main_tabs">

            <button
              className={
                this.state.activeTab === "phylotree"
                  ? "tab_button active_tab"
                  : "tab_button"
              }
              onClick={() => this.handleTabChange("phylotree")}
            >
              PhyloTree
            </button>
            
            <button
              className={
                this.state.activeTab === "orthologues"
                  ? "tab_button active_tab"
                  : "tab_button"
              }
              onClick={() => this.handleTabChange("orthologues")}
            >
              Discover orthologues
            </button>
          </div>

          <div className="tab_info">

            {this.state.activeTab === "phylotree" && (
              <span>
                Build a phylogenetic tree from uploaded genomes, based on a supplied list of orthologous or reference genes.
              </span>
            )}

            {this.state.activeTab === "orthologues" && (
              <span>
                Upload genomes of interest to discover orthologues for further analysis.
              </span>
            )}
          </div>
        </div>

        {this.state.activeTab === "phylotree" && (
          tabLayout(

            <>

              <details className="option_accordion" 
                name="left-column"
                >
                <summary className="option_heading">
                  Upload Orthologues

                  <HelpIcon 
                  text="Upload orthologues of interest for the relevant species. 
                  This can be generated using our Discover Orthologues function"
                  />
                </summary>

                <div className="option_content">

                  <input
                    type="file"
                    multiple
                    onChange={this.handleGeneSubmission}
                  />
                </div>
              </details>

              <details className="option_accordion" 
                  name="left-column"
                  >
                <summary className="option_heading">
                  Heatmaps

                  <HelpIcon
                  text="Optional. Produce a heatmap of gene carriage. Upload the genes to
                  screen for AND the genomes of interest to display them in - the heatmap
                  needs both."
                  />
                </summary>

                <div className="option_content">

                  <p>Carriage genes - genes to screen for (e.g. resistance or virulence genes)</p>
                  <input
                    type="file"
                    multiple
                    onChange={this.handleCarriageGeneSubmission}
                  />

                  <p>Genomes of interest - the strains shown in the heatmap</p>
                  <input
                    type="file"
                    multiple
                    onChange={this.handleGeneInterestSubmission}
                  />
                </div>
              </details>
            </>,

            uploadedFilesTable,

            <>

              <details className="option_accordion" 
                name="right-column"
                open
                >
                <summary className="option_heading">
                  Additional Features
                </summary>

                <div class="option_content additional_features">

                  <label className="checkbox_row">
                    <input
                      type="checkbox"
                      checked={this.state.virulence}
                      onChange={this.handleChange("Virulence")}
                    />

                    AMR &amp; Virulence Screening

                    <HelpIcon 
                    text="Screens uploaded genomes for AMR genes and virulence factors."
                     />
                  </label>

                </div>
              </details>

              <details className="option_accordion" 
                name="right-column"
                >
                <summary className="option_heading">
                  Advanced Options

                  <HelpIcon 
                  text="These settings control options for advanced users
                  such as parameters and thresholding." 
                  />
                </summary>

                <div className="option_content advanced_options">
                  <p>Advanced options will appear here.</p>
                </div>
              </details>

              </>
            )
          )}

          {this.state.activeTab === "orthologues" && (

            tabLayout(
              <>

              <details className="option_accordion" 
                name="left-column"
                >
                <summary className="option_heading">
                  Upload Reference Genes

                  <HelpIcon
                  text="Upload the complete gene set of a reference strain (nucleotide FASTA
                  of all its genes) - PhyloBuild keeps the genes shared across all your
                  genomes as the orthologues. From NCBI: find the reference genome, then
                  Send to > Gene Features > FASTA Nucleotide > Create File. Any filename works, as long as it is correct .fasta format."
                  />
                </summary>

                <div className="option_content">

                  <input
                    type="file"
                    multiple
                    onChange={this.handleReferenceGenesSubmission}
                  />
                </div>
              </details>
              </>,
              uploadedFilesTable,

              null

            )

          )}
          
        </div>
    
      <div className="results_link_wrapper">
        <Link
          to="/results"
          className="results_link"
        >
          <span>Results</span>

          <HelpIcon
          text="Access their results of previous analyses by Run ID, or upload your own tree file in .nwk format "
          />
        </Link>
      </div>

      </body>
      )
    }

}

export default HomePage
