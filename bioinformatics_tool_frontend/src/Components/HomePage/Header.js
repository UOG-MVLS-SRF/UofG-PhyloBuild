import React from "react";
import './HomePage.css';
import logo from "../../UoG_keyline.png";
import { Link } from 'react-router-dom'

class Header extends React.Component {
    render(){

        return(
        <>
        <div className="Header">
        <div className="row">
            <div align="left" className="block_title">
            <Link to="/">
              PhyloTree
            </Link>
            </div>
            <div align="right" className="block_logo">
              <img id="Logo" src={logo} alt="Logo"/>
            </div>
          </div>
        </div>
        <div className="menu">
        <div className="row">
            <div align="right" className="block">
              <Link id="link" className="link" to="/">Home</Link>
              <Link id="link" className="link" to="/results">Results</Link>
              <Link id="link" className="link" to="/updates">Updates</Link>
              <Link id="link" className="link" to="/about">About</Link>
              <Link id="link" className="link" to="/faq">FAQ</Link>
            </div>
          </div>
        </div>
        </>
        )
    }
}

export default Header