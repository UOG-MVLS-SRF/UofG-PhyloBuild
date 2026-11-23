import React from "react";
import FileItem from "../FileItem/FileItem";
import './FileList.css';

class FileList extends React.Component {

    removeFiles = fileName => {
        this.props.removeFile(fileName);
    }

    render() {
        const { list, size } = this.props;
        const listClass = `files_list_${size}`; // dynamic class based on size

        return(
            <ul className={listClass}>
                {list && list.map(f => (
                    <FileItem key={f.name} file={f} removeFiles={this.removeFiles}/>
                ))}
            </ul>
        );
    }
}

export default FileList;
