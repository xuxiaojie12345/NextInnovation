import React from "react";
import { Link } from "react-router-dom";
import "./HDocHelp.css";

const HDocHelp: React.FC = () => {
  return (
    <div className='hdoc-help-container'>
      <div className='help-content-box'>
        <h2 className='help-title'>HDoc Help</h2>

        {/* HDoc Users Manual Section */}
        <div className='help-section'>
          <ul className='manual-links'>
            <li>
              <Link to='/DownloadAndPrintQuickGuides' className='help-link'>
                HDoc Quick Guide
              </Link>
            </li>
            <li>
              <Link to='/document-types' className='help-link'>
                List of document types.
              </Link>
            </li>
            <li>
              <Link to='/markets-in-hdoc' className='help-link'>
                Markets in Hdoc
              </Link>
            </li>
            <li>
              <Link to='/market-document-settings-list' className='help-link'>
                HDoc - Market Document Setting
              </Link>
            </li>
            <li>
              <Link to='/Description' className='help-link'>
                Describation
              </Link>
            </li>
          </ul>
        </div>

        {/* Basic Introduction Section */}
        <div className='help-section'>
          <h3 className='section-heading'>Basic Introduction</h3>
          <p className='section-text'>
            To generate a document do the following:
          </p>
          <ol className='numbered-list'>
            <li>Enter chassis series and chassis</li>
            <li>Select document type</li>
            <li>
              Select language. Note always German for Austria Noise document.
            </li>
            <li>Enter other information like document number etc.</li>
          </ol>
        </div>

        {/* Document Types Section */}
        <div className='help-section'>
          <h3 className='section-heading'>Document Types</h3>
          <p className='section-text'>
            HDoc can generate a large number of different document types, for
            example VIN Plate, CEMT, Austria Noise etc.
          </p>
          <Link to='/document-types' className='help-link'>
            List of document types.
          </Link>
        </div>

        {/* Available Variables Section */}
        <div className='help-section'>
          <h3 className='section-heading'>Available Variables</h3>
          <p className='section-text'>
            There are 5 different kind of variables in HDoc:
          </p>
          <ol className='numbered-list'>
            <li>Variables like VIN number komming directly from VDA.</li>
            <li>Input on the HDoc main form, like address filed etc.</li>
            <li>Calculated values in HDoc like weight</li>
            <li>Special variables for date etc.</li>
            <li>User defined variables, in the HDoc database.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default HDocHelp;
