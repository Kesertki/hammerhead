import { useExternalState } from '@/hooks/useExternalState.ts';
import { llmState } from '@/state/llmState.ts';

export function Settings() {
	const state = useExternalState(llmState);

	return (
		<div className="p-4">
			<h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
				Settings
			</h1>
			<p>Version: {state.appVersion}</p>
		</div>
	);
}
