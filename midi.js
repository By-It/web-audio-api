// Simplest Midi Setup
//
var Midi = (function() {
  var callback = {
    onInit: function(inputs) {},
    anyMessage: function(cmd, p1, p2) {},
    noteOn: function(note, velocity) {},
    noteOff: function(note) {}
  };
  success = function(midiAccess) {
    console.log("we have midi...");
    var onMidiMessage = function(e) {
      var command = e.data[0] & 0xF0; // ignore the channel
      var param1 = e.data[1];
      var param2 = e.data[2];
      
      callback.anyMessage(command, param1, param2);

      if (command == 0x80) {
        callback.noteOff(param1);
      } else
      if (command == 0x90) {
        var midiVelocity = param2;
        if (0 === midiVelocity) // velocity zero > noteOff
        {
          callback.noteOff(param1);
        } else {
          callback.noteOn(param1, midiVelocity / 127.0);
        }
      }
    };
    var inputs = midiAccess.inputs();
    for (var i = 0; i < inputs.length; ++i) {
      var input = inputs[i];
      input.onmidimessage = onMidiMessage;
    }

    // Avoid GC
    window.midiInputs = inputs;
    callback.onInit(inputs);
  };
  error = function(e) {
    console.log("error", e);
  };
  navigator.requestMIDIAccess().then(success, error);
  return callback;
})();