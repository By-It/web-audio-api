// Simple Drum-machine
//
var DrumMachine = (function ()
{
	var DrumMachine = function ()
	{
		this.output = new AudioBuffer( bufferSize );
		this.voices = [];
		this.groove = Groove.Identity;
//		this.groove = new Groove.Shuffle( 0.6, 1.0 / 8.0 );
		this.pattern = [];
		this.samples = [];
	};

	var Voice = function ( buffer, velocity )
	{
		this.buffer = buffer;
		this.velocity = velocity;
		this.position = 0.0; // seconds
		this.duration = buffer.duration; // seconds
	};

	Voice.prototype = {
		processAudioAdd: function ( output, from, to )
		{
			var sl = this.buffer.getChannelData( 0 );
			var sr = this.buffer.getChannelData( 2 == this.buffer.numberOfChannels ? 1 : 0 );

			for( var i = from; i < to; ++i )
			{
				var sampleIndex = (this.position * this.buffer.sampleRate) | 0;

				output.l[i] += sl[sampleIndex] * this.velocity;
				output.r[i] += sr[sampleIndex] * this.velocity;

				this.position += 1.0 / sampleRate;
				if( this.position >= this.duration )
					return true;
			}
			return false;
		}
	};

	DrumMachine.prototype = {
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
			if( !this.samples )
				return;
			for( var i = 0; i < this.pattern.length; ++i )
			{
				var sample = this.samples[i];
				if( !sample )
					continue;
				if( this.pattern[i][event.index % 16] )
					this.voices.push( new Voice( sample, 1.0 ) );
			}
		},
		processNote: function ( note, velocity )
		{
			var sample = this.samples[note % this.samples.length];
			if( !sample )
				return;
			this.voices.push( new Voice( sample, velocity ) );
		},
		loadSample: function ( url, index )
		{
			var samples = this.samples;
			loadSample( url, function ( buffer )
			{
				samples[index] = buffer;
			} );
		}
	};

	return DrumMachine;
})();

var machine = new DrumMachine();

var sampleUrls = [
	"808.kick.wav",
	"808.snare.wav",
	"808.rim.wav",
	"808.clap.wav",
	"808.closed.wav",
	"808.opened.wav",
	"android.wav",
];

for( var i = 0; i < sampleUrls.length; ++i )
	machine.loadSample( "http://files.andre-michelle.com/samples/" + sampleUrls[i], i );

machine.pattern = [
	[1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1],
	[0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0],
	[0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
	[0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0],
	[0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0]
];

Midi.noteOn = function ( note, velocity )
{
	machine.processNote( note, velocity );
};

var render = function ( barFrom, barTo )
{
	machine.process( barFrom, barTo );
	return machine.output;
};