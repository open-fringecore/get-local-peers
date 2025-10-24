// packages/your-library/src/index.ts

type Item = {
    id: string;
    value: string;
    timestamp: number;
};

type Listener = (items: Item[]) => void;

class ItemStore {
    private items: Item[] = [];
    private listeners: Set<Listener> = new Set();
    private intervalId: NodeJS.Timeout | null = null;

    // Subscribe to changes
    subscribe(listener: Listener): () => void {
        this.listeners.add(listener);

        // Return unsubscribe function
        return () => {
            this.listeners.delete(listener);
        };
    }

    // Notify all listeners
    private notify(): void {
        this.listeners.forEach((listener) => listener([...this.items]));
    }

    // Get current items
    getItems(): Item[] {
        return [...this.items];
    }

    // Start generating items
    start(): void {
        if (this.intervalId) return;

        const addRandomItem = () => {
            const newItem: Item = {
                id: Math.random().toString(36).substr(2, 9),
                value: `Item ${this.items.length + 1}`,
                timestamp: Date.now(),
            };

            this.items.push(newItem);
            this.notify();

            // Schedule next item in 3-5 seconds
            const delay = Math.random() * 2000 + 3000;
            this.intervalId = setTimeout(addRandomItem, delay);
        };

        addRandomItem();
    }

    // Stop generating items
    stop(): void {
        if (this.intervalId) {
            clearTimeout(this.intervalId);
            this.intervalId = null;
        }
    }

    // Clear all items
    clear(): void {
        this.items = [];
        this.notify();
    }
}

// Export singleton instance
export const itemStore = new ItemStore();
export type { Item };
