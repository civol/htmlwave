// Class for display a wave in a canvas.
class CanvasWave {
    // Build a new canvas wave viewer.
    // @param cnv  the target canvas.
    // @param pal  the color palette for displaying waves.
    // @param wave the wave to display.
    constructor(cnv,pal,wave) {
        // Initialize the canvas, context and wave accessers.
        this._canvas   = cnv;
        this._context  = this._canvas.getContext("2d");
        this._palette  = pal;
        this._wave     = wave;
        // Initialize the zoom factor and position.
        this._zoom     = 100;
        this._position = 0;
        // Initialize the list of signal drawings.
        this._signals  = [];
        // Intialize the signal vertical drawing parameters.
        this._top = 35;
        this._size = 10;
        this._corner = 5;
        this._space = 5;
        // Intialize the value ruler to 0.
        this._ruler = 0;
    }

    // Add a signal to draw.
    add(sig) {
        this._signals.push(sig);
        // // Also resize if required.
        // let newHeight = this._signals.length * (this._size*2 + this._space) + 
        //     this._top;
        // console.log("Height: " + this.height + " to " + newHeight + "(" + this._canvas.height + "," + this._canvas.style.height + ")" );
        // if (newHeight > this.height) {
        //     console.log("Resizing from: " + this.height + " to " + newHeight);
        //     // Get the DPR and size of the canvas
        //     const dpr = window.devicePixelRatio;
        //     const rect = this._canvas.getBoundingClientRect();

        //     // Set the "actual" size of the canvas
        //     // this._canvas.width = rect.width * dpr;
        //     // this._canvas.height = rect.height * dpr;
        //     // this._canvas.height = newHeight * dpr;

        //     // Scale the context to ensure correct drawing operations
        //     // this._context.scale(dpr, dpr);

        //     // Set the "drawn" size of the canvas
        //     // this._canvas.style.width = `${rect.width}px`;
        //     // this._canvas.style.height = `${rect.height}px`;
        //     this._canvas.style.height = `${rect.newHeight}px`;
        // }
    }

    // Delete a signal to draw.
    del(sig) {
        this._signals.splice(this._signals.indexOf(sig),1);
    }

    // Update the zoom factor.
    set zoom(z) {
        this._zoom = z;
    }

    // Update the position.
    set position(pos) {
        this._position = pos;
    }

    // Update the ruler position.
    set ruler(pos) {
        this._ruler = pos;
    }

    // Get the ruler position.
    get ruler() {
        return this._ruler;
    }

    // Get the wave being viewed.
    get wave() {
        return this._wave;
    }

    // Get the display width in pixels.
    get width() {
        return this._canvas.getBoundingClientRect().width;
        // return this._canvas.width;
    }

    // Get the display width in time unit.
    get widthT() {
        return this.end - this.start;
    }

    // Get the display height in pixels.
    get height() {
        return this._canvas.getBoundingClientRect().height;
        // return this._canvas.height;
    }

    // Get the height of one signal display.
    get heightS() {
        return (this._size*2 + this._space);
    }

    // Get the start time of display.
    get start() {
        return this._position;
    }

    // Get the end time of display.
    // Note: computed to fit the screen, hence can go past the length of the
    //       wave.
    get end() {
        return this._position + (this._wave.length*(100-this._zoom))/100;
    }

    // Convert a time to a pixel x position.
    toPx(val) {
        return Math.trunc((val * this.width) / (this.end-this.start));
    }

    // Convert a pixel x position to a time.
    toT(val) {
        return (val * (this.end-this.start) / this.width) + this.start;
    }

    // Compute the width in pixels of a text.
    textWidth(txt) {
        return this._context.measureText(txt).width;
    }


    // Get the value of signal sig at the ruler position.
    value(sig) {
        for(let seg of sig.segs) {
            if (seg.start <= this._ruler && seg.end > this._ruler)  {
                return seg.value;
            }
        }
        return "?";
    }



    // Clears the viewer.
    clear() {
        this._context.clearRect(0, 0, this.width, this.height);
    }

