import React from "react";
import './Results.css';
import './TreeViewer.css';
import Header from "../HomePage/Header";
import Footer from "../HomePage/Footer";
import ApiService from "../../service";
import TreeViewer from "./TreeViewer";

// Friendly captions for the known result files; falls back to the filename.
const CAPTIONS = {
    "finalPlot.png": "Phylogenetic tree",
    "heatmap_carriage.png": "Carriage heatmap",
    "amr_summary.tsv": "AMR genes - summary",
    "amr_matrix.tsv": "AMR genes - presence/absence",
    "virulence_summary.tsv": "Virulence genes - summary",
    "virulence_matrix.tsv": "Virulence genes - presence/absence",
};

class Results extends React.Component {

    constructor(props){
        super(props)
        this.state = {
            id : "",
            message : "",
            loading : false,
            images : [],
            tables : [],   // [{ name, rows: [[...]] }],
            newick : "",
            activeResultTab: "",
        }
    }

    //CLIENT-SIDE newick upload
    handleNewickUpload = async e => {
        const file = e.target.files[0];

        if (!file) {
            return;
        }

        const filename = file.name.toLowerCase();

        if (!filename.endsWith(".nwk")) {
            this.setState({
                newick: "",
                message: "Please upload a .nwk file."
            });
            e.target.value = "";
            return;
        }

        const text = await file.text();
        const newick = text.trim();

        if (!newick.startsWith("(") || !newick.endsWith(";")) {
            this.setState({
                newick: "",
                message: "The uploaded file does not appear to contain a valid Newick tree."
            });
            e.target.value = "";
            return;
        }

        this.setState({
            newick,
            message: "",
            activeResultTab: "tree"
        });
    }
    
    updateId = e => {
        this.setState({id : e.target.value})
    }

    caption = (filename) => CAPTIONS[filename] || filename;

    getResults = async () => {
        const id = this.state.id.trim();

        if (this.state.newick && !id) {
            this.setState({
                message: "",
                loading: false
            });
            return;
        }

        if (!id) {
            this.setState({message: "Please enter your job id or upload a .nwk file.", images: [], tables: []});
            return;
        }

        this.setState({loading: true, message: "Checking for your results...", 
            images: [], 
            tables: [], 
            newick: "",
            activeResultTab: ""});

        const response = await ApiService.getResultsStatus(id);
        const status = response && response.status;

        if (status === 200 && response.data) {
            const images = response.data.images || [];
            const tableNames = response.data.tables || [];
            const treeName = response.data.tree || null;

            // Fetch and parse each TSV table for inline display.
            const tables = [];
            for (const name of tableNames) {
                const res = await ApiService.getResultText(id, name);
                if (res && res.status === 200 && typeof res.data === "string") {
                    const rows = res.data
                        .replace(/\r/g, "")
                        .split("\n")
                        .filter(line => line.length > 0)
                        .map(line => line.split("\t"));
                    if (rows.length > 0) {
                        tables.push({ name, rows });
                    }
                }
            }

            let newick = "";
            if (treeName) {
                const treeResponse = await ApiService.getResultText(id, treeName);
                if (treeResponse && treeResponse.status === 200 && typeof treeResponse.data === "string") {
                    newick = treeResponse.data;
                }
            }

            if (images.length === 0 && tables.length === 0 && !newick) {
                this.setState({loading: false, images: [], tables: [], newick: "",
                    message: "Your results are ready. Use 'Download all' below to get the files."});
            } else {

                //Determines the active results tab systematically
                //Priority: newick -> image -> table
                let activeResultTab = "";

                if (newick) {
                    activeResultTab = "tree";
                } else if (images.length > 0) {
                    activeResultTab = `image:${images[0]}`;
                } else if (tables.length > 0) {
                    activeResultTab = `table:${tables[0].name}`;
                }

                this.setState({loading: false, images, tables, newick, activeResultTab, message: ""});
            }

        } else if (status === 202) {
            this.setState({loading: false, images: [], tables: [], newick: "",
                message: "Your job is still being processed. Please check back in a few minutes."});
        } else if (status === 404) {
            this.setState({loading: false, images: [], tables: [], newick: "",
                message: "No results found for that id. Please double-check the id - if you only just submitted, the job may still be queued."});
        } else {
            this.setState({loading: false, images: [], tables: [], newick: "",
                message: "Something went wrong while fetching your results. Please try again."});
        }
    }

