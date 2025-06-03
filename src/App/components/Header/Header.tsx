import classNames from 'classnames';
import { FileUp, Trash } from 'lucide-react';
import { CSSProperties } from 'react';

import './Header.css';

export function Header({
	appVersion,
	modelName,
	onLoadClick,
	loadPercentage,
	onResetChatClick
}: HeaderProps) {
	return (
		<div className="appHeader">
			<div className="panel model">
				<div
					className={classNames('progress', loadPercentage === 1 && 'hide')}
					style={
						{
							'--progress':
								loadPercentage != null ? loadPercentage * 100 : undefined
						} as CSSProperties
					}
				/>

				{modelName != null && <div className="modelName">{modelName}</div>}
				{modelName == null && <div className="noModel">No model loaded</div>}

				<button
					className="resetChatButton"
					disabled={onResetChatClick == null}
					onClick={onResetChatClick}
				>
					<Trash className="icon" />
				</button>
				<button
					className="loadModelButton"
					onClick={onLoadClick}
					disabled={onLoadClick == null}
				>
					<FileUp className="icon" />
				</button>
			</div>
			<div className="spacer" />
			{/*<div>{loadPercentage}</div>*/}
			<div>{appVersion}</div>
		</div>
	);
}

type HeaderProps = {
	appVersion?: string;
	modelName?: string;
	onLoadClick?(): void;
	loadPercentage?: number;
	onResetChatClick?(): void;
};
