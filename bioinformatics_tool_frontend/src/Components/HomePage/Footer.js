import React from "react";
import './HomePage.css';
import logo_colour  from "../../UoG_colour.png";

class Footer extends React.Component {
    
    render(){

        return(
        <>
        <div className="Footer">
        <div className="row">
          <div className="block">
            <div className="block_logo_colour">
              <img id="Logo" src={logo_colour} alt="Logo"/>
              <div className="footer_text_logo">
                The University of Glasgow is a registered Scottish charity: Registration Number SC004401
              </div>
            </div>
          </div>
          <div className="block">
            <div className="footer_text">
              <h3>PhyloTree</h3>
              <p>Bioinformatics Visualisation Tool</p>
              <p>Contact us</p>
            </div>
          </div>
          <div className="block">
            <div className="footer_text_uni">
              Legal<br/>
              Accessibility<br/>
              Disclaimer<br/>
              Freedom of Information<br/>
              FOI publication scheme<br/>
              Modern Slavery Statement<br/>
              Privacy and cookied<br/>
            </div>
          </div>
        </div>
      </div>
        </>
        )
    }
}

export default Footer