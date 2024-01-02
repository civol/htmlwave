HTMLWave: an HTML5-based wave viewer
====================================

HTMLWave is an HTML5-based wave viewer compatible with recent web browsers. It
can read standard Verilog HDL VCD files and present their contents graphically.

Version: 1.0.0

Usage:
------

 * To start HTMLWave, open the "htmlwave.html" file in a web browser.

 * To read a VCD file, press the "Choose File" (or "Browse") button and select
   the file you wish to read. Once loaded, the "Signal selection" pane will
   display a list of top modules. Note: If the file is invalid, no content will
   be displayed.

 * To view the content of a module: lick the triangle next to the module's name
   to view its signals or sub-modules.

 * To select a signal for display, navigate the module tree hierarchy to find
   the desired signal. Then, either double-click it or drag and drop it into
   the "Signal value" pane.

 * To deselect a displayed signal, drag and drop it from the "Signal value"
   pane back into the "Signal selection" pane.

 * To change the value representation of a signal, click on the signal in the
   "Signal value" pane. There are three possible representations: binary,
   decimal, and hexadecimal.

 * To navigate the wave view, use the slider at the bottom of the window.

 * To adjust the zoom level of the wave view, use the slider at the top of the
   window.

 * To position the value ruler, click on the "Wave view" pane where you want to
   place the ruler. The ruler indicates the value of the signals in the "Signal
   value" pane.
