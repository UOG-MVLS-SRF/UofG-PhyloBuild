import React from "react";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faTrash} from '@fortawesome/free-solid-svg-icons';
import './FileItem.css';

class FileItem extends React.Component{

    render(){
        return(
            <>
            <div className="list_item">
                <div className="block_name">
                    {this.props.file}
                    <div align="right" className="block_icon">
                        <FontAwesomeIcon icon={faTrash} onClick={() => this.props.removeFiles(this.props.file)}></FontAwesomeIcon>
                    </div>                
                </div> 
            </div>
            </>
        )
    }
}

export default FileItem;