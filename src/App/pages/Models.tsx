import { ModelCards } from './ModelCards';

export function Models() {
    return (
        <div className="flex flex-1 flex-col h-full">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 overflow-y-auto flex-1 min-h-0">
                <ModelCards />
            </div>
        </div>
    );
}
