import React from "react";
import Popup from "reactjs-popup";
import ApiService from "../../service";
import "./GenomeBrowser.css";

class GenomeBrowser extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			genomes: [],
			currentPath: [],
			selectedGenomeIds: props.selectedGenomeIds || [],
			loading: false,
			error: null
		};
	}

	loadGenomes = async () => {
		this.setState({
			loading: true,
			error: null
		});

		try {
			const response = await ApiService.getGenomeLibrary();

			this.setState({
				genomes: response.data.genomes || [],
				currentPath: [],
				selectedGenomeIds: this.props.selectedGenomeIds || [],
				loading: false
			});
		} catch (error) {
			this.setState({
				loading: false,
				error: "Could not load genome library"
			});
		}
	};

	getCurrentDirectory = () => {
		const currentPath = this.state.currentPath;

		const folders = new Set();
		const genomes = [];

		this.state.genomes.forEach(genome => {
			const parts = genome.file_path.split("/");
			const fileName = parts.pop();

			const matchesCurrentPath = currentPath.every(
				(part, index) => parts[index] === part
			);

			if (!matchesCurrentPath) {
				return;
			}

			if (parts.length > currentPath.length) {
				folders.add(parts[currentPath.length]);
			} else {
				genomes.push({
					...genome,
					fileName: fileName
				});
			}
		});

		return {
			folders: Array.from(folders).sort(),
			genomes: genomes.sort((a, b) =>
				a.name.localeCompare(b.name)
			)
		};
	};

	openFolder = folder => {
		this.setState(prevState => ({
			currentPath: [
				...prevState.currentPath,
				folder
			]
		}));
	};

	goUpFolder = () => {
		this.setState(prevState => ({
			currentPath: prevState.currentPath.slice(0, -1)
		}));
	};

	goToPathLevel = level => {
		this.setState(prevState => ({
			currentPath: prevState.currentPath.slice(0, level)
		}));
	};

	toggleGenome = genomeId => {
		this.setState(prevState => {
			if (prevState.selectedGenomeIds.includes(genomeId)) {
				return {
					selectedGenomeIds:
						prevState.selectedGenomeIds.filter(
							id => id !== genomeId
						)
				};
			}

			return {
				selectedGenomeIds: [
					...prevState.selectedGenomeIds,
					genomeId
				]
			};
		});
	};

    saveSelection = close => {
        const selectedGenomes = this.state.genomes.filter(
            genome => this.state.selectedGenomeIds.includes(genome.id)
        );

        if (this.props.onSelectionChange) {
            this.props.onSelectionChange(selectedGenomes);
        }

        close();
    };

	renderBreadcrumbs = () => {
		return (
			<div className="genome_browser_breadcrumbs">
				<button
					type="button"
					className="genome_browser_breadcrumb"
					onClick={() => this.goToPathLevel(0)}
				>
					Genome Library
				</button>

				{this.state.currentPath.map((folder, index) => (
					<React.Fragment key={`${folder}-${index}`}>
						<span> / </span>

						<button
							type="button"
							className="genome_browser_breadcrumb"
							onClick={() =>
								this.goToPathLevel(index + 1)
							}
						>
							{folder}
						</button>
					</React.Fragment>
				))}
			</div>
		);
	};

	renderDirectory = () => {
		const directory = this.getCurrentDirectory();

		return (
			<div className="genome_browser_directory">

				{this.state.currentPath.length > 0 && (
					<button
						type="button"
						className="genome_browser_folder"
						onClick={this.goUpFolder}
					>
						📁 ..
					</button>
				)}

				{directory.folders.map(folder => (
					<button
						type="button"
						className="genome_browser_folder"
						key={folder}
						onClick={() => this.openFolder(folder)}
					>
						📁 {folder}
					</button>
				))}

				{directory.genomes.map(genome => (
					<label
						className="genome_browser_genome"
						key={genome.id}
					>
						<input
							type="checkbox"
							checked={this.state.selectedGenomeIds.includes(
								genome.id
							)}
							onChange={() =>
								this.toggleGenome(genome.id)
							}
						/>

						<div className="genome_browser_genome_details">
							<span className="genome_browser_genome_name">
								{genome.name}
							</span>

							<span className="genome_browser_accession">
								{genome.accession}
							</span>
						</div>
					</label>
				))}

			</div>
		);
	};

	render() {
		return (
			<Popup
				trigger={
					<button
						type="button"
						className="genome_browser_open_button"
					>
						Browse...
					</button>
				}
				modal
				nested
				onOpen={this.loadGenomes}
			>
				{close => (
					<div className="genome_browser">

						<div className="genome_browser_header">
							<h3>Genome Library</h3>

							<button
								type="button"
								className="genome_browser_close"
								onClick={close}
							>
								×
							</button>
						</div>

						{this.renderBreadcrumbs()}

						{this.state.loading ? (
							<div className="genome_browser_message">
								Loading genome library...
							</div>
						) : this.state.error ? (
							<div className="genome_browser_error">
								{this.state.error}
							</div>
						) : (
							this.renderDirectory()
						)}

						<div className="genome_browser_footer">

							<span>
								{this.state.selectedGenomeIds.length} selected
							</span>

							<div>
								<button
									type="button"
									onClick={close}
								>
									Cancel
								</button>

								<button
									type="button"
									onClick={() =>
										this.saveSelection(close)
									}
								>
									Add Selected
								</button>
							</div>

						</div>

					</div>
				)}
			</Popup>
		);
	}
}

export default GenomeBrowser;