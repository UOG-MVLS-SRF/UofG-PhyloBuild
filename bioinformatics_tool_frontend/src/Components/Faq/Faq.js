import React from "react";
import './Faq.css';
import Faq from "react-faq-component";
import Header from "../HomePage/Header";
import Footer from "../HomePage/Footer";

class FaqComponent extends React.Component {

    render(){

        const data = {
            title: "Frequently Asked Questions",
            rows : [
            {
             "title": "If something goes wrong, what should I do?",
             "content": "If things are going wrong and you're receiving error messages, have another read of the documentation to make sure your inputs and selected parameters are correct. If things still are not working, you can raise an issue on GitHub."
            },
            {
             "title": "Will the format of my data be checked? ",
             "content": "Yes, a check to make sure the inputs used in construction of the tree are in FASTA format will take place."
            },
            {
             "title": "Do I have to use genes?",
             "content": "You can use loci / genes / regions that are variable between the species/strains that you are interested in making a tree for - it's completely up to you what you use as the “orthologues” for the tree construction. If you use PhyloGenes to generate them, it expects the full set of CDS for a reference strain and uses those to construct the orthologues."
            },
            {
             "title": "Do I have to use the script / plot output provided in Phylo-Build?",
             "content": "No, one of the outputs will be a Newick Format File, which you can extract and generate your own plots of interest with. We've utilised the ggtree package on R, which is very well documented."
            },
            {
             "title": "How many genomes / genes should I be using to build the tree?",
             "content": "For the genomes/strains, you can use as many or as few as you wish - however the time taken to run the tool will most likely increase with more being included. Of course, it is completely up to you and you can use as few as you wish. For the orthologues/genes, it really depends on how well the strains are separated on the tree - in some tests we've found that only 1 orthologue can give great separation, but you may wish to include more to make sure separation looks good on the tree. It is a slight trial-and-error step. Again, an increase in the number of orthologues will most likely increase the time taken to run the tool."
            },
            {
             "title": "Something is going wrong with the PhyloGenes step, what should I do?",
             "content": "We would generally recommend trying to generate your own list of orthologues - but in the case that you're using PhyloGenes to generate a list, if something is going wrong this may be due to the formatting (in which case, double check that it is in FASTA format, with reasonable header names), or due to a lack of matching sequences in the other strains (in which case, the pipeline will stop due to different sequencing lengths). If anything else arises, raise an issue on the GitHub."
            },
            {
             "title": "How can I construct a list of orthologues?",
             "content": "Use literature and your own biological knowledge - generally orthologues should exist in all strains being tested, and it's occasionally a trial-and-error process to determine a good orthologue (or set of orthologues)."
            },
            {
             "title": "What is the carriage heatmap?",
             "content": "If you provide a set of genes to screen for (e.g. resistance or virulence genes), PhyloBuild shows which strains carry each gene as a coloured ring around the tree. If you also upload genomes of interest, it additionally produces a separate heatmap showing gene carriage for just those selected strains."
            },
            {
             "title": "How do I get my results?",
             "content": "When your job finishes you will receive an email with the result figures attached. You can also download them from the Results page by entering the job ID shown in your confirmation email."
            },
            {
             "title": "I'm having an issue with the web tool, what should I do?",
             "content": "Give us an email or open an issue on the GitHub - we will contact the relevant people to investigate issues."
            }
        ]}

        const styles = {
            titleTextColor: "#003865",
            titleBgColor: "#003865",
            rowTitleColor: "#003865",
            rowContentColor: "#4F5961",
            arrowColor: "#003865",
        };
        
        const config = {
            animate: true,
            tabFocus: true
        };

        return(
        <>
        <Header/>
        <div className="container_faq">
            <Faq
                data={data}
                styles={styles}
                config={config}
            />
        </div>
        <Footer/>
        </>
        )
    }
}

export default FaqComponent