    downloadZip = async () => {
        const id = this.state.id.trim();
        if (!id) return;
        const response = await ApiService.getResults(id);
        if (response && response.status === 200) {
            const url = window.URL.createObjectURL(response.data);
            const a = document.createElement("a");
            a.href = url;
            a.download = `phylobuild_results_${id}.zip`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
        } else {
            this.setState({message: "Could not download the results zip. Please try again."});
        }
    }

    renderTable = (table) => {
        const [header, ...body] = table.rows;
        return (
            <div key={table.name} className="results-table-wrap">
                <h3 className="results-caption">{this.caption(table.name)}</h3>
                <div className="results-table-scroll">
                    <table className="results-table">
                        <thead>
                            <tr>
                                {header.map((cell, i) => <th key={i}>{cell}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {body.map((row, r) => (
                                <tr key={r}>
                                    {row.map((cell, c) => <td key={c}>{cell}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    render(){
        const id = this.state.id.trim();
        const hasResults = this.state.images.length > 0 || this.state.tables.length > 0 || this.state.newick;
        
        //Dynamically builds results tabs
        const resultTabs = [];

        if (this.state.newick) {
            resultTabs.push({
                id: "tree",
                label: "Interactive tree",
                type: "tree"
            });
        }

        this.state.images.forEach(img => {
            resultTabs.push({
                id: `image:${img}`,
                label: this.caption(img),
                type: "image",
                data: img
            });
        });

        this.state.tables.forEach(table => {
            resultTabs.push({
                id: `table:${table.name}`,
                label: this.caption(table.name),
                type: "table",
                data: table
            });
        });

        const activeResultTab = resultTabs.find(tab => tab.id === this.state.activeResultTab) || resultTabs[0];

        return(
        <>
        <Header/>
        <div id="container_results">
            <div className="row">
                <label className="label-results" htmlFor="id">
                Please enter your id:
                </label>
                <input id="id" class ="result_input" type="text" name="id" value={this.state.id} onChange={this.updateId}/>
            </div>
            <div className="row">
                <label className="label-results" htmlFor="newick">
                    Or upload a Newick tree (.nwk file):
                </label>
                <input
                    class="result_input"
                    id="newick"
                    type="file"
                    accept=".nwk"
                    onChange={this.handleNewickUpload}
                />
            </div>
            <div className="row">
                <button className="button-results" onClick={this.getResults} disabled={this.state.loading}>
                    {this.state.loading ? "Please wait..." : "Get Results"}
                </button>
            </div>

            {this.state.message && <div className="row">
                <p className="results-message">{this.state.message}</p>
            </div>}

            {hasResults && (
                <div className="results-content">

                    <div className="results-tabs">
                        {resultTabs.map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                className={`results-tab ${activeResultTab && activeResultTab.id === tab.id ? "active" : ""}`}
                                onClick={() => this.setState({ activeResultTab: tab.id })}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="results-tab-content">

                        {activeResultTab && activeResultTab.type === "tree" && (
                            <TreeViewer newick={this.state.newick} />
                        )}

                        {activeResultTab && activeResultTab.type === "image" && (
                            <figure className="results-figure">
                                <img
                                    className="results-image"
                                    src={ApiService.resultFileUrl(id, activeResultTab.data)}
                                    alt={this.caption(activeResultTab.data)}
                                />
                            </figure>
                        )}

                        {activeResultTab && activeResultTab.type === "table" && (
                            this.renderTable(activeResultTab.data)
                        )}

                    </div>

                    {id && (
                        <div className="row">
                            <button className="button-results" onClick={this.downloadZip}>
                                Download all (.zip)
                            </button>
                        </div>
                    )}

                </div>
            )}
        </div>
        <Footer/>
        </>
        )
    }
}

export default Results
