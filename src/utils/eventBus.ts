type Listener<T> = (data: T) => void;

class EventBus {
    private events: Map<string, Listener<any>[]> = new Map();

    on<T>(event: string, listener: Listener<T>): () => void {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event)!.push(listener);

        // Return unsubscribe function
        return () => this.off(event, listener);
    }

    off<T>(event: string, listener: Listener<T>): void {
        if (!this.events.has(event)) return;

        const listeners = this.events.get(event)!;
        this.events.set(
            event,
            listeners.filter((l) => l !== listener)
        );
    }

    emit<T>(event: string, data: T): void {
        if (!this.events.has(event)) return;

        this.events.get(event)!.forEach((listener) => {
            listener(data);
        });
    }
}

export const eventBus = new EventBus();
