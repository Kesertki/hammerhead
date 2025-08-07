import headerImage from '/header.webp';

import './Welcome.css';

export function Welcome() {
    return (
        <div className="welcome-container">
            <h1 className="welcome">
                Welcome to Hammerhead<sup className="alpha">(alpha)</sup>
            </h1>
            <div className="hint">
                <p className="hint-text">Choose a model file to start chatting</p>
            </div>
            <img src={headerImage} alt="Hammerhead Logo" />
        </div>
    );
}
