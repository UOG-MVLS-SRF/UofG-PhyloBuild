import React from "react";
import Popup from "reactjs-popup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleQuestion } from "@fortawesome/free-regular-svg-icons";

const HelpIcon = ({ text }) => {
	return (
		<Popup
			trigger={
				<span className="help_icon">
					<FontAwesomeIcon icon={faCircleQuestion} />
				</span>
			}
			position="top center"
			on={["hover"]}
		>
			<div className="help_popup">
				{text}
			</div>
		</Popup>
	);
};

export default HelpIcon;