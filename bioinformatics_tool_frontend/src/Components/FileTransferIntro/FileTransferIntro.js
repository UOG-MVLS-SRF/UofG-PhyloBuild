import React from "react";
import dev_tool_png from "../../dev_tool.png";
import "./FileTransferIntro.css";

class FileTransferIntro extends React.Component {
    openCustomSizeWindow = () => {
      const width = 800;  // Customize the width
      const height = 600; // Customize the height
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;

      const customWindow = window.open(
        '',
        '',
        `width=${width},height=${height},top=${top},left=${left}`
      );

      // Use the imported image source directly in the new window
      const imgSrc = dev_tool_png; // This is your imported image
      customWindow.document.write(`<img src="${imgSrc}" alt="dev_tool_png"  />`);

      // Close the window when you're done
      // customWindow.close();
    }
    render() {
        return (
            <div id="description-section">
                <p className="description-text">
                    Please click "ctrl + shift + I" to open developer tool, and click "Network".
                    If you are uploading files, please assure that all "/upload_files" request with status "200"
                    before you click Run button.
                </p>
                <br/>
                <a href="javascript:void(0);" onClick={this.openCustomSizeWindow}>
                    Demo Image
                </a>
            </div>
        )
    }

}

export default FileTransferIntro