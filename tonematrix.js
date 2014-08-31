var ToneMatrix = (function ()
{
	var Notes = [
		72 + 24, 69 + 24, 67 + 24, 65 + 24, 62 + 24, 60 + 24,
		69 + 12, 67 + 12, 65 + 12, 62 + 12, 60 + 12,
		69, 67, 65, 62, 60
	];

	var Class = function ()
	{
		this.output = new AudioBuffer( bufferSize );
		this.voices = [];
		this.groove = Groove.Identity;
	};

	var Voice = function ( frequency, volume, panning )
	{
		this.phase = 0.0;
		this.phaseIncr = frequency / sampleRate;
		this.gainL = 1.0 - Math.pow( ( panning + 1.0 ) / 2.0, 2.0 ) * volume;
		this.gainR = 1.0 - Math.pow( ( panning - 1.0 ) / 2.0, 2.0 ) * volume;
		this.remaining = timeInfo.millisToNumFrames( 500.0 );
		this.durationInv = 0.4 / this.remaining;
	};

	Voice.prototype = {
		processAudioAdd: function ( output, from, to )
		{
			for( var i = from; i < to; ++i )
			{
				if( 0 === --this.remaining )
					return true;
				var env = this.remaining * this.durationInv;
				var amp = sin( this.phase += this.phaseIncr ) * env * env;
				output.l[i] += amp * this.gainL;
				output.r[i] += amp * this.gainR;
			}
			return false;
		}
	};

	ToneMatrix.prototype = {
		process: function ( from, to )
		{
			var o = this;
			fragmentAudio( this.groove.fragmentTime( from, to, 1.0 / 16.0 ), bufferSize, o.processAudio.exe( o ), o.processEvent.exe( o ) );
		},
		processAudio: function ( from, to )
		{
			this.output.zero( from, to );
			var voiceIndex = this.voices.length;
			while( --voiceIndex > -1 )
			{
				if( this.voices[voiceIndex].processAudioAdd( this.output, from, to ) )
					this.voices.splice( voiceIndex, 1 );
			}
		},
		processEvent: function ( event )
		{
			if( undefined === this.pattern )
				return;
			for( var i = 0; i < 16; ++i )
			{
				if( this.pattern[i][event.index % 16] )
					this.voices.push( new Voice( noteToFrequency( Notes[i] ), 0.5, Math.random() - Math.random() ) );
			}
		},
		processNoteOn: function ( note, velocity )
		{
			this.voices.push( new Voice( noteToFrequency( note ), velocity, Math.random() - Math.random() ) );
		}
	};

	return Class;
})();

var toneMatrix = new ToneMatrix();

toneMatrix.pattern = [
 [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
 [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
 [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
 [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
 [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
 [0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
 [0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
 [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0],
 [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
 [0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
 [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0],
 [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0],
 [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
 [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
 [0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
 [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
 ];

var render = function ( barFrom, barTo )
{
	toneMatrix.process( barFrom, barTo );
	return toneMatrix.output;
};

/*var delay = new Delay(timeInfo.barsToNumFrames(3.0 / 16.0));

 var render = function(barFrom, barTo) {
 toneMatrix.process(barFrom, barTo);
 delay.processAudio(toneMatrix.output, 0, bufferSize);
 return delay.output;
 };*/

Midi.noteOn = function ( note, velocity )
{
	toneMatrix.processNoteOn( note, velocity );
};