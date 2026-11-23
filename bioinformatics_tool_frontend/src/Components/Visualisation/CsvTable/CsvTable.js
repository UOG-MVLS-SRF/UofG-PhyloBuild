import React from "react";

class CsvTable extends React.Component {
    handleDataChange = (event, rowIndex, colIndex) => {
        // Notify parent of the change
        this.props.onDataChange(event.target.value, rowIndex, colIndex);

    };

    uniqueGroups = () => {
        const csv = this.props.data
        const groups = csv.map(subList => subList[2]);
        return [...new Set(groups)]
    }

    // Function to convert HSL to Hex format
    hslToHex = (h, s, l) => {
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');   // Convert to Hex and pad with zeros if needed
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    };

    colorDecider = () => {
        const groups = this.uniqueGroups();
        const numberOfGroups = groups.length;
        const colorScheme = {};

        // Decide the hue step to evenly spread colors
        const hueStep = 360 / numberOfGroups;

        groups.forEach((group, index) => {
            // Calculate hue for each group
            const hue = index * hueStep;
            // Convert HSL to RGB and then to Hexadecimal format
            const color = this.hslToHex(hue, 100, 50); // 100% saturation, 50% lightness
            colorScheme[group] = color;
        });

        return colorScheme;
    };


    colorAppender = () => {
        const colorScheme = this.colorDecider()
        const newData = this.props.data.map(row => {
        if (row.length > 2) {
            const groupKey = row[2];
            const color = colorScheme[groupKey];
            if (color) {
                row[4] = color;
            } else {
                row[4] = "#000000";
            }
        }
        return row;
    });
    this.props.onBulkDataChange(newData);
    }


    autoColor = () => {
        if (this.props.data.length == 0) {
            return
        }
        return <button onClick={this.colorAppender}>Auto Color</button>
    }

    render() {
        return (
            <>
                {this.autoColor()}
                <table className="csv-table">
                    <thead>
                    <tr>
                        <th>Genome (Strain)</th>
                        <th>Label (name for plot)</th>
                        <th>Group</th>
                        <th>Of Interest</th>
                        <th>Color</th>
                        {/* ... other headers */}
                    </tr>
                    </thead>
                    <tbody>
                    {this.props.data && this.props.data.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {row.map((cell, colIndex) => {
                                // For columns other than 'Of Interest', render an editable input
                                if (![0, 3].includes(colIndex)) {
                                    return (
                                        <td key={colIndex}>
                                            <input
                                                type="text"
                                                value={cell || ''}
                                                onChange={(event) => this.handleDataChange(event, rowIndex, colIndex)}
                                            />
                                        </td>
                                    );
                                } else {
                                    // For the 'Of Interest' column, render the cell value directly, making it non-editable
                                    return (
                                        <td key={colIndex}>{cell}</td>
                                    );
                                }
                            })}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </>
        );
    }
}

export default CsvTable;
