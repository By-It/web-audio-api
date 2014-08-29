var Delay = (function() {
  var Delay = function(size) {
    this.size = Math.round( size );
    this.buffer = new AudioBuffer(this.size).clear();
    this.output = new AudioBuffer(bufferSize);
    this.writeIndex = 0;
    this.readOffset = this.size;
    this.feedback = 0.7;
    this.wet = 0.3;
    this.dry = 0.9;
  }
  Delay.prototype = {
    processAudio: function(input, from, to) {
      for (var i = from; i < to; ++i) {
        
        var il = input.l[i];
        var ir = input.r[i];
        
        var readIndex = this.writeIndex - this.readOffset;
        if( readIndex < 0 )
          readIndex += this.size;

        var dl = this.buffer.l[readIndex];
        var dr = this.buffer.r[readIndex];
        
        this.buffer.l[this.writeIndex] = il + dl * this.feedback;
        this.buffer.r[this.writeIndex] = ir + dr * this.feedback;
        
        this.output.l[i] = il * this.dry + dl * this.wet;
        this.output.r[i] = ir * this.dry + dr * this.wet;

        if (++this.writeIndex === this.size)
          this.writeIndex = 0;
      }
    }
  };
  return Delay;
})();