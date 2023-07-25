import React from 'react';

const DialogBox = ({ onClose }) => {
    return (

        <div>
            <h3>Are you working overtime?</h3>
            <button onClick={onClose}>Close</button>
        </div>
    );
};

export default DialogBox;