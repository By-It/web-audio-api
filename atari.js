var Atari = (function ()
{
	var Class = function ()
	{
		this.output = new AudioBuffer( bufferSize );
		this.voices = [];
		this.noteMap = [];
		this.pulseLfoDepth = 0.0;
		this.pulseLfoPhaseVelocity = 0.0;
		this.modPhaseVelocity = 220.0 / sampleRate;
	};

	var Voice = function ( synth, frequency, volume, panning )
	{
		this.synth = synth;
		this.phase = Math.random();
		this.phaseIncr = frequency / sampleRate;
		this.gainL = 1.0 - Math.pow( ( panning + 1.0 ) / 2.0, 2.0 ) * volume;
		this.gainR = 1.0 - Math.pow( ( panning - 1.0 ) / 2.0, 2.0 ) * volume;
		this.gate = true;
		this.envelope = 0.0;
		this.envelopeVelocity = 500.0 / sampleRate; // 2ms
		this.pulseLfoPhase = Math.random();
		this.modPhase = Math.random();
	};

	Voice.prototype = {
		processAudioAdd: function ( output, from, to )
		{
			var pulseLfoPhase = this.synth.pulseLfoPhaseVelocity;

			for( var i = from; i < to; ++i )
			{
				if( this.gate )
				{
					if( this.envelope < 1.0 )
					{
						this.envelope += this.envelopeVelocity;
						if( this.envelope > 1.0 )
							this.envelope = 1.0;
					}
				}
				else
				{
					if( this.envelope > 0.0 )
					{
						this.envelope -= this.envelopeVelocity;
						if( this.envelope < 0.0 )
							return true;
					}
				}

				var modValue = Math.sin( this.modPhase * 2.0 * Math.PI );
				this.modPhase += this.synth.modPhaseVelocity;

				var pulseLfoValue = ( 1.0 + Math.sin( this.pulseLfoPhase * Math.PI ) * this.synth.pulseLfoDepth ) / 2.0;
				this.pulseLfoPhase += pulseLfoPhase;

				var amp = 0.0;

				amp += this.phase < pulseLfoValue ? 0.2 : -0.2;
				amp *= modValue;
				amp *= this.envelope;

				output.l[i] += amp * this.gainL;
				output.r[i] += amp * this.gainR;

				this.phase += this.phaseIncr;
				this.phase -= Math.floor( this.phase );
			}
			return false;
		},
		processRelease: function ()
		{
			this.gate = false;
		}
	};

	Class.prototype = {
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
		processNoteOn: function ( note, velocity )
		{
			var voiceA = new Voice( this, noteToFrequency( note + 0.01 ), velocity, -1.0 );
			var voiceB = new Voice( this, noteToFrequency( note - 0.01 ), velocity, 1.0 );
			this.noteMap[note] = [voiceA, voiceB]
			this.voices.push( voiceA, voiceB );
		},
		processNoteOff: function ( note )
		{
			this.noteMap[note][0].processRelease();
			this.noteMap[note][1].processRelease();
		}
	};

	return Class;
})();

var atari = new Atari();


var delay = new Delay( timeInfo.millisToNumFrames( 200 ) );
delay.wet = 0.1;
delay.feedback = 0.9;

var render = function ( barFrom, barTo )
{
	atari.processAudio( 0, bufferSize );
	delay.processAudio( atari.output, 0, bufferSize );
	return delay.output;
};

Midi.noteOn = function ( note, velocity )
{
	atari.processNoteOn( note, velocity );
};

Midi.noteOff = function ( note )
{
	atari.processNoteOff( note );
};

Midi.anyMessage = function ( cmd, p0, p1 )
{
	if( cmd == 0xB0 )
	{
		var value = p1 / 127.0;
		var minFrequency;
		var maxFrequency;
		var frequency;

		switch( p0 )
		{
			case 7:
				minFrequency = 0.1;
				maxFrequency = 999.0;
				frequency = Math.min( minFrequency * Math.exp( value * Math.log( maxFrequency / minFrequency ) ), maxFrequency );
				atari.pulseLfoPhaseVelocity = frequency / sampleRate;
				break;

			case 74:
				atari.pulseLfoDepth = value;
				break;

			case 71:
				minFrequency = 30.0;
				maxFrequency = 12000.0;
				frequency = Math.min( minFrequency * Math.exp( value * Math.log( maxFrequency / minFrequency ) ), maxFrequency );
				atari.modPhaseVelocity = frequency / sampleRate;
		}

		console.log( p0, value );
	}
};