// Minimal Audio Setup
var audioContext = new (window.AudioContext || window.webkitAudioContext)();
var sampleRate = audioContext.sampleRate;
var scriptProcessor = audioContext.createScriptProcessor( 1024, 0, 2 );
var bufferSize = scriptProcessor.bufferSize;
scriptProcessor.connect( audioContext.destination );
scriptProcessor.onaudioprocess = function ( event )
{
	var barFrom = timeInfo.barPosition;
	var barTo = barFrom + (timeInfo.transporting ? timeInfo.numFramesToBars( bufferSize ) : 0.0);

	// function 'render' needs to be defined outside
	var buffer = render( barFrom, barTo );

	if( undefined === buffer )
		return;

	timeInfo.barPosition = barTo;

	var outputBuffer = event.outputBuffer;
	var ol = outputBuffer.getChannelData( 0 );
	var or = outputBuffer.getChannelData( 1 );
	var bl = buffer.l;
	var br = buffer.r;

	for( var i = 0; i < bufferSize; ++i )
	{
		ol[i] = bl[i];
		or[i] = br[i];
	}
};

var render = function ( barFrom, barTo ) { /* Define rendering here */ };

// TimeInfo
//
var timeInfo = {
	bpm: 120.0,
	barPosition: 0.0,
	transporting: false,
	barsToNumFrames: function ( bars )
	{
		return (bars * sampleRate * 240.0) / this.bpm;
	},
	numFramesToBars: function ( numFrames )
	{
		return (numFrames * this.bpm) / (sampleRate * 240.0);
	},
	millisToNumFrames: function ( millis )
	{
		return millis / 1000.0 * sampleRate
	}
};

// Sample Loader
//
var loadSample = function ( url, success )
{
	var request = new XMLHttpRequest();
	request.open( 'GET', url, true );
	request.responseType = 'arraybuffer';
	request.onload = function ()
	{
		audioContext.decodeAudioData( request.response, success, function () { console.log( "error", arguments ); } );
	};
	request.send();
};

// Js Helper
//
Function.prototype.exe = function ( o )
{
	var f = this;
	return function ()
	{
		f.apply( o, arguments )
	};
};

// Midi Note
//
var noteToFrequency = function ( midiNote )
{
	return 440.0 * Math.pow( 2.0, (midiNote + 3.0) / 12.0 - 6.0 );
};

// AudioBuffer
//
var AudioBuffer = function ( size )
{
	this.size = size;

	this.l = new Float64Array( size );
	this.r = new Float64Array( size );
};

AudioBuffer.prototype = {
	zero: function ( from, to )
	{
		var l = this.l;
		var r = this.r;
		for( var i = from; i < to; ++i )
			l[i] = r[i] = 0.0;
	},
	clear: function ()
	{
		var l = this.l;
		var r = this.r;
		for( var i = 0; i < this.size; ++i )
			l[i] = r[i] = 0.0;
		return this;
	}
};

// Fragment musical time section
//
var fragmentTime = function ( from, to, scale )
{
	var index = Math.floor( from / scale );
	var position = index * scale;
	var events = [];
	while( position < to )
	{
		if( position >= from )
			events.push( {
				position: position,
				index: index
			} );
		position = ++index * scale;
	}

	return events;
};

// Fragment audio block with request to incoming events
//
var fragmentAudio = function ( events, numFrames, dsp, eventReceiver )
{
	var localBlockIndex = 0;
	while( events.length )
	{
		var event = events.shift();
		var eventBlockIndex = Math.floor( timeInfo.barsToNumFrames( event.position - timeInfo.barPosition ) );
		if( localBlockIndex < eventBlockIndex )
		{
			dsp( localBlockIndex, eventBlockIndex );
			localBlockIndex = eventBlockIndex;
		}
		eventReceiver( event );
	}
	if( localBlockIndex < numFrames )
		dsp( localBlockIndex, numFrames );
};

// Waveforms
//
var sin = function ( phase )
{
	return Math.sin( phase * 2.0 * Math.PI );
};

var tri = function ( phase )
{
	var x = phase - Math.floor( phase );
	return x > 0.5 ? 3.0 - x * 4.0 : x * 4.0 - 1.0;
};

var saw = function ( phase )
{
	var x = phase - Math.floor( phase );
	return x * 2.0 - 1.0;
};