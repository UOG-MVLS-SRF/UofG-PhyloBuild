import React from "react";
import './About.css';
import Header from "../HomePage/Header";
import Footer from "../HomePage/Footer";

class About extends React.Component {

    render(){

        return(
        <>
        <Header/>
        <div className="container_about">
            <h1 className="about_heading">About PhyloBuild</h1>
            <div className="about_text">
            PhyloBuild is a web tool for building phylogenetic trees from bacterial genomes
            and visualising gene carriage across them. You upload a set of genomes and a few
            marker genes (orthologues); PhyloBuild finds those genes in each genome, aligns
            them, and builds a phylogenetic tree showing how the strains relate to one another.<br/>
            <br/>
            You can also screen the same genomes for genes of interest - for example
            antibiotic-resistance or virulence genes - and see which strains carry them as a
            colour-coded ring around the tree, with an optional heatmap for a chosen subset of
            strains.<br/>
            <br/>
            The results (the tree and heatmaps) are returned as figures you can download or
            receive by email, along with a Newick tree file you can reuse in other software.<br/>
            </div>
        </div>
        <Footer/>
        </>
        )
    }
}

export default About