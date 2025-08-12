import { useTranslation } from 'react-i18next';
import headerImage from '/header.webp';

import './Welcome.css';

export function Welcome() {
    const { t } = useTranslation();

    return (
        <div className="welcome-container">
            <h1 className="welcome">
                {t('welcome')}
                <sup className="alpha">(alpha)</sup>
            </h1>
            <div className="hint">
                <p className="hint-text">{t('welcome_choose_a_model')}</p>
            </div>
            <img src={headerImage} alt="Hammerhead Logo" />
        </div>
    );
}
