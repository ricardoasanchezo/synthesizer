export class CanvasPiano {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private activeNotes: Set<number> = new Set();
    private onNoteOn: (midiNote: number) => void;
    private onNoteOff: (midiNote: number) => void;

    // MIDI note range: Default 3 octaves starting from C3 (MIDI 48) to C6 (MIDI 84)
    private keyMap: Record<string, number> = {
        'a': 48, // C3
        'w': 49, // C#3
        's': 50, // D3
        'e': 51, // D#3
        'd': 52, // E3
        'f': 53, // F3
        't': 54, // F#3
        'g': 55, // G3
        'y': 56, // G#3
        'h': 57, // A3
        'u': 58, // A#3
        'j': 59, // B3
        'k': 60, // C4
        'o': 61, // C#4
        'l': 62, // D4
        'p': 63, // D#4
        ';': 64, // E4
    };
    private activeKeys: Set<string> = new Set();
    private startNote: number = 48;
    private numKeys: number = 36;
    private pressedKeyIndex: number | null = null;

    constructor(
        container: HTMLElement,
        onNoteOn: (midiNote: number) => void,
        onNoteOff: (midiNote: number) => void,
        startNote: number = 48,
        numKeys: number = 36
    ) {
        this.onNoteOn = onNoteOn;
        this.onNoteOff = onNoteOff;
        this.startNote = startNote;
        this.numKeys = numKeys;

        this.canvas = document.createElement('canvas');
        this.canvas.width = 800;
        this.canvas.height = 160;
        this.canvas.style.width = '100%';
        this.canvas.style.maxWidth = '800px';
        this.canvas.style.height = '160px';
        this.canvas.style.borderRadius = '8px';
        this.canvas.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
        this.canvas.style.cursor = 'pointer';
        container.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d')!;

        this.initListeners();
        this.draw();
    }

    private isBlackKey(note: number): boolean {
        const semitone = note % 12;
        return [1, 3, 6, 8, 10].includes(semitone);
    }

    private getWhiteKeyIndex(note: number): number {
        let count = 0;
        for (let n = this.startNote; n < note; n++) {
            if (!this.isBlackKey(n)) count++;
        }
        return count;
    }

    private getTotalWhiteKeys(): number {
        let count = 0;
        for (let n = this.startNote; n < this.startNote + this.numKeys; n++) {
            if (!this.isBlackKey(n)) count++;
        }
        return count;
    }

    public draw(): void {
        const width = this.canvas.width;
        const height = this.canvas.height;

        this.ctx.clearRect(0, 0, width, height);

        const totalWhiteKeys = this.getTotalWhiteKeys();
        const whiteKeyWidth = width / totalWhiteKeys;
        const blackKeyWidth = whiteKeyWidth * 0.6;
        const blackKeyHeight = height * 0.6;

        // 1. Draw White Keys
        for (let n = this.startNote; n < this.startNote + this.numKeys; n++) {
            if (!this.isBlackKey(n)) {
                const idx = this.getWhiteKeyIndex(n);
                const x = idx * whiteKeyWidth;
                const isActive = this.activeNotes.has(n);

                this.ctx.fillStyle = isActive ? '#4f46e5' : '#ffffff';
                this.ctx.fillRect(x, 0, whiteKeyWidth - 1, height);

                // Border
                this.ctx.strokeStyle = '#d1d5db';
                this.ctx.strokeRect(x, 0, whiteKeyWidth - 1, height);
            }
        }

        // 2. Draw Black Keys
        for (let n = this.startNote; n < this.startNote + this.numKeys; n++) {
            if (this.isBlackKey(n)) {
                // Find position relative to adjacent white key
                // Black key sits between white key (n-1) and (n+1)
                const leftWhiteIdx = this.getWhiteKeyIndex(n - 1);
                const x = (leftWhiteIdx + 1) * whiteKeyWidth - (blackKeyWidth / 2);
                const isActive = this.activeNotes.has(n);

                this.ctx.fillStyle = isActive ? '#4f46e5' : '#1f2937';
                this.ctx.fillRect(x, 0, blackKeyWidth, blackKeyHeight);
            }
        }
    }

    private getNoteFromCoords(clientX: number, clientY: number): number | null {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;

        const totalWhiteKeys = this.getTotalWhiteKeys();
        const whiteKeyWidth = this.canvas.width / totalWhiteKeys;
        const blackKeyWidth = whiteKeyWidth * 0.6;
        const blackKeyHeight = this.canvas.height * 0.6;

        // Check black keys first (since they are on top)
        if (y <= blackKeyHeight) {
            for (let n = this.startNote; n < this.startNote + this.numKeys; n++) {
                if (this.isBlackKey(n)) {
                    const leftWhiteIdx = this.getWhiteKeyIndex(n - 1);
                    const bx = (leftWhiteIdx + 1) * whiteKeyWidth - (blackKeyWidth / 2);
                    if (x >= bx && x <= bx + blackKeyWidth) {
                        return n;
                    }
                }
            }
        }

        // Check white keys
        const whiteIdx = Math.floor(x / whiteKeyWidth);
        let currentWhiteCount = 0;
        for (let n = this.startNote; n < this.startNote + this.numKeys; n++) {
            if (!this.isBlackKey(n)) {
                if (currentWhiteCount === whiteIdx) {
                    return n;
                }
                currentWhiteCount++;
            }
        }

        return null;
    }

    private initListeners(): void {
        let isMouseDown = false;

        this.canvas.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            const note = this.getNoteFromCoords(e.clientX, e.clientY);
            if (note !== null) {
                this.pressedKeyIndex = note;
                this.noteOn(note);
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!isMouseDown) return;
            const note = this.getNoteFromCoords(e.clientX, e.clientY);
            if (note !== this.pressedKeyIndex) {
                if (this.pressedKeyIndex !== null) {
                    this.noteOff(this.pressedKeyIndex);
                }
                if (note !== null) {
                    this.pressedKeyIndex = note;
                    this.noteOn(note);
                } else {
                    this.pressedKeyIndex = null;
                }
            }
        });

        window.addEventListener('mouseup', () => {
            if (isMouseDown) {
                isMouseDown = false;
                if (this.pressedKeyIndex !== null) {
                    this.noteOff(this.pressedKeyIndex);
                    this.pressedKeyIndex = null;
                }
            }
        });

        // Touch support
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const note = this.getNoteFromCoords(touch.clientX, touch.clientY);
            if (note !== null) {
                this.pressedKeyIndex = note;
                this.noteOn(note);
            }
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (this.pressedKeyIndex !== null) {
                this.noteOff(this.pressedKeyIndex);
                this.pressedKeyIndex = null;
            }
        });

        // Computer Keyboard support
        window.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            const key = e.key.toLowerCase();
            const note = this.keyMap[key];
            if (note !== undefined && !this.activeKeys.has(key)) {
                this.activeKeys.add(key);
                this.noteOn(note);
            }
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            const note = this.keyMap[key];
            if (note !== undefined && this.activeKeys.has(key)) {
                this.activeKeys.delete(key);
                this.noteOff(note);
            }
        });
    }

    public noteOn(note: number): void {
        this.activeNotes.add(note);
        this.draw();
        this.onNoteOn(note);
    }

    public noteOff(note: number): void {
        this.activeNotes.delete(note);
        this.draw();
        this.onNoteOff(note);
    }
}
