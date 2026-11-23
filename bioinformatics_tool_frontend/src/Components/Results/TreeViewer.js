import React from "react";
import { phylotree } from "phylotree";

class TreeViewer extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
            //Basic tree options
			layout: "circular",
			scaling: false,
			alignTips: true,
			showLabels: true,
			fontSize: 14,
			width: null,
			height: null,
            zoomLevel:1.1,

            //Dropdown accordion options
			showColourOptions: false,
			showHighlightOptions: false,
            showCladeOptions: false,

            //Options for general colouring
			branchColor: "#000000",
			labelColor: "#000000",
			nodeColor: "#000000",
            
            //Options for highlighting a single isolate
			selectedIsolate: "",
			highlightColor: "#d62728",
			highlightedIsolates: {},
			isolateNames: [],

            //Options for highlighting a clade
            selectedClade: "",
            cladeColor: "#2ca02c",
            highlightedClades: {},
            cladeOptions: [],

            //Allows for isolate renaming
            showRenameOptions: false,
            selectedRenameIsolate: "",
            renameValue: "",
            isolateRenames: {},
		};
	}
    
    //Accordion for colouring
	toggleColourOptions = () => {
		this.setState(prevState => ({
			showColourOptions: !prevState.showColourOptions
		}));
	}

    //Accordion for isolate highlighting
	toggleHighlightOptions = () => {
		this.setState(prevState => ({
			showHighlightOptions: !prevState.showHighlightOptions
		}));
	}

    //Accordion for Clade highlighting
    toggleCladeOptions = () => {
        this.setState(prevState => ({
            showCladeOptions: !prevState.showCladeOptions
        }));
    }

    //Accordion for renaming isolates
    toggleRenameOptions = () => {
        this.setState(prevState => ({
            showRenameOptions: !prevState.showRenameOptions
        }));
    }

    //Highlights a given Isolate branch
	addIsolateHighlight = () => {
		const isolateName = this.state.selectedIsolate;

		if (!isolateName) {
			return;
		}

		this.setState(prevState => ({
			highlightedIsolates: {
				...prevState.highlightedIsolates,
				[isolateName]: prevState.highlightColor
			}
		}));
	}

    //Removes a given highlight
	removeIsolateHighlight = isolateName => {
		this.setState(prevState => {
			const highlightedIsolates = { ...prevState.highlightedIsolates };

			delete highlightedIsolates[isolateName];

			return {
				highlightedIsolates
			};
		});
	}

    //Finds descendant tips for a given node
    getDescendantTipNames = node => {
        return node.descendants()
            .filter(descendant => !descendant.children)
            .map(descendant => descendant.data && descendant.data.name)
            .filter(Boolean)
            .sort();
    }

    //Gets the ID for a Clade, derived from descendent names
    getCladeId = node => {
        return this.getDescendantTipNames(node).join("|");
    }

    //Highlights a whole given clade
    addCladeHighlight = () => {
        if (!this.state.selectedClade) {
            return;
        }

        this.setState(prevState => ({
            highlightedClades: {
                ...prevState.highlightedClades,
                [prevState.selectedClade]: prevState.cladeColor
            }
        }));
    }

    //Removes highlights from a Clade
    removeCladeHighlight = cladeId => {
        this.setState(prevState => {
            const highlightedClades = { ...prevState.highlightedClades };

            delete highlightedClades[cladeId];

            return {
                highlightedClades
            };
        });
    }

    //Uses a user-designated name for a given isolate
    renameIsolate = () => {
        const isolateName = this.state.selectedRenameIsolate;
        const newName = this.state.renameValue.trim();

        if (!isolateName || !newName) {
            return;
        }

        this.setState(prevState => ({
            isolateRenames: {
                ...prevState.isolateRenames,
                [isolateName]: newName
            },
            renameValue: ""
        }));
    }

    //Returns a selected isolate to the default name
    restoreIsolateNames = () => {
        this.setState({
            selectedRenameIsolate: "",
            renameValue: "",
            isolateRenames: {}
        });
    }

    //Returns the renamed version of an isolate, if it exists
    getDisplayName = isolateName => {
        return this.state.isolateRenames[isolateName] || isolateName;
    }
    
    //Renders the tree when the module loads
	componentDidMount() {
		this.renderTree();
	}

    //Updates the tree based on supplied information
	componentDidUpdate(prevProps, prevState) {
		if (
			prevProps.newick !== this.props.newick ||
			prevState.layout !== this.state.layout ||
			prevState.scaling !== this.state.scaling ||
			prevState.alignTips !== this.state.alignTips ||
			prevState.showLabels !== this.state.showLabels ||
			prevState.fontSize !== this.state.fontSize ||
			prevState.width !== this.state.width ||
			prevState.height !== this.state.height ||
			prevState.branchColor !== this.state.branchColor ||
			prevState.labelColor !== this.state.labelColor ||
			prevState.nodeColor !== this.state.nodeColor ||
			prevState.highlightedIsolates !== this.state.highlightedIsolates ||
            prevState.highlightedClades !== this.state.highlightedClades ||
            prevState.isolateRenames !== this.state.isolateRenames
		) {
			this.renderTree();
		}
	}

    //Updates user choices
    handleOptionChange = e => {
        const { name, value, type, checked } = e.target;

        let nextValue = type === "checkbox" ? checked : value;

        //Returns to Automatic scaling if unset
        if ((name === "width" || name === "height") && value === "") {
            nextValue = null;
        }

        this.setState({
            [name]: nextValue
        });
    }

    //Handles downloading the tree, maintaining changes
	downloadPNG = () => {
		const container = document.getElementById("tree-container");
		const svg = container ? container.querySelector("svg") : null;

        //Triggers if SVG is not present (This shouldn't happen!)
		if (!svg) {
			console.error("ERROR: No rendered tree SVG found");
			return;
		}

        //Copies the exact image on screen
		const clonedSvg = svg.cloneNode(true);

		const copyStyles = (source, target) => {
			const computedStyle = window.getComputedStyle(source);

			for (let i = 0; i < computedStyle.length; i++) {
				const property = computedStyle[i];
				target.style.setProperty(property, computedStyle.getPropertyValue(property));
			}

			for (let i = 0; i < source.children.length; i++) {
				copyStyles(source.children[i], target.children[i]);
			}
		};

		copyStyles(svg, clonedSvg);

		const width = Number(svg.getAttribute("width")) || Number(this.state.width);
		const height = Number(svg.getAttribute("height")) || Number(this.state.height);

		clonedSvg.setAttribute("width", width);
		clonedSvg.setAttribute("height", height);
		clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

		const serializer = new XMLSerializer();
		const svgString = serializer.serializeToString(clonedSvg);
		const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
		const url = URL.createObjectURL(blob);

        //Loads the chosen tree to an image
		const image = new Image();

		image.onload = () => {
			const canvas = document.createElement("canvas");
			canvas.width = width;
			canvas.height = height;

			const context = canvas.getContext("2d");

			context.fillStyle = "#ffffff";
			context.fillRect(0, 0, width, height);
			context.drawImage(image, 0, 0, width, height);

			URL.revokeObjectURL(url);

			canvas.toBlob(pngBlob => {
				if (!pngBlob) {
					console.error("ERROR: Could not create PNG");
					return;
				}

				const pngUrl = URL.createObjectURL(pngBlob);
				const link = document.createElement("a");

				link.href = pngUrl;
				link.download = "phylogenetic_tree.png";

				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);

				URL.revokeObjectURL(pngUrl);
			}, "image/png");
		};

		image.onerror = error => {
			console.error("ERROR: Could not render tree for PNG download", error);
			URL.revokeObjectURL(url);
		};

		image.src = url;
	}

    //Handles aligning right-to-left graphs
    //This requires a frustrating amount of formatting to make sure it displays right!
	attachRTLNavigation = (svgNode, mirrorGroup, treeGroup, treeWidth) => {
		let scale = this.state.zoomLevel;
		let translateX = 0;
		let translateY = 0;
		let dragging = false;
		let lastX = 0;
		let lastY = 0;

		const width = treeWidth;
		const padding = 30;
		const treeBounds = treeGroup.getBBox();
		const availableWidth = width - (padding * 2);

		if (treeBounds.width > availableWidth) {
			scale = availableWidth / treeBounds.width;
		}

		const updateTransform = () => {
			const rightEdge = width - padding;
			const initialX = rightEdge + (treeBounds.x * scale);

			mirrorGroup.setAttribute(
				"transform",
				`translate(${initialX + translateX},${translateY}) scale(${-scale},${scale})`
			);
		};

        this.applyRTLZoom = newScale => {
            scale = Math.max(0.25, Math.min(Number(newScale), 5));
            updateTransform();
        }

        //We reverse the default handling of mirrored controls enforced by phylotree
		svgNode.addEventListener("wheel", e => {
			e.preventDefault();

			const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;

			scale *= zoomFactor;
			scale = Math.max(0.25, Math.min(scale, 5));

            this.setState({ zoomLevel: scale });

			updateTransform();
		}, { passive: false });

		svgNode.addEventListener("pointerdown", e => {
			dragging = true;
			lastX = e.clientX;
			lastY = e.clientY;
			svgNode.setPointerCapture(e.pointerId);
		});

		svgNode.addEventListener("pointermove", e => {
			if (!dragging) {
				return;
			}

			translateX += e.clientX - lastX;
			translateY += e.clientY - lastY;

			lastX = e.clientX;
			lastY = e.clientY;

			updateTransform();
		});

		svgNode.addEventListener("pointerup", e => {
			dragging = false;

			if (svgNode.hasPointerCapture(e.pointerId)) {
				svgNode.releasePointerCapture(e.pointerId);
			}
		});

		svgNode.addEventListener("pointercancel", () => {
			dragging = false;
		});

		updateTransform();
	}

    //returns the zoom to 0
    resetZoom = () => {
        this.setState({
            zoomLevel:1.1
        })

        this.renderTree();
    }

    //returns all values to default
    resetView = () => {
        this.setState({
            scaling: false,
            alignTips: true,
            showLabels: true,
            fontSize: 14,
            width: null,
            height: null,

            showColourOptions: false,
            showHighlightOptions: false,
            showCladeOptions: false,
            showRenameOptions: false,

            branchColor: "#000000",
            labelColor: "#000000",
            nodeColor: "#000000",

            selectedIsolate: "",
            highlightColor: "#d62728",
            highlightedIsolates: {},

            selectedClade: "",
            cladeColor: "#2ca02c",
            highlightedClades: {},

            selectedRenameIsolate: "",
            renameValue: "",
            isolateRenames: {}
        });
    }

    //Changes the zoom level of the graph from the slider
    updateZoomLevel = svgNode => {
        if (!svgNode || !svgNode.__zoom) {
            return;
        }

        const zoomLevel = svgNode.__zoom.k;

        if (Math.abs(zoomLevel - this.state.zoomLevel) > 0.001) {
            this.setState({ zoomLevel });
        }
    }
    
    //Handles creation and updating of the Zoom slider.
    handleZoomSlider = e => {
        const targetZoom = Number(e.target.value);

        this.setState({
            zoomLevel: targetZoom
        });

        if (this.state.layout === "right-to-left") {
            if (this.applyRTLZoom) {
                this.applyRTLZoom(targetZoom);
            }

            return;
        }
        
        if (!this.nonRTLZoomBehavior || !this.nonRTLZoomSvg) {
            return;
        }

        this.nonRTLZoomSvg.call(
            this.nonRTLZoomBehavior.scaleTo,
            targetZoom
        );
    }

    getOriginalName = node => {
        return node?.data?.originalName || node?.data?.name || "";
    }

    //Renders the actual tree
	renderTree = () => {
		if (!this.props.newick) {
			console.error("ERROR: No Newick supplied");
			return;
		}

		const container = document.getElementById("tree-container");
            
		if (!container) {
			console.error("ERROR: Tree container not found");
			return;
		}

		container.innerHTML = "";

		try {
			const tree = new phylotree(this.props.newick);

            if (this.state.layout === "circular") {
                tree.getTips().forEach(tip => {
                    tip.data.originalName = tip.data.name;

                    if (tip.data.name.length > 20) {
                        tip.data.name = `${tip.data.name.slice(0, 17)}...`;
                    }
                });
            }

			const isolateNames = [];

			tree.links.forEach(link => {
				if (link.target && !link.target.children && link.target.data && link.target.data.name) {
					isolateNames.push(this.getOriginalName(link.target));
				}
			});
            
            //Gathers the individual isolates from the tree
			isolateNames.sort();

			if (
				isolateNames.length !== this.state.isolateNames.length ||
				isolateNames.some((name, index) => name !== this.state.isolateNames[index])
			) {
				this.setState({ isolateNames });
			}

			if (!this.state.scaling) {
				tree.setBranchLength(() => 1);
			}
            
            //Gathers possible clades from the tree
            const internalNodes = tree.nodes.descendants().filter(node => {
                return node.children && node.children.length > 0 && node.parent;
            });

            //Clades are named first descendant → furthest descendant in tree order,
            //plus the number of isolates.
            const cladeOptions = internalNodes.map(node => {
                const descendants = node.descendants()
                    .filter(descendant => !descendant.children)
                    .map(descendant => descendant.data && descendant.data.name)
                    .filter(Boolean);

                const tips = [...descendants].sort();
                const id = tips.join("|");

                const firstDescendant = this.getDisplayName(descendants[0]);
                const furthestDescendant = this.getDisplayName(descendants[descendants.length - 1]);
                const isRootClade = node.parent && !node.parent.parent;

                return {
                    id,
                    label: isRootClade
                        ? `Root → ${furthestDescendant} (${descendants.length} isolates)`
                        : `${firstDescendant} → ${furthestDescendant} (${descendants.length} isolates)`,
                    tips
                };
            });

            if (
                cladeOptions.length !== this.state.cladeOptions.length ||
                cladeOptions.some((clade, index) =>
                    clade.id !== this.state.cladeOptions[index]?.id ||
                    clade.label !== this.state.cladeOptions[index]?.label
                )
            ) {
                this.setState({ cladeOptions });
            }

            //Intialises basic plot variables
			const isCircular = this.state.layout === "circular";
			const isRightToLeft = this.state.layout === "right-to-left";

            //Gets the actual width available to the tree
            const availableWidth = container.getBoundingClientRect().width || container.parentElement.clientWidth || 700;

            let treeWidth;
            let treeHeight;

            //Radial trees must have a square drawing area
            if (isCircular) {
                if (this.state.width !== null && this.state.height !== null) {
                    treeWidth = Math.min(Number(this.state.width), Number(this.state.height));
                } else if (this.state.width !== null) {
                    treeWidth = Number(this.state.width);
                } else if (this.state.height !== null) {
                    treeWidth = Number(this.state.height);
                } else {
                    treeWidth = availableWidth;
                }

                treeWidth = Math.max(200, treeWidth);
                treeHeight = treeWidth;
            } else {
                treeWidth = this.state.width === null ? availableWidth : Math.max(200, Number(this.state.width));
                treeHeight = this.state.height === null ? 700 : Math.max(200, Number(this.state.height));
            }

            //Scales font and node sizes based on the number of isolates
            //This ensures the tree is legible even for large numbers
            //This currently only applies to RADIAL trees
            const tipCount = tree.getTips().length;
            const tipScale = isCircular ? Math.min(1, Math.sqrt(6 / Math.max(tipCount, 6))) : 1;

            const displayFontSize = Math.max(5, Number(this.state.fontSize) * tipScale);
            const nodeRadius = Math.max(1, 3 * tipScale);
            const highlightBranchWidth = isCircular ? Math.max(1.5, 3 * tipScale) : 3;
            const highlightTracerWidth = isCircular ? Math.max(1, 2 * tipScale) : 2;

            //Renders the tree, taking user input into account
            const renderer = tree.render({
                container: "#tree-container",
                width: treeWidth,
                height: treeHeight,
                layout: "left-to-right",
                "is-radial": isCircular,
                "align-tips": this.state.alignTips,
                "left-right-spacing": "fit-to-size",
                "top-bottom-spacing": "fit-to-size",
                "font-size": isCircular ? displayFontSize : 14,
                "show-labels": this.state.showLabels,
                "show-scale": this.state.scaling,
                brush: false,
                zoom: !isRightToLeft,
                "annular-limit": isCircular ? 0.1 : 0.5,
	            "max-radius": isCircular ? (Math.min(treeWidth, treeHeight) / 2) - 40 : 768,
            });

            if (!isRightToLeft && renderer.zoomBehavior) {
                renderer.zoomBehavior.on("zoom.slider", event => {
                    const zoomLevel = Math.max(0.25, Math.min(event.transform.k, 5));

                    this.setState({
                        zoomLevel
                    });
                });

                this.nonRTLZoomBehavior = renderer.zoomBehavior;
                this.nonRTLZoomSvg = renderer.svg;
            }

            //Creates the node for printing the tree
            const svgNode = renderer.svg && typeof renderer.svg.node === "function"
                ? renderer.svg.node()
                : null;

            if (!svgNode) {
                return;
            }

            svgNode.style.width = `${treeWidth}px`;
            svgNode.style.height = `${treeHeight}px`;
            svgNode.setAttribute("width", treeWidth);
            svgNode.setAttribute("height", treeHeight);
            
            if (isCircular) {
                const treeGroup = svgNode.querySelector(".phylotree-container");

                if (treeGroup) {
                    const originalTransform = treeGroup.getAttribute("transform") || "";
                    const initialZoom = 1.2;

                    treeGroup.setAttribute(
                        "transform",
                        `${originalTransform} scale(${initialZoom})`
                    );
                }
            }

            //Applies radial scaling
            svgNode.querySelectorAll(".phylotree-node-text").forEach(label => {
                label.style.fontSize = `${displayFontSize}px`;
                label.style.fill = this.state.labelColor;
            });

            svgNode.querySelectorAll(".internal-node circle, .node circle").forEach(node => {
                node.style.fill = this.state.nodeColor;
                node.setAttribute("r", nodeRadius);
            });

            //Colours branches appropriately
			svgNode.querySelectorAll(".branch").forEach(branch => {
				branch.style.stroke = this.state.branchColor;
			});

            //Colours Tracer line by their branch
			svgNode.querySelectorAll(".branch-tracer").forEach(branch => {
				branch.style.stroke = this.state.branchColor;
			});

            //Allows renaming of individual isolates 
            svgNode.querySelectorAll(".node").forEach(node => {
                const nodeData = node.__data__;
                const isolateName = this.getOriginalName(nodeData);
                const label = node.querySelector(".phylotree-node-text");

                if (!isolateName || !label) {
                    return;
                }

                const renamed = this.state.isolateRenames[isolateName];

                if (renamed) {
                    label.textContent = isCircular && renamed.length > 20 ? `${renamed.slice(0, 17)}...` : renamed;
                }
            });

            //Handles colouring of a full clade
            Object.entries(this.state.highlightedClades).forEach(([cladeId, color]) => {
                const cladeNode = internalNodes.find(node => this.getCladeId(node) === cladeId);

                if (!cladeNode) {
                    return;
                }

                const descendants = new Set(cladeNode.descendants());

                //Colours every branch within the clade
                svgNode.querySelectorAll(".branch").forEach(branch => {
                    const branchData = branch.__data__;

                    if (branchData && descendants.has(branchData.target)) {
                        branch.style.stroke = color;
                        branch.style.strokeWidth = `${highlightBranchWidth}px`;
                    }
                });

                //Colours internal branching nodes within the clade
                svgNode.querySelectorAll(".internal-node").forEach(internalNode => {
                    const nodeData = internalNode.__data__;

                    if (nodeData && descendants.has(nodeData)) {
                        const circle = internalNode.querySelector("circle");

                        if (circle) {
                            circle.style.fill = color;
                            circle.style.stroke = color;
                        }
                    }
                });

                //Colours all isolate labels and tracers within the clade
                svgNode.querySelectorAll(".node").forEach(tipNode => {
                    const nodeData = tipNode.__data__;

                    if (!nodeData || !descendants.has(nodeData)) {
                        return;
                    }

                    const label = tipNode.querySelector(".phylotree-node-text");
                    const tracer = tipNode.querySelector(".branch-tracer");

                    if (label) {
                        label.style.fill = color;
                        label.style.fontWeight = "bold";
                    }

                    if (tracer) {
                        tracer.style.stroke = color;
                        tracer.style.strokeWidth = `${highlightTracerWidth}px`;
                    }
                });
            });

            //Handles isolate colouring
			Object.entries(this.state.highlightedIsolates).forEach(([isolateName, color]) => {
				const node = svgNode.querySelector(`[data-node-name="${CSS.escape(isolateName)}"]`);

				if (!node) {
					return;
				}

				const label = node.querySelector(".phylotree-node-text");
				const tracer = node.querySelector(".branch-tracer");
                const tipData = node.__data__;
                    
                //Colours the label
                if (label) {
                    label.style.fill = color;
                    label.style.fontWeight = "bold";
                }
                
                //Colours the tracer line (if present)
                if (tracer) {
                    tracer.style.stroke = color;
                    tracer.style.strokeWidth = `${highlightTracerWidth}px`;
                }
                
                //Colours the branching node
                if (tipData && tipData.parent) {
                    svgNode.querySelectorAll(".internal-node").forEach(internalNode => {
                        if (internalNode.__data__ === tipData.parent) {
                            const circle = internalNode.querySelector("circle");

                            if (circle) {
                                circle.style.fill = color;
                                circle.style.stroke = color;
                            }
                        }
                    });
                }
                
                //Colours the branch
                if (tipData) {
                    svgNode.querySelectorAll(".branch").forEach(branch => {
                        const branchData = branch.__data__;

                        if (branchData && branchData.target === tipData) {
                            branch.style.stroke = color;
                            branch.style.strokeWidth = `${highlightBranchWidth}px`;
                        }
                    });
                }
                });

            //Handles creating a right-to-left graph
			if (isRightToLeft) {
				const treeGroup = svgNode.querySelector(".phylotree-container");
				const scaleBar = svgNode.querySelector(".tree-scale-bar");

				if (treeGroup) {
					const parent = treeGroup.parentNode;
					const mirrorGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

					mirrorGroup.setAttribute("class", "rtl-mirror");
					parent.insertBefore(mirrorGroup, treeGroup);
					mirrorGroup.appendChild(treeGroup);

					treeGroup.querySelectorAll(".phylotree-node-text").forEach(label => {
						const originalTransform = label.getAttribute("transform") || "";

						label.setAttribute(
							"transform",
							`${originalTransform} scale(-1,1)`
						);

						label.setAttribute("text-anchor", "end");
						label.setAttribute("dx", "-4.62");
					});

					this.attachRTLNavigation(svgNode, mirrorGroup, treeGroup, treeWidth);
				}
                
                //We also mirror the scale bar
				if (scaleBar) {
					const parent = scaleBar.parentNode;
					const scaleMirrorGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

					scaleMirrorGroup.setAttribute("class", "rtl-scale-mirror");
					scaleMirrorGroup.setAttribute("transform", `translate(${treeWidth},0) scale(-1,1)`);

					parent.insertBefore(scaleMirrorGroup, scaleBar);
					scaleMirrorGroup.appendChild(scaleBar);

					scaleBar.querySelectorAll("text").forEach(label => {
						const originalTransform = label.getAttribute("transform") || "";

						label.setAttribute(
							"transform",
							`${originalTransform} scale(-1,1)`
						);
					});
				}
			}

            svgNode.querySelectorAll(".branch, .branch-tracer").forEach(branch => {
                branch.style.vectorEffect = "non-scaling-stroke";
            });

            container.appendChild(svgNode);

            //Updates the zoom slider based on manual scrolling      
            if (!isRightToLeft) {
                svgNode.addEventListener("wheel", () => {
                    requestAnimationFrame(() => {
                        if (!svgNode.__zoom) {
                            return;
                        }

                        const zoomLevel = Math.max(0.25, Math.min(svgNode.__zoom.k, 5));
                        const zoomSlider = document.querySelector(".tree-zoom-slider");

                        if (zoomSlider) {
                            zoomSlider.value = zoomLevel;
                        }

                        this.nonRTLZoomLevel = zoomLevel;

                        clearTimeout(this.zoomStateTimeout);

                        this.zoomStateTimeout = setTimeout(() => {
                            this.setState({
                                zoomLevel: this.nonRTLZoomLevel
                            });
                        }, 25);
                    });
                });
            }
            if (isCircular) {
                const treeGroup = svgNode.querySelector(".phylotree-container");

                if (treeGroup) {
                    const parent = treeGroup.parentNode;
                    const zoomGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
                    const initialZoom = 1.1;

                    zoomGroup.setAttribute("class", "radial-initial-zoom");

                    parent.insertBefore(zoomGroup, treeGroup);
                    zoomGroup.appendChild(treeGroup);

                    const bounds = zoomGroup.getBBox();
                    const centreX = treeWidth / 2;
                    const centreY = treeHeight / 2;
                    const boundsCentreX = bounds.x + (bounds.width / 2);
                    const boundsCentreY = bounds.y + (bounds.height / 2);

                    const translateX = centreX - (boundsCentreX * initialZoom);
                    const translateY = centreY - (boundsCentreY * initialZoom);

                    zoomGroup.setAttribute(
                        "transform",
                        `translate(${translateX},${translateY}) scale(${initialZoom})`
                    );
                }
            }

			if (isRightToLeft) {
				const offset = container.clientWidth - treeWidth;

				svgNode.style.position = "relative";
				svgNode.style.left = `${offset}px`;
			}

		} catch (error) {
			console.error("TREE RENDER ERROR:", error);
			console.error(error.stack);
		}
	}

    //Renders the input options and the tree. Can't comment in here!
	render() {
		return (
			<div className="tree-viewer-wrapper">
                <div className="tree-display-row">
				<div className="tree-viewer-main">
					<div
						id="tree-container"
						className="tree-viewer"
					></div>
				</div>
                <div className="tree-zoom-control">
                    <span className="tree-zoom-label">+</span>

                    <input
                        type="range"
                        className="tree-zoom-slider"
                        min="0.25"
                        max="5"
                        step="0.01"
                        value={this.state.zoomLevel}
                        onInput={this.handleZoomSlider}
                    />

                    <span className="tree-zoom-label">−</span>
                </div>
                </div>
				<div className="tree-options-panel">
					<div className="tree-option tree-download-option">
						<button
							type="button"
							className="tree-download-button"
							onClick={this.downloadPNG}
						>
							Download PNG
						</button>
					</div>

                    <div className="tree-view-buttons">
                        <button
                            type="button"
                            className="tree-view-button"
                            onClick={this.resetZoom}
                            data-tooltip="Return the tree to its initial zoom and position."
                        >
                            Reset zoom
                        </button>

                        <button
                            type="button"
                            className="tree-view-button"
                            onClick={this.resetView}
                            data-tooltip="Restore all tree settings, colours and highlights to their defaults."
                        >
                            Reset tree
                        </button>
                    </div>

					<div className="tree-option">
						<label htmlFor="layout">Layout:</label>
						<select
							id="layout"
							name="layout"
							value={this.state.layout}
							onChange={this.handleOptionChange}
						>
							<option value="circular">Radial</option>
							<option value="left-to-right">Left to right</option>
							<option value="right-to-left">Right to left</option>
						</select>
					</div>

					<div className="tree-option"
                        data-tooltip="Use the branch lengths stored in the Newick file. When disabled, all branches are displayed with equal length."
                    >
						<label htmlFor="scaling">Scale branches:</label>
						<input
							id="scaling"
							name="scaling"
							type="checkbox"
							checked={this.state.scaling}
							onChange={this.handleOptionChange}
						/>
					</div>

					<div className="tree-option"
                        data-tooltip="Align all terminal isolates at the same endpoint to make labels easier to compare."
                    >
						<label htmlFor="alignTips">Align tips:</label>
						<input
							id="alignTips"
							name="alignTips"
							type="checkbox"
							checked={this.state.alignTips}
							onChange={this.handleOptionChange}
						/>
					</div>

					<div className="tree-option"
                        data-tooltip="Show or hide isolate names on the tree."
                    >
						<label htmlFor="showLabels">Show labels:</label>
						<input
							id="showLabels"
							name="showLabels"
							type="checkbox"
							checked={this.state.showLabels}
							onChange={this.handleOptionChange}
						/>
					</div>

					<div className="tree-option">
						<label htmlFor="fontSize">Label size:</label>
						<input
							id="fontSize"
							name="fontSize"
							type="number"
							min="8"
							max="30"
							value={this.state.fontSize}
							onChange={this.handleOptionChange}
						/>
					</div>

					<div className="tree-option">
						<label htmlFor="width">Tree width:</label>
                            <input
                                id="width"
                                name="width"
                                type="number"
                                value={this.state.width === null ? "" : this.state.width}
                                placeholder="Auto"
                                onChange={this.handleOptionChange}
                            />
					</div>

					<div className="tree-option">
						<label htmlFor="height">Tree height:</label>
						<input
							id="height"
							name="height"
							type="number"
							value={this.state.height === null ? "" : this.state.height}
							placeholder="Auto"
                            onChange={this.handleOptionChange}
						/>
					</div>

					<div className="tree-colour-accordion">
						<button
							type="button"
							className="tree-colour-toggle"
							onClick={this.toggleColourOptions}
						>
							Alter tree colours
							<span>{this.state.showColourOptions ? "▲" : "▼"}</span>
						</button>

						{this.state.showColourOptions && (
							<div className="tree-colour-options">

								<div className="tree-option">
									<label htmlFor="branchColor">Branches:</label>
									<input
										id="branchColor"
										name="branchColor"
										type="color"
										value={this.state.branchColor}
										onChange={this.handleOptionChange}
									/>
								</div>

								<div className="tree-option">
									<label htmlFor="labelColor">Labels:</label>
									<input
										id="labelColor"
										name="labelColor"
										type="color"
										value={this.state.labelColor}
										onChange={this.handleOptionChange}
									/>
								</div>

								<div className="tree-option">
									<label htmlFor="nodeColor">Nodes:</label>
									<input
										id="nodeColor"
										name="nodeColor"
										type="color"
										value={this.state.nodeColor}
										onChange={this.handleOptionChange}
									/>
								</div>

							</div>
						)}
					</div>

                    <div className="tree-highlight-accordion">
                        <div
                            className="tree-tooltip-target"
                            data-tooltip="Highlight an individual isolate, its terminal branch and its immediate ancestral node."
                        >
                            <button
                                type="button"
                                className="tree-colour-toggle"
                                onClick={this.toggleHighlightOptions}
                            >
                                Highlight isolates
                                <span>{this.state.showHighlightOptions ? "▲" : "▼"}</span>
                            </button>
                        </div>

						{this.state.showHighlightOptions && (
							<div className="tree-highlight-options">

								<div className="tree-option tree-option-stacked">
									<label htmlFor="selectedIsolate">Isolate:</label>
									<select
										id="selectedIsolate"
										name="selectedIsolate"
										value={this.state.selectedIsolate}
										onChange={this.handleOptionChange}
									>
										<option value="">Select isolate</option>

										{this.state.isolateNames.map(isolateName => (
                                            <option key={isolateName} value={isolateName}>
                                                {this.state.isolateRenames[isolateName] || isolateName}
                                            </option>
										))}
									</select>
								</div>

								<div className="tree-option">
									<label htmlFor="highlightColor">Colour:</label>
									<input
										id="highlightColor"
										name="highlightColor"
										type="color"
										value={this.state.highlightColor}
										onChange={this.handleOptionChange}
									/>
								</div>

								<button
									type="button"
									className="tree-highlight-button"
									onClick={this.addIsolateHighlight}
									disabled={!this.state.selectedIsolate}
								>
									Add highlight
								</button>
                                
								{Object.entries(this.state.highlightedIsolates).length > 0 && (
									<div className="tree-highlight-list">
										{Object.entries(this.state.highlightedIsolates).map(([isolateName, color]) => (
											<div key={isolateName} className="tree-highlight-item">
												<span
													className="tree-highlight-swatch"
													style={{ backgroundColor: color }}
												></span>

                                                <span className="tree-highlight-name">
                                                    {this.getDisplayName(isolateName)}
                                                </span>

												<button
													type="button"
													className="tree-highlight-remove"
													onClick={() => this.removeIsolateHighlight(isolateName)}
												>
													×
												</button>
											</div>
										))}
									</div>
								)}

                                

							</div>
						)}
					</div>
                    
                    <div className="tree-clade-accordion">
                        <div
                            className="tree-tooltip-target"
                            data-tooltip="Highlight all branches, nodes and isolates belonging to a selected clade."
                        >
                            <button
                                type="button"
                                className="tree-colour-toggle"
                                onClick={this.toggleCladeOptions}
                            >
                                Highlight clade
                                <span>{this.state.showCladeOptions ? "▲" : "▼"}</span>
                            </button>
                        </div>

                        {this.state.showCladeOptions && (
                            <div className="tree-highlight-options">

                                <div className="tree-option tree-option-stacked">
                                    <label htmlFor="selectedClade">Clade:</label>
                                    <select
                                        id="selectedClade"
                                        name="selectedClade"
                                        value={this.state.selectedClade}
                                        onChange={this.handleOptionChange}
                                    >
                                        <option value="">Select clade</option>

                                        {this.state.cladeOptions.map(clade => (
                                            <option key={clade.id} value={clade.id}>
                                                {clade.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="tree-option">
                                    <label htmlFor="cladeColor">Colour:</label>
                                    <input
                                        id="cladeColor"
                                        name="cladeColor"
                                        type="color"
                                        value={this.state.cladeColor}
                                        onChange={this.handleOptionChange}
                                    />
                                </div>

                                <button
                                    type="button"
                                    className="tree-highlight-button"
                                    onClick={this.addCladeHighlight}
                                    disabled={!this.state.selectedClade}
                                >
                                    Add clade highlight
                                </button>

                                {Object.entries(this.state.highlightedClades).length > 0 && (
                                    <div className="tree-highlight-list">
                                        {Object.entries(this.state.highlightedClades).map(([cladeId, color]) => {
                                            const clade = this.state.cladeOptions.find(option => option.id === cladeId);

                                            return (
                                                <div key={cladeId} className="tree-highlight-item">
                                                    <span
                                                        className="tree-highlight-swatch"
                                                        style={{ backgroundColor: color }}
                                                    ></span>

                                                    <span className="tree-highlight-name">
                                                        {clade ? clade.label : "Clade"}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        className="tree-highlight-remove"
                                                        onClick={() => this.removeCladeHighlight(cladeId)}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                            </div>
                        )}
                    </div>

                    <div className="tree-rename-accordion">
                        <div
                            className="tree-tooltip-target"
                            data-tooltip="Change the displayed name of an isolate."
                        >
                            <button
                                type="button"
                                className="tree-colour-toggle"
                                onClick={this.toggleRenameOptions}
                            >
                                Rename isolates
                                <span>{this.state.showRenameOptions ? "▲" : "▼"}</span>
                            </button>
                        </div>

                        {this.state.showRenameOptions && (
                            <div className="tree-highlight-options">

                                <div className="tree-option tree-option-stacked">
                                    <label htmlFor="selectedRenameIsolate">Isolate:</label>
                                    <select
                                        id="selectedRenameIsolate"
                                        name="selectedRenameIsolate"
                                        value={this.state.selectedRenameIsolate}
                                        onChange={this.handleOptionChange}
                                    >
                                        <option value="">Select isolate</option>

                                        {this.state.isolateNames.map(isolateName => (
                                            <option key={isolateName} value={isolateName}>
                                                {this.state.isolateRenames[isolateName] || isolateName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="tree-option tree-option-stacked">
                                    <label htmlFor="renameValue">New name:</label>
                                    <input
                                        id="renameValue"
                                        name="renameValue"
                                        type="text"
                                        value={this.state.renameValue}
                                        onChange={this.handleOptionChange}
                                    />
                                </div>

                                <button
                                    type="button"
                                    className="tree-highlight-button"
                                    onClick={this.renameIsolate}
                                    disabled={!this.state.selectedRenameIsolate || !this.state.renameValue.trim()}
                                >
                                    Rename
                                </button>

                                 <button
                                    type="button"
                                    className="tree-highlight-button tree-restore-button"
                                    onClick={this.restoreIsolateNames}
                                    disabled={Object.keys(this.state.isolateRenames).length === 0}
                                    data-tooltip="Restore all renamed isolates to their original names."
                                >
                                    Restore original names
                                </button>

                            </div>
                        )}
                    </div>

				</div>

			</div>
		);
	}
}

export default TreeViewer;