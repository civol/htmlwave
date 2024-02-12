// Function for ensuring strings are HTML-compliant.
function escapeHTML(unsafe) {
    return unsafe
         .replace(/&/g, "#amp;")
         .replace(/</g, "#lt;")
         .replace(/>/g, "#gt;")
         .replace(/"/g, "#quot;")
         .replace(/'/g, "##039;");
}

// Class describing a value segment.
class Segment {
    // Build a new value segment.
    // @param value the value of the segment.
    // @param start the start time.
    // @param end   the end time.
    constructor(value,start,end) {
        this._bvalue  = value;
        this._start  = start;
        this._end    = end;
        // Generate the alternate value representations.
        if (this._bvalue.charAt(0).match(/[bB]/)) {
            // Bit vector value.
            // For the decimal mode.
            if (this._bvalue.match(/[xX]/)) {
                this._dvalue = "dX";
            } 
            else if (this._bvalue.match(/[zZ]/)) {
                this._dvalue = "dZ";
            }
            else {
                let val = 
                    parseInt(this._bvalue.substring(1,this._bvalue.length),2);
                this._dvalue = "d" + val.toString();
            }
            // For the hexadecimal mode: process 4-bit by 4-bit.
            let i = this._bvalue.length - 1;
            this._hvalue = '';
            while(i > 0) {
                let b0="0", b1="0", b2="0", b3="0";
                b0 = this._bvalue.charAt(i);
                i--;
                if (i>0) { b1 = this._bvalue.charAt(i); }
                i--;
                if (i>0) { b2 = this._bvalue.charAt(i); }
                i--;
                if (i>0) { b3 = this._bvalue.charAt(i); }
                i--;
                let hex = b3 + b2 + b1 + b0;
                if (hex.match(/[xX]/)) { hex = "X"; }
                else
                if (hex.match(/[zZ]/)) { hex = "Z"; }
                else { hex = parseInt(hex,2).toString(16); }
                this._hvalue = hex + this._hvalue;
            }
            this._hvalue = "h" + this._hvalue;
        } else {
            // Single bit value.
            this._dvalue = this._bvalue;
            this._hvalue = this._bvalue;
        }
        // Set the representation to use: by default: binary.
        this._mode = 0;
    }

    // Set the value mode:
    // 0 or 'b' for binary, 1 or 'd' for decimal, 2 or 'h' for hexadecimal,
    // nothing for rolling mode.
    set mode(m) {
        switch(m) {
            case 0:
            case 'B':
            case 'b': this._mode = 0; break;
            case 1:
            case 'D':
            case 'd': this._mode = 1; break;
            case 2:
            case 'H':
            case 'h': this._mode = 2; break;
            default:  this._mode = (this._mode + 1) % 3;
        }
    }

    get mode() { return this._mode; }

    get value() {
        switch(this._mode) {
            case 0:  return this._bvalue; break;
            case 1:  return this._dvalue; break;
            case 2:  return this._hvalue; break;
            default: return this._bvalue; break;
        }
    }

    get dvalue() { return this._dvalue; }

    get hvalue() { return this._hvalue; }

    get start() { return this._start; }

    get end()   { return this._end; }

    set end(e)  { this._end = e; }
}


// Class describing a signal.
class Signal {
    // Build a new signal.
    // @param name the name of the signal
    // @param id   the identifier of the signal (uniq).
    // @param typ  the type of the signal: 0 for void, 
    // positive for unsigned bit vector and negative for signed bit vector.
    constructor(name, id, type) {
        this._name = name;
        this._type = type;
        this._id   = escapeHTML(id);
        // The sub signals if any.
        this._subs = [];
        // The stream of values if any.
        this._segs = [];
        // The compression level.
        this._clevel = 0
        // The compressed segments by level.
        this._csegs = [ this._segs ];
    }

    // Add a sub signal.
    addSub(sub) { this._subs.push(sub); }

    // Add a segment.
    // Also ensures that the segments are consistent with each other and start
    // at time 0.
    addSegment(seg) { 
        if (this._segs.length == 0 && seg.start > 0) {
            // There is no segment starting at 0. Add one before.
            // Create an undefined value.
            let value;
            if (this.type > 1) {
                value = "b";
                for(let i=0; i<this.type; ++i) { value += "x"; }
            }
            else {
                value = "x";
            }
            // Create and add the segment.
            this._segs.push(new Segment(value,0,seg.start));
        }
        else if (this._segs.length > 0) {
            // Get the previous segment.
            let prev = this._segs[this._segs.length-1];
            if (prev.end != seg.start) {
                // The previous segment does not touch the new one, fix it.
                prev.end = seg.start;
            }
        }
        // Make the mode of the segment consistent with the others.
        if (this._segs.length > 0) {
            seg.mode = this._segs[this._segs.length-1].mode;
        }
        // Now add the new segment.
        this._segs.push(seg); 
    }

    // Advance time of the last segment.
    // @param t the target time.
    advance(t) {
        if (this._subs.length != 0) {
            // Hierarchical signal, recruse on its subs.
            for(let sub of this._subs) { sub.advance(t); }
        }
        else if (this._segs.length == 0) {
            // No segment, raise a waring.
            console.log("Warning: cannot advance time of empty signal: " + this._name);
        }
        else {
            // Change the end time of the last segment if not enough.
            let seg = this._segs[this._segs.length-1];
            if (seg.end < t) { seg.end = t; }
        }
    }

    // Clear the compression levels.
    cclear() {
        this._csegs = [ this._segs ];
    }

    // Add a compression level that remove any segment distant less and equal
    // from its previous by d units.
    compress(d) {
        // Compress the current compress level.
        let segs = this._csegs[this._clevel]
        // Set up the previously kept segment: at fist it is the first one.
        let pseg  = segs[0];
        // The compressed segments.
        let nsegs = [ pseg ];
        // Do the compression.
        for(let seg of segs) {
            if(seg.end - pseg.start > d) {
                nsegs.push(seg);
                pseg = seg;
            }
        }
        // Add the compression.
        this._csegs.push(nsegs);
    }

    // Set the value mode:
    // 0 or 'b' for binary, 1 or 'd' for decimal, 2 or 'h' for hexadecimal,
    // nothing for rolling mode.
    set mode(m) {
        for(let seg of this._segs) { seg.mode = m; }
    }

    set clevel(l) { this._clevel = l; }

    get clevel() { return this._clevel; }

    get name() { return this._name; }
    
    get id()   { return this._id; }

    get type() { return this._type; }

    get subs() { return [...this._subs]; }

    // get segs() { return [...this._segs]; }
    get segs()    { return this._csegs[this._clevel]; }

    get csegs()   { return this._csegs; }

}


// Class describing an event.
class Event {
    // Build a new event.
    // @param sig the signal the event appears on
    // @param val the value of the event
    constructor(sig,val) {
        this._signal = sig;
        this._value  = val;
    }

    get signal() {
        return this._signal;
    }

    get value() {
        return this._value;
    }
}


// Class describing a sample.
class Sample {
    // Build a new sample.
    // @param start the start time of the sample.
    // @param end   the end time of the sample.
    constructor(start,end) {
        this._start = start;
        this._end   = end;
        this._events = [];
    }

    set end(t)   { this._end = t; }

    get start()  { return this._start; }

    get end()    { return this._end; }

    get length() { return this._end - this._start; }

    get events() { return this._events; }
}


// Class describing a wave signal.
class Wave {
    // Build a new wave.
    // @param un the time unit.
    constructor(un) {
        this._unit = un;
        // The list of signals handled in the wave.
        this._signals = [];
        // The list of samples of the wave.
        this._samples = [];
    }

    // Add a signal.
    addSignal(sig) { 
        this._signals.push(sig); 
    }

    // Add a sample.
    addSample(smp) { 
        // Add the sample.
        this._samples.push(smp);
        // Update the signals' value segments.
        for(let ev of smp.events) {
            // console.log("ev=" + ev + "ev.signal=" + ev.signal);
            ev.signal.addSegment(new Segment(ev.value,smp.start,smp.end));
        }
    }

    // Get thee unit of time.
    get unit() { return this._unit; }

    // Get the signals used in the wave.
    get signals() { return [...this._signals]; }

    // Get the samples of the wave.
    get samples() { return [...this._samples]; }

    // Get the time length of the wave.
    get length() { return this._samples[this._samples.length-1].end; }
}


// Reads a vcd description from +str+ and generate the corresponding wave objet.
function read_vcd(str) {
    // Get each section.
    let sections = str.split(/\$end[^d]/);
    // First the unit is undefined.
    let unit = undefined;
    let factor = 1;
    // The table of signals reference names (mangled).
    let mangle = new Map();
    // The stack of scopes.
    let stack = [];
    // The list of top signals.
    let signals = [];
    // The list of samples.
    let samples = [];
    // The current process state.
    let state = 'def';
    // The state when start run for supporting buggy vlc which do not
    // include a first time specification.
    let firstRun = false;
    // The initial time: default 0.
    let initT = 0;

    // Process the sections.
    for(let section of sections) {
        section = section.split(/\s+/);
        switch(state) {
            case 'def':
                // Definition sessions.
                switch(section[0]) {
                    case '$date':
                    case '$version':
                    case '$comment':
                        // can skip.
                        break;
                    case '$timescale':
                        // Get the unit and the time multiplying factor.
                        factor = parseInt(section[1].match(/\d+/)[0]);
                        unit   = section[1].match(/[^\d]+/)[0];
                        break;
                    case '$scope':
                        // Entering a new scope.
                        state = 'scope';
                        // Create and add the corresponding signal.
                        let sigscope = new Signal(section[2],section[2]);
                        signals.push(sigscope);
                        stack.push(sigscope);
                        break;
                    case '$enddefinitions':
                        // End of definitions, entering initialization state.
                        state = 'init';
                        break;
                    default:
                }
                break;

            case 'scope':
                // Scope session. 
                switch(section[0]) {
                    case '$scope':
                        // Entering a new scope.
                        // Create and add the corresponding signal.
                        let sigscope = new Signal(section[2],section[2]);
                        stack[stack.length-1].addSub(sigscope);
                        // And push it onto the stack.
                        stack.push(sigscope);
                        break;
                    case '$var':
                        // Declare a leaf signal.
                        // Create and add the corresponding signal.
                        let sig = new Signal(section[4],section[3],parseInt(section[2]));
                        stack[stack.length-1].addSub(sig);
                        // Remember the mangled name.
                        mangle.set(section[3],sig);
                        break;
                    case '$upscope':
                        if (stack.length == 0) {
                            throw 'Scope stack underflow.';
                        }
                        stack.pop();
                        if (stack.length == 0) {
                            // End of a full scope, go back to def.
                            state = 'def';
                        }
                        break;
                    default:
                }
                break;

            case 'init':
                // console.log("init " + section[0]);
                // Init session.
                if (section[0].match(/#\d+/)) {
                    let tok = section[0];
                    // Initial time given, compute and remember it.
                    initT = Number(tok.substring(1,tok.length-1))*factor;
                    // console.log("Init time set to: " + initT);
                    // Shift seection to go on processing.
                    section.shift();
                }
                if (section[0] == '$dumpvars') {
                    // console.log("dumpvars");
                    // Create the first time sample (i.e., initialization)
                    let sample = new Sample(initT);
                    samples.push(sample);
                    // Note: the first element of the section is not part
                    // of an event.
                    for(let i=0; i<section.length-2; i+=2) {
                        // console.log("section[i+1]=" + section[i+1] + " section[i+2]=" + section[i+2]);
                        if (section[i+1].match(/^[01xz]/)) {
                            // One-bit event case.
                            // console.log("One-bit for: " + section[i+1]);
                            // console.log("str=" + section[i+1].substring(1,section[i+1].length) + " signal=" + mangle.get(section[i+1].substring(1,section[i+1].length)));
                            sample.events.push(new Event(mangle.get(section[i+1].substring(1,section[i+1].length)),section[i+1].charAt(0)));
                            i = i-1;
                        } else {
                            // console.log("Multi-bit for: "+ section[i+1] + " " + section[i+2]);
                            sample.events.push(new Event(mangle.get(section[i+2]),section[i+1]));
                        }
                    }
                    break;
                }
                else {
                    // End of initialization go straight to the next session.
                    state = 'run';
                    firstRun = true;
                    // So no break.
                }

            case 'run':
                // console.log("run");
                // Run session.
                // Rearrange by time steps.
                let sample = undefined;
                let value  = undefined;
                for(let tok of section) {
                    // console.log("tok=" + tok);
                    if (!tok.match(/#\d+/) && firstRun) {
                        // The is a bug in the vcd: there should be a # here.
                        // Assume init time.
                        samples[samples.length-1].end = initT;
                        // Start of a new sample.
                        sample = new Sample(initT);
                        samples.push(sample);
                    }
                    // Not the first run any longer.
                    firstRun = false;

                    // Go on with the normal processing.
                    if (tok.match(/#\d+/)) {
                        // Compute the time stamp.
                        let t = Number(tok.substring(1,tok.length-1))*factor;
                        // Update the end of the previous sample.
                        samples[samples.length-1].end = t;
                        // Start of a new sample.
                        sample = new Sample(t);
                        samples.push(sample);
                    }
                    else if (!value) {
                        if (tok.match(/^[01xz]/)) {
                            // One-bit event case.
                            // console.log("One-bit for: " + tok);
                            // console.log("str=" + tok.substring(1,tok.length) + " signal=" + mangle.get(tok.substring(1,tok.length)));
                            sample.events.push(new Event(mangle.get(tok.substring(1,tok.length)),tok.charAt(0)));
                            value = undefined;
                        // console.log("event= " + sample.events[sample.events.length-1] + " event.signal=" + sample.events[sample.events.length-1].signal);
                        } else {
                            // New event, gets its value.
                            value = tok;
                        }
                    }
                    else {
                        // End of event, gets its signal, create and add it.
                        sample.events.push(new Event(mangle.get(tok),value));
                        // Clear the value for starting the next event.
                        value = undefined;
                        // console.log("event= " + sample.events[sample.events.length-1] + " event.signal=" + sample.events[sample.events.length-1].signal);
                    }
                }
                break;

            default:
        }
    }
    // Where there a touble?
    if (samples.length < 1) {
        // Yes, return an undefined value.
        return undefined;
    }

    // Remove the last sample if its end is not defined.
    if (!samples[samples.length-1].end) {
        samples.pop();
    }

    const wave = new Wave(unit);
    for(let sig of signals) { wave.addSignal(sig) }
    for(let sam of samples) { wave.addSample(sam) }

    // Advance the time of all the signals to the last sample end.
    let lastT = samples[samples.length-1].end;
    for(let sig of signals) { sig.advance(lastT); }

    return wave;
}


