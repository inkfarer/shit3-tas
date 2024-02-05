// Heavily inspired by GSAP - The GreenSock Animation Platform.
// License: https://gsap.com/community/standard-license/

class Ticker {
    constructor() {
        this.getTime = () => performance.now();
        this.lagThreshold = Infinity;
        this.adjustedLag = 16;
        this.startTime = this.getTime();
        this.lastUpdate = this.startTime;
        this.gap = 1000 / 60;
        this.nextTime = this.gap;
        this.listeners = [];
        this.time = 0;
        this.frame = 0;
        this.active = false;
        this.req = requestAnimationFrame.bind(window);
        this.fakeTime = 0;
        this.fakeTimeDelta = 16;
    }

    tick(v) {
        let elapsed = this.getTime() - this.lastUpdate,
            manual = v === true,
            overlap,
            dispatch,
            time,
            frame;
        (elapsed > this.lagThreshold || elapsed < 0) && (this.startTime += elapsed - this.adjustedLag);
        this.lastUpdate += elapsed;
        time = this.lastUpdate - this.startTime;
        overlap = time - this.nextTime;
        if (overlap > 0 || manual) {
            this.frame++;
            this.delta = time - self.time * 1000;
            this.time = time / 1000;
            this.nextTime += overlap + (overlap >= this.gap ? 4 : this.gap - overlap);
            this.fakeTime += this.fakeTimeDelta;
            dispatch = 1;
        }
        manual || (this.id = this.req(this.tick.bind(this)));
        if (dispatch) {
            this.callListeners(v);
        }
    }

    callListeners(v) {
        for (let i = 0; i < this.listeners.length; i++) {
            this.listeners[i](this.fakeTime, this.delta, this.frame, v);
        }
    }

    sleep(reset) {
        cancelAnimationFrame(this.id);
        this.active = false;
        if (reset) {
            this.frame = 0;
            this.time = 0;
            this.fakeTime = 0;
            this.startTime = this.getTime();
            this.lastUpdate = this.startTime;
            this.nextTime = this.gap;
        }
        this.req = () => 1;
    }

    wake() {
        this.id && this.sleep();
        this.req = requestAnimationFrame.bind(window);
        this.active = true;
        this.tick(2);
    }

    add(callback, once, prioritize) {
        const func = once ? (t, d, f, v) => {
            callback(t, d, f, v);

            this.remove(func);
        } : callback;

        this.remove(callback);

        this.listeners[prioritize ? 'unshift' : 'push'](func);

        return func;
    }

    remove(callback, i) {
        ~(i = this.listeners.indexOf(callback)) && this.listeners.splice(i, 1) && this.i >= i && this.i--;
    }
}