    // Display the time axis.
    draw() {
        // Estimate the number of gradations.
        let num = Math.trunc(this.width / 40);

        // Compute the gradation step.
        let fstep = Math.trunc((this.end - this.start) / num);
        let step = fstep;
        // Ensure the step is 1, 2, 5, 10, 20 and so on.
        let count = 0;
        while(step > 10) { step = step / 10; count = count + 1; }
        step = Math.trunc(step);
        switch(step) {
            case 0:
            case 1:
                step = 1;
                break;
            case 2:
            case 3:
            case 4:
                step = 2;
                break;
            case 5:
            case 6:
            case 7:
            case 8:
            case 9:
                step = 5;
                break;
            default:
                step = 10;
                break;
        }
        step = step * Math.pow(10,count);

        // Compute the postion of the first gradation.
        // let first_pos = Math.trunc((this.start + step) % step);
        let first_pos = step - this.start % step;
        if (first_pos == step) { first_pos = 0; }
        let pos = first_pos;
        this._context.lineWidth = 1;
        this._context.strokeStyle = this._palette.signal;
        this._context.fillStyle = this._palette.text;
        this._context.font = "12px Courier New";
            // this._context.fillText("pos=" + pos + " zoom=" + this._zoom + " length=" + this._wave.length + " start=" + this.start + " end=" + this.end + " width=" + this.width + " num=" + num + " fstep=" + fstep + " step=" + step + " toPx(step)=" + this.toPx(step), 100, 250);

        // Draw the graphics.
        context.beginPath();

        // Draw the gradations.
        while(pos < this.end) {
            this._context.moveTo(this.toPx(pos),14);
            this._context.lineTo(this.toPx(pos),20);
            pos += step;
        }
        // Draw the axis.
        this._context.moveTo(0,17);
        this._context.lineTo(this.width,17);

        // Draw the ruler.
        if (this._ruler >= this.start && this._ruler < this.end) {
            for(let i=20; i<this.height-1; i += 4) {
                this._context.moveTo(this.toPx(this._ruler-this.start), i);
                this._context.lineTo(this.toPx(this._ruler-this.start), i+2);
            }
        }

        // Draw the signals to display.
        this._context.font = "14px Courier New"; // Bigger font for signals.
        let y = this._top;
        for(sig of this._signals) {
            // console.log("sig=" + sig.id + " y=" + y);
            if (sig.type > 1) {
                // Multi-bit case.
                for(let i in sig.segs) {
                    let seg = sig.segs[i];
                    // console.log(" seg: " + seg.start + "," + seg.end + " " + seg.value);
                    if(seg.start < this.end && seg.end > this.start) {
                        // Can draw.
                        // Compute the start.
                        let x0 = this.toPx(seg.start-this.start);
                        let l0 = x0 + this._corner;
                        if (x0 <= 0) { x0 = 0; l0 = x0; }
                        let x1 = this.toPx(seg.end-this.start);
                        let l1 = x1 - this._corner;
                        if (x1 >= this.width-1) { x1 = this.width-1; l1 = x1; }
                        if (i >= sig.segs.length-1) { l1 = this.width-1; }
                        // console.log("x0=" + x0 + " x1=" + x1 + " l0=" + l0 + " l1=" + l1);
                        // Draw the start transition.
                        if (x0 != 0) {
                            this._context.moveTo(x0+this._corner,y-this._size);
                            this._context.lineTo(x0,y);
                            this._context.lineTo(x0+this._corner,y+this._size);
                        }
                        // Draw the value lines.
                        this._context.moveTo(l0,y-this._size);
                        this._context.lineTo(l1,y-this._size);
                        this._context.moveTo(l0,y+this._size);
                        this._context.lineTo(l1,y+this._size);

                        // Draw the value text.
                        let txt = seg.value
                        let vPos = l0 + (l1-l0 - this.textWidth(txt)) / 2;
                        if (vPos < l0) {
                            // The text is too large, cut it.
                            let diffC = (l0-vPos)*2 / this.textWidth("0");
                            txt = txt.substring(0,txt.length-diffC-1) + "~";
                            vPos = l0 + this._corner;
                            if (vPos+this.textWidth(txt) > l1-this._corner) {
                                vPos = vPos - this._corner; 
                            }
                        }
                        if (l1-this._corner > this.textWidth("0")) {
                            this._context.fillText(txt, Math.trunc(vPos), Math.trunc(y+this._size/2));
                        }

                        // Draw the end transition.
                        if (x1 != this.width-1 && i < sig.segs.length-1) {
                            this._context.moveTo(x1-this._corner,y-this._size);
                            this._context.lineTo(x1,y);
                            this._context.lineTo(x1-this._corner,y+this._size);
                        }
                    }
                }
            }
            else {
                // Single-bit case.
                for(let i in sig.segs) {
                    let seg = sig.segs[i];
                    // console.log(" seg: " + seg.start + "," + seg.end + " " + seg.value);
                    if(seg.start < this.end && seg.end > this.start) {
                        // Can draw.
                        // Compute the start.
                        let x0 = this.toPx(seg.start-this.start);
                        if (x0 <= 0) { x0 = 0; }
                        let x1 = this.toPx(seg.end-this.start);
                        if (x1 >= this.width-1) { x1 = this.width-1; }
                        // Draw the start transition.
                        this._context.moveTo(x0,y-this._size);
                        this._context.lineTo(x0,y+this._size);
                        // Draw the value lines.
                        // console.log("seg.value=" + seg.value);
                        switch(seg.value) {
                            case "0":
                                this._context.moveTo(x0,y+this._size);
                                this._context.lineTo(x1,y+this._size);
                                break;
                            case "1":
                                this._context.moveTo(x0,y-this._size);
                                this._context.lineTo(x1,y-this._size);
                                break;
                            case "z":
                                this._context.moveTo(x0,y);
                                this._context.lineTo(x1,y);
                                break;
                            default:
                                for(let i = x0+this._corner; i< x1; 
                                    i += this._corner) {
                                    this._context.moveTo(i,y-this._size);
                                    this._context.lineTo(i-this._corner,y+this._size);
                                }
                        }
                        // Draw the end transition.
                        this._context.moveTo(x0,y-this._size);
                        this._context.lineTo(x0,y+this._size);
                    }
                }
            }
            y += this._size*2 + this._space;
        }

        this._context.stroke();

        // Draw the gradation values.
        this._context.font = "12px Courier New"; // Smaller font for the axis.
        // Calculate the max value width to adjust the frequency of text.
        let textMax = this.textWidth(this.wave.length.toString());
        let textFac = Math.ceil((textMax+4) / this.toPx(step));
        switch(textFac) {
            case 1:
            case 2:
                break;
            case 3:
            case 4:
            case 5:
                textFac = 5;
                break;
            default:
                textFac = 10;
        }
        // Place the gradation values.
        pos = first_pos;
        let val = Math.trunc(this.start / (step*textFac)) * (step*textFac);
        if (this.start % (step*textFac) != 0) { val += step*textFac*2; }
        if (this.start % (step*textFac) != 0) { pos += step; }
        if (this.start % (step*textFac) > step) { pos -= step; }
        while(pos < this.end) {
            let txt = val.toString();
            let x = Math.round(this.toPx(pos)-this.textWidth(txt)/2)-1;
            if (x<0 && pos == 0) { x = 0; }
            /* No text overlap, can display. */
            this._context.fillText(txt, x , 12);
            pos += step * textFac;
            val += step * textFac;
        }
    }
}